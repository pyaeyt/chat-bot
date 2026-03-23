import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import {
  findUserByEmail,
  createUser,
  verifyPassword,
  createThreadWithMessage,
  listThreadsForProfessor,
  listThreadsForStudent,
  getThreadMeta,
  getThreadMessages,
  addMessageToThread,
  listProfessorDirectory,
  findUserById,
  listAllThreads,
  createPasswordResetForEmail,
  resetPasswordWithToken,
  updateProfessorProfile,
  type Role,
} from "./db.js";
import { signToken } from "./auth.js";
import { requireAuth, requireRole, type AuthedRequest } from "./middleware.js";
import { answerQuestion, transcribeAudio, translateText, type TargetLanguage } from "./llm.js";
import {
  isMailConfigured,
  sendNewStudentMessageEmail,
  sendPasswordResetEmail,
} from "./mail.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024,
  },
});

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "256kb" }));

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const e = email.trim().toLowerCase();
  if (!e || !e.includes("@")) return null;
  return e;
}

/** Public register: students by default; professor if valid PROFESSOR_INVITE */
app.post("/api/auth/register", (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const displayName =
    typeof req.body?.displayName === "string" ? req.body.displayName.trim() : "";
  const invite =
    typeof req.body?.professorInviteCode === "string" ? req.body.professorInviteCode : "";

  if (!email || password.length < 8) {
    res.status(400).json({
      error: "Valid email and password (min 8 characters) are required.",
    });
    return;
  }
  if (findUserByEmail(email)) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const envInvite = process.env.PROFESSOR_INVITE?.trim();
  let role: Role = "student";
  if (envInvite && invite === envInvite) {
    role = "professor";
  }

  try {
    const user = createUser(email, password, displayName || email.split("@")[0]!, role);
    const token = signToken(user.id, user.email, user.role);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        title: user.title ?? "",
        officeHours: user.office_hours ?? "",
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Registration failed." });
  }
});

app.post("/api/auth/login", (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(user, password)) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }
  const token = signToken(user.id, user.email, user.role);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      title: user.title ?? "",
      officeHours: user.office_hours ?? "",
    },
  });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!email) {
    res.status(400).json({ error: "Email is required." });
    return;
  }
  const created = createPasswordResetForEmail(email);
  const appUrl = process.env.APP_URL?.trim();

  if (created && isMailConfigured()) {
    try {
      await sendPasswordResetEmail({
        to: email,
        resetToken: created.token,
        appUrl,
      });
    } catch (e) {
      console.error("[mail] forgot-password", e);
    }
  }

  const exposeToken = Boolean(
    created &&
      (process.env.NODE_ENV !== "production" || process.env.DEV_RETURN_RESET_TOKEN === "true")
  );
  res.json({
    ok: true,
    message:
      "If an account exists for that email, password reset instructions have been sent (when email is configured).",
    ...(exposeToken && created ? { devResetToken: created.token } : {}),
  });
});

app.post("/api/auth/reset-password", (req, res) => {
  const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
  if (!token || newPassword.length < 8) {
    res.status(400).json({ error: "Valid token and new password (min 8 characters) are required." });
    return;
  }
  const ok = resetPasswordWithToken(token, newPassword);
  if (!ok) {
    res.status(400).json({ error: "Invalid or expired reset link." });
    return;
  }
  res.json({ ok: true, message: "Password updated. You can sign in now." });
});

app.get("/api/auth/me", requireAuth, (req: AuthedRequest, res) => {
  const u = req.user!;
  const row = findUserById(u.id);
  res.json({
    user: {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      title: row?.title ?? "",
      officeHours: row?.office_hours ?? "",
    },
  });
});

app.patch(
  "/api/me/profile",
  requireAuth,
  requireRole("professor", "admin"),
  (req: AuthedRequest, res) => {
    const officeHours =
      typeof req.body?.officeHours === "string" ? req.body.officeHours : "";
    const title = typeof req.body?.title === "string" ? req.body.title : "";
    updateProfessorProfile(req.user!.id, officeHours, title);
    const row = findUserById(req.user!.id);
    res.json({
      user: {
        id: req.user!.id,
        email: req.user!.email,
        displayName: req.user!.displayName,
        role: req.user!.role,
        title: row?.title ?? "",
        officeHours: row?.office_hours ?? "",
      },
    });
  }
);

/** Student: Ask AI */
app.post(
  "/api/ask-ai",
  requireAuth,
  requireRole("student", "admin"),
  async (req: AuthedRequest, res) => {
    const question = typeof req.body?.question === "string" ? req.body.question : "";
    const result = await answerQuestion(question);
    res.json({
      canAnswer: result.canAnswer,
      message: result.message,
      source: result.source,
    });
  }
);

/** Student: transcribe recorded voice to text (optionally translate to target language). */
app.post(
  "/api/speech/transcribe",
  requireAuth,
  requireRole("student", "admin"),
  upload.single("audio"),
  async (req: AuthedRequest, res) => {
    if (!process.env.HUGGINGFACE_API_KEY && !process.env.HF_API_KEY && !process.env.OPENAI_API_KEY) {
      res.status(503).json({
        error:
          "Speech transcription is not configured on the server. Set HUGGINGFACE_API_KEY (recommended) or OPENAI_API_KEY.",
      });
      return;
    }
    const file = req.file;
    if (!file?.buffer?.length) {
      res.status(400).json({ error: "Audio file is required." });
      return;
    }
    const targetRaw = typeof req.body?.targetLanguage === "string" ? req.body.targetLanguage : "";
    const target =
      targetRaw === "en" || targetRaw === "th" ? (targetRaw as TargetLanguage) : undefined;
    try {
      const result = await transcribeAudio(file.buffer, file.mimetype || "audio/webm", target);
      if (!result.text) {
        res.status(502).json({ error: "Could not transcribe the recording." });
        return;
      }
      res.json({
        text: result.text,
        translatedText: result.translatedText,
        sourceLanguage: result.sourceLanguage ?? "",
      });
    } catch (e) {
      console.error("[speech] transcribe failed", e);
      res.status(500).json({ error: "Transcription failed." });
    }
  }
);

/** Student: translate text to English or Thai. */
app.post(
  "/api/translate",
  requireAuth,
  requireRole("student", "admin"),
  async (req: AuthedRequest, res) => {
    const text = typeof req.body?.text === "string" ? req.body.text : "";
    const targetRaw = typeof req.body?.targetLanguage === "string" ? req.body.targetLanguage : "";
    if (!text.trim()) {
      res.status(400).json({ error: "Text is required." });
      return;
    }
    if (targetRaw !== "en" && targetRaw !== "th") {
      res.status(400).json({ error: "targetLanguage must be 'en' or 'th'." });
      return;
    }
    try {
      const translated = await translateText(text, targetRaw as TargetLanguage);
      res.json({ translatedText: translated });
    } catch (e) {
      console.error("[translate] failed", e);
      res.status(500).json({ error: "Translation failed." });
    }
  }
);

/** Student: list professors to message */
app.get(
  "/api/professors",
  requireAuth,
  requireRole("student", "admin"),
  (_req, res) => {
    res.json({ professors: listProfessorDirectory() });
  }
);

/** Student: start thread to a specific professor */
app.post(
  "/api/messages",
  requireAuth,
  requireRole("student", "admin"),
  (req: AuthedRequest, res) => {
    const professorId = typeof req.body?.professorId === "string" ? req.body.professorId : "";
    const subject = typeof req.body?.subject === "string" ? req.body.subject : "";
    const body = typeof req.body?.body === "string" ? req.body.body : "";
    if (!professorId || !body.trim()) {
      res.status(400).json({ error: "Professor and message body are required." });
      return;
    }
    const prof = findUserById(professorId);
    if (!prof || prof.role !== "professor") {
      res.status(400).json({ error: "Invalid professor selected." });
      return;
    }
    const studentId = req.user!.id;
    const { threadId } = createThreadWithMessage(studentId, professorId, subject, body);
    const studentRow = findUserById(studentId);
    const studentName = studentRow?.display_name ?? "Student";

    if (isMailConfigured() && prof.email) {
      void sendNewStudentMessageEmail({
        to: prof.email,
        professorName: prof.display_name,
        studentName,
        subject: subject.trim() || "Message",
        bodyPreview: body,
        appUrl: process.env.APP_URL?.trim(),
      }).catch((e) => console.error("[mail] new message", e));
    }

    res.status(201).json({
      threadId,
      message: "Message sent to professor's inbox.",
    });
  }
);

/** Student: my threads */
app.get(
  "/api/student/threads",
  requireAuth,
  requireRole("student", "admin"),
  (req: AuthedRequest, res) => {
    const threads = listThreadsForStudent(req.user!.id).map((t) => ({
      id: t.id,
      subject: t.subject,
      professorName: t.professorName,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      lastMessage: t.lastMessage,
      messageCount: t.messageCount,
    }));
    res.json({ threads });
  }
);

/** Professor: inbox */
app.get(
  "/api/inbox",
  requireAuth,
  requireRole("professor", "admin"),
  (req: AuthedRequest, res) => {
    const raw =
      req.user!.role === "admin"
        ? listAllThreads()
        : listThreadsForProfessor(req.user!.id);
    const threads = raw.map((t) => ({
      id: t.id,
      studentName: t.studentName,
      professorName: t.professorName,
      subject: t.subject,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      lastMessage: t.lastMessage,
      messageCount: t.messageCount,
    }));
    res.json({ threads });
  }
);

/** Admin could extend to see all threads — for now admin uses student/prof flows */
app.get(
  "/api/inbox/:threadId",
  requireAuth,
  (req: AuthedRequest, res) => {
    const { threadId } = req.params;
    const meta = getThreadMeta(threadId);
    if (!meta) {
      res.status(404).json({ error: "Thread not found." });
      return;
    }
    const u = req.user!;
    const allowed =
      u.role === "admin" ||
      (u.role === "student" && meta.studentId === u.id) ||
      (u.role === "professor" && meta.professorId === u.id);
    if (!allowed) {
      res.status(403).json({ error: "You cannot access this conversation." });
      return;
    }
    const msgs = getThreadMessages(threadId);
    res.json({
      id: meta.id,
      subject: meta.subject,
      createdAt: meta.createdAt,
      studentName: meta.studentName,
      professorName: meta.professorName,
      messages: msgs.map((m) => ({
        id: m.id,
        fromRole: m.fromRole === "professor" || m.fromRole === "admin" ? "professor" : "student",
        body: m.body,
        createdAt: m.createdAt,
      })),
    });
  }
);

app.post(
  "/api/inbox/:threadId/reply",
  requireAuth,
  requireRole("professor", "admin"),
  (req: AuthedRequest, res) => {
    const { threadId } = req.params;
    const body = typeof req.body?.body === "string" ? req.body.body : "";
    if (!body.trim()) {
      res.status(400).json({ error: "Reply body is required." });
      return;
    }
    const meta = getThreadMeta(threadId);
    if (!meta) {
      res.status(404).json({ error: "Thread not found." });
      return;
    }
    if (req.user!.role === "professor" && meta.professorId !== req.user!.id) {
      res.status(403).json({ error: "This thread is not assigned to you." });
      return;
    }
    const reply = addMessageToThread(threadId, req.user!.id, body);
    if (!reply) {
      res.status(500).json({ error: "Failed to send reply." });
      return;
    }
    res.status(201).json({
      message: "Reply sent to student.",
      reply: {
        id: reply.id,
        body: reply.body,
        createdAt: reply.createdAt,
      },
    });
  }
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  const hasHf = Boolean(process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY);
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY);
  console.log(`Edu chatbot API http://localhost:${PORT}`);
  console.log(
    `[ai] providers: huggingface=${hasHf ? "configured" : "missing"}, openai=${hasOpenAi ? "configured" : "missing"}`
  );
});

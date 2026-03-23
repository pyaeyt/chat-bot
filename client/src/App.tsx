import { useCallback, useEffect, useState } from "react";
import { authFetch, getStoredToken, setStoredToken } from "./api";

const apiBase = import.meta.env.VITE_API_URL ?? "";

type AppRole = "student" | "professor" | "admin";

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: AppRole;
  title?: string;
  officeHours?: string;
}

type StudentScreen = "menu" | "ask-ai" | "ask-professor" | "my-thread";

type AnswerSource = "knowledge" | "llm" | "fallback";

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  isFallback?: boolean;
  source?: AnswerSource;
}

interface InboxSummary {
  id: string;
  studentName: string;
  professorName?: string;
  subject: string;
  createdAt: string;
  lastMessage: string;
  messageCount: number;
}

interface ThreadMessage {
  id: string;
  fromRole: "student" | "professor";
  body: string;
  createdAt: string;
}

interface ThreadDetail {
  id: string;
  subject: string;
  createdAt?: string;
  studentName: string;
  professorName?: string;
  messages: ThreadMessage[];
}

interface StudentThreadListItem {
  id: string;
  subject: string;
  professorName: string;
  lastMessage: string;
  messageCount: number;
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [studentScreen, setStudentScreen] = useState<StudentScreen>("menu");
  const [professorScreen, setProfessorScreen] = useState<"inbox" | "thread">("inbox");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }
    void (async () => {
      try {
        const res = await authFetch(apiBase, "/api/auth/me");
        if (!res.ok) throw new Error("me");
        const data = (await res.json()) as { user: AuthUser };
        setUser({
          ...data.user,
          title: data.user.title ?? "",
          officeHours: data.user.officeHours ?? "",
        });
      } catch {
        setStoredToken(null);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    setStudentScreen("menu");
    setProfessorScreen("inbox");
    setSelectedThreadId(null);
  }, []);

  const onAuthSuccess = useCallback((token: string, u: AuthUser) => {
    setStoredToken(token);
    setUser(u);
    setStudentScreen("menu");
    setProfessorScreen("inbox");
    setSelectedThreadId(null);
  }, []);

  if (authLoading) {
    return (
      <div className="app-shell">
        <div className="card">
          <p className="subtitle" style={{ margin: 0 }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-shell">
        <header className="card">
          <span className="badge">Educational AI</span>
          <h1>Campus assistant</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            Sign in with your school email. Your role is set by the server—not chosen on this screen.
          </p>
        </header>
        <AuthPanel
          onSuccess={(token, u) => {
            onAuthSuccess(token, {
              ...u,
              title: u.title ?? "",
              officeHours: u.officeHours ?? "",
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="card">
        <span className="badge">Educational AI</span>
        <h1>Campus assistant</h1>
        <p className="subtitle">
          Signed in as <strong>{user.displayName}</strong> ({user.email}) ·{" "}
          <span style={{ textTransform: "capitalize" }}>{user.role}</span>
        </p>
        <div className="btn-row" style={{ marginTop: "0.5rem" }}>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      {(user.role === "student" || user.role === "admin") && (
        <StudentFlow
          screen={studentScreen}
          setScreen={setStudentScreen}
          selectedThreadId={selectedThreadId}
          setSelectedThreadId={setSelectedThreadId}
        />
      )}

      {(user.role === "professor" || user.role === "admin") && (
        <ProfessorFlow
          screen={professorScreen}
          setScreen={setProfessorScreen}
          selectedThreadId={selectedThreadId}
          setSelectedThreadId={setSelectedThreadId}
          viewerRole={user.role}
        />
      )}

      {(user.role === "professor" || user.role === "admin") && (
        <ProfessorProfileCard
          user={user}
          onUpdated={(u) =>
            setUser({
              ...user,
              title: u.title ?? "",
              officeHours: u.officeHours ?? "",
            })
          }
        />
      )}

      {user.role === "admin" && (
        <section className="card" style={{ marginTop: "1rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Admin</h2>
          <p className="hint" style={{ margin: 0 }}>
            You can use both student tools (above) and the professor inbox (below). Inbox shows{" "}
            <strong>all</strong> threads.
          </p>
        </section>
      )}
    </div>
  );
}

function readResetTokenFromUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    return new URLSearchParams(window.location.search).get("reset")?.trim() ?? "";
  } catch {
    return "";
  }
}

function clearResetQueryParam(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("reset")) return;
  url.searchParams.delete("reset");
  window.history.replaceState({}, "", url.pathname + url.search);
}

function AuthPanel({ onSuccess }: { onSuccess: (token: string, u: AuthUser) => void }) {
  const initialReset = readResetTokenFromUrl();
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">(
    initialReset ? "reset" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [professorInviteCode, setProfessorInviteCode] = useState("");
  const [resetToken, setResetToken] = useState(initialReset);
  const [newPassword, setNewPassword] = useState("");
  const [forgotInfo, setForgotInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goLogin = () => {
    setMode("login");
    setErr(null);
    setForgotInfo(null);
    clearResetQueryParam();
    setResetToken("");
  };

  const submitLoginRegister = async () => {
    setErr(null);
    setLoading(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { email, password, displayName, professorInviteCode };
      const res = await fetch(`${apiBase}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        token?: string;
        user?: AuthUser;
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error ?? "Request failed.");
        return;
      }
      if (data.token && data.user) onSuccess(data.token, data.user);
    } catch {
      setErr("Network error. Is the API running?");
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async () => {
    setErr(null);
    setForgotInfo(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        devResetToken?: string;
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error ?? "Request failed.");
        return;
      }
      let msg = data.message ?? "Check your email for reset instructions.";
      if (data.devResetToken) {
        msg += ` (Dev token: ${data.devResetToken})`;
      }
      setForgotInfo(msg);
    } catch {
      setErr("Network error. Is the API running?");
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async () => {
    setErr(null);
    setForgotInfo(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Reset failed.");
        return;
      }
      setForgotInfo(data.message ?? "Password updated. You can sign in.");
      clearResetQueryParam();
      setNewPassword("");
      setMode("login");
    } catch {
      setErr("Network error. Is the API running?");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "forgot") {
    return (
      <section className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Forgot password</h2>
        <p className="hint">We&apos;ll email a reset link when SMTP is configured on the server.</p>
        <div className="field">
          <label htmlFor="fem">Email</label>
          <input
            id="fem"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
          />
        </div>
        {err && <p className="error">{err}</p>}
        {forgotInfo && <div className="success-banner">{forgotInfo}</div>}
        <div className="btn-row">
          <button type="button" className="btn btn-primary" disabled={loading} onClick={() => void submitForgot()}>
            {loading ? "Sending…" : "Send reset"}
          </button>
          <button type="button" className="btn" onClick={goLogin}>
            Back to log in
          </button>
        </div>
      </section>
    );
  }

  if (mode === "reset") {
    return (
      <section className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Set new password</h2>
        <p className="hint">Paste the token from your email (or dev response).</p>
        <div className="field">
          <label htmlFor="rtok">Reset token</label>
          <input
            id="rtok"
            value={resetToken}
            onChange={(e) => setResetToken(e.target.value)}
            placeholder="Token from email link"
          />
        </div>
        <div className="field">
          <label htmlFor="npw">New password</label>
          <input
            id="npw"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 8 characters"
          />
        </div>
        {err && <p className="error">{err}</p>}
        {forgotInfo && <div className="success-banner">{forgotInfo}</div>}
        <div className="btn-row">
          <button type="button" className="btn btn-primary" disabled={loading} onClick={() => void submitReset()}>
            {loading ? "Saving…" : "Update password"}
          </button>
          <button type="button" className="btn" onClick={goLogin}>
            Log in instead
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="btn-row" style={{ marginTop: 0 }}>
        <button
          type="button"
          className={mode === "login" ? "btn btn-primary" : "btn"}
          onClick={() => {
            setMode("login");
            setErr(null);
            setForgotInfo(null);
          }}
        >
          Log in
        </button>
        <button
          type="button"
          className={mode === "register" ? "btn btn-primary" : "btn"}
          onClick={() => {
            setMode("register");
            setErr(null);
            setForgotInfo(null);
          }}
        >
          Register
        </button>
      </div>
      <p className="hint" style={{ marginTop: "1rem" }}>
        New accounts are <strong>students</strong> by default. To register as a professor, your school
        must give you a <strong>professor invite code</strong> (set as <code>PROFESSOR_INVITE</code>{" "}
        on the server).
      </p>
      <div className="field">
        <label htmlFor="em">Email</label>
        <input
          id="em"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@school.edu"
        />
      </div>
      <div className="field">
        <label htmlFor="pw">Password</label>
        <input
          id="pw"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
        />
      </div>
      {mode === "login" && (
        <p style={{ margin: "0 0 0.75rem" }}>
          <button type="button" className="btn btn-ghost" style={{ padding: 0 }} onClick={() => setMode("forgot")}>
            Forgot password?
          </button>
        </p>
      )}
      {mode === "register" && (
        <>
          <div className="field">
            <label htmlFor="dn">Display name</label>
            <input
              id="dn"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How professors see your name"
            />
          </div>
          <div className="field">
            <label htmlFor="inv">Professor invite code (optional)</label>
            <input
              id="inv"
              value={professorInviteCode}
              onChange={(e) => setProfessorInviteCode(e.target.value)}
              placeholder="Only if registering as faculty"
            />
          </div>
        </>
      )}
      {err && <p className="error">{err}</p>}
      {forgotInfo && mode === "login" && <div className="success-banner">{forgotInfo}</div>}
      <div className="btn-row">
        <button
          type="button"
          className="btn btn-primary"
          disabled={loading}
          onClick={() => void submitLoginRegister()}
        >
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </div>
    </section>
  );
}

function ProfessorProfileCard({
  user,
  onUpdated,
}: {
  user: AuthUser;
  onUpdated: (u: { title: string; officeHours: string }) => void;
}) {
  const [title, setTitle] = useState(user.title ?? "");
  const [officeHours, setOfficeHours] = useState(user.officeHours ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(user.title ?? "");
    setOfficeHours(user.officeHours ?? "");
  }, [user.title, user.officeHours]);

  const save = async () => {
    setErr(null);
    setStatus(null);
    setSaving(true);
    try {
      const res = await authFetch(apiBase, "/api/me/profile", {
        method: "PATCH",
        body: JSON.stringify({ title, officeHours }),
      });
      const data = (await res.json()) as { user?: AuthUser; error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Could not save.");
        return;
      }
      if (data.user) {
        onUpdated({
          title: data.user.title ?? "",
          officeHours: data.user.officeHours ?? "",
        });
      }
      setStatus("Profile saved. Students see this on the professor directory.");
    } catch {
      setErr("Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card" style={{ marginTop: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Your faculty profile</h2>
      <p className="subtitle" style={{ marginBottom: "1rem" }}>
        Shown to students when they choose a professor to message.
      </p>
      <div className="field">
        <label htmlFor="ptitle">Title / department</label>
        <input
          id="ptitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Associate Professor, Computer Science"
        />
      </div>
      <div className="field">
        <label htmlFor="poh">Office hours</label>
        <textarea
          id="poh"
          value={officeHours}
          onChange={(e) => setOfficeHours(e.target.value)}
          placeholder="e.g. Tue/Thu 1–3 PM, Room 205"
        />
      </div>
      {err && <p className="error">{err}</p>}
      {status && <div className="success-banner">{status}</div>}
      <div className="btn-row">
        <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </section>
  );
}

function StudentFlow({
  screen,
  setScreen,
  selectedThreadId,
  setSelectedThreadId,
}: {
  screen: StudentScreen;
  setScreen: (s: StudentScreen) => void;
  selectedThreadId: string | null;
  setSelectedThreadId: (id: string | null) => void;
}) {
  const [myThreads, setMyThreads] = useState<StudentThreadListItem[]>([]);

  const loadThreads = useCallback(async () => {
    try {
      const res = await authFetch(apiBase, "/api/student/threads");
      if (!res.ok) return;
      const data = (await res.json()) as { threads: StudentThreadListItem[] };
      setMyThreads(data.threads);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (screen === "menu") void loadThreads();
  }, [screen, loadThreads]);

  if (screen === "menu") {
    return (
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Student</h2>
        <p className="subtitle" style={{ marginBottom: "1rem" }}>
          Ask the campus AI or message a specific professor.
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={() => setScreen("ask-ai")}>
            Ask AI
          </button>
          <button type="button" className="btn" onClick={() => setScreen("ask-professor")}>
            Ask professors
          </button>
        </div>
        {myThreads.length > 0 && (
          <>
            <h3 style={{ fontSize: "0.95rem", marginTop: "1.25rem", marginBottom: "0.5rem" }}>
              Your conversations
            </h3>
            <ul className="thread-list">
              {myThreads.map((th) => (
                <li key={th.id}>
                  <button
                    type="button"
                    className="thread-item"
                    onClick={() => {
                      setSelectedThreadId(th.id);
                      setScreen("my-thread");
                    }}
                  >
                    <strong>{th.subject}</strong>
                    <span>
                      {th.professorName} · {th.messageCount} message(s)
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    );
  }

  if (screen === "ask-ai") {
    return <AskAIView onBack={() => setScreen("menu")} />;
  }

  if (screen === "ask-professor") {
    return (
      <AskProfessorView
        onBack={() => setScreen("menu")}
        onSent={(threadId) => {
          setSelectedThreadId(threadId);
          void loadThreads();
        }}
      />
    );
  }

  return (
    <StudentThreadView
      threadId={selectedThreadId}
      onBack={() => {
        setSelectedThreadId(null);
        setScreen("menu");
      }}
    />
  );
}

function AskAIView({ onBack }: { onBack: () => void }) {
  const [input, setInput] = useState("");
  const [log, setLog] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speechTarget, setSpeechTarget] = useState<"original" | "en" | "th">("original");
  const [answerLanguage, setAnswerLanguage] = useState<"original" | "en" | "th">("original");
  const [err, setErr] = useState<string | null>(null);
  const [speechInfo, setSpeechInfo] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      Boolean(window.MediaRecorder) &&
      Boolean(navigator.mediaDevices?.getUserMedia);
    setSpeechSupported(supported);
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  const maybeTranslate = async (text: string): Promise<string> => {
    if (answerLanguage === "original") return text;
    try {
      const tr = await authFetch(apiBase, "/api/translate", {
        method: "POST",
        body: JSON.stringify({
          text,
          targetLanguage: answerLanguage,
        }),
      });
      if (!tr.ok) return text;
      const trData = (await tr.json()) as { translatedText?: string };
      return trData.translatedText?.trim() || text;
    } catch {
      return text;
    }
  };

  const send = async (forcedText?: string) => {
    const q = (forcedText ?? input).trim();
    if (!q || loading) return;
    setErr(null);
    setSpeechInfo(null);
    setInput("");
    const userTurn: ChatTurn = { id: crypto.randomUUID(), role: "user", text: q };
    setLog((prev) => [...prev, userTurn]);
    setLoading(true);
    try {
      const res = await authFetch(apiBase, "/api/ask-ai", {
        method: "POST",
        body: JSON.stringify({ question: q }),
      });
      if (res.status === 401) {
        setErr("Session expired. Please sign in again.");
        return;
      }
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as {
        canAnswer: boolean;
        message: string;
        source?: AnswerSource;
      };
      const source = data.source ?? (data.canAnswer ? "knowledge" : "fallback");
      const localized = await maybeTranslate(data.message);
      setLog((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: localized,
          isFallback: !data.canAnswer,
          source,
        },
      ]);
    } catch {
      setErr("Could not reach the assistant. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    if (!speechSupported || recording || loading) return;
    setErr(null);
    setSpeechInfo(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : undefined,
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      recorder.onstop = async () => {
        setRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        if (chunks.length === 0) return;
        setLoading(true);
        setSpeechInfo("Transcribing voice…");
        try {
          const blob = new Blob(chunks, { type: chunks[0]?.type || "audio/webm" });
          const form = new FormData();
          form.append("audio", blob, "voice.webm");
          if (speechTarget !== "original") form.append("targetLanguage", speechTarget);
          const res = await authFetch(apiBase, "/api/speech/transcribe", {
            method: "POST",
            body: form,
          });
          const data = (await res.json()) as {
            text?: string;
            translatedText?: string;
            sourceLanguage?: string;
            error?: string;
          };
          if (!res.ok) {
            setErr(data.error ?? "Could not transcribe voice.");
            return;
          }
          const transcript = (data.translatedText || data.text || "").trim();
          if (!transcript) {
            setErr("No speech detected. Please try again.");
            return;
          }
          setSpeechInfo(
            data.sourceLanguage
              ? `Transcribed (${data.sourceLanguage})${data.translatedText ? " and translated" : ""}.`
              : "Transcribed successfully."
          );
          setInput(transcript);
        } catch {
          setErr("Voice transcription failed.");
        } finally {
          setLoading(false);
        }
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch {
      setErr("Microphone permission denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") return;
    mediaRecorder.stop();
  };

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Ask AI</h2>
      <p className="subtitle" style={{ marginBottom: "1rem" }}>
        Uses the campus FAQ first, then optional OpenAI if <code>OPENAI_API_KEY</code> is set on the
        server. If unsure, you&apos;ll be advised to contact your teacher.
      </p>
      <div className="field" style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="speech-target">Voice transcription output language</label>
        <select
          id="speech-target"
          value={speechTarget}
          onChange={(e) => setSpeechTarget(e.target.value as "original" | "en" | "th")}
          style={{
            width: "100%",
            padding: "0.65rem 0.75rem",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: "0.95rem",
          }}
        >
          <option value="original">Keep original language</option>
          <option value="en">English</option>
          <option value="th">Thai</option>
        </select>
      </div>
      <div className="field" style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="answer-language">Assistant answer language</label>
        <select
          id="answer-language"
          value={answerLanguage}
          onChange={(e) => setAnswerLanguage(e.target.value as "original" | "en" | "th")}
          style={{
            width: "100%",
            padding: "0.65rem 0.75rem",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: "0.95rem",
          }}
        >
          <option value="original">Original</option>
          <option value="en">English</option>
          <option value="th">Thai</option>
        </select>
      </div>
      <div className="chat-log">
        {log.length === 0 && (
          <p className="hint" style={{ margin: 0 }}>
            Try: &quot;What are library hours?&quot; or &quot;exam regulations&quot;.
          </p>
        )}
        {log.map((t) =>
          t.role === "user" ? (
            <div key={t.id} className="bubble user">
              <div className="bubble-meta">You</div>
              {t.text}
            </div>
          ) : (
            <div key={t.id} className={`bubble ai${t.isFallback ? " fallback" : ""}`}>
              <div className="bubble-meta">
                {t.isFallback
                  ? "Assistant (escalation)"
                  : t.source === "llm"
                    ? "Assistant (AI)"
                    : t.source === "knowledge"
                      ? "Assistant (FAQ)"
                      : "Assistant"}
              </div>
              {t.text}
            </div>
          )
        )}
      </div>
      {err && <p className="error">{err}</p>}
      {speechInfo && <p className="hint">{speechInfo}</p>}
      <div className="field" style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="ai-q">Your question</label>
        <textarea
          id="ai-q"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Where is the campus? When is the library open?"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
      </div>
      <div className="btn-row" style={{ marginTop: 0 }}>
        <button type="button" className="btn btn-primary" disabled={loading} onClick={() => void send()}>
          {loading ? "Thinking…" : "Send"}
        </button>
        {speechSupported ? (
          recording ? (
            <button type="button" className="btn" disabled={loading} onClick={stopRecording}>
              Stop recording
            </button>
          ) : (
            <button type="button" className="btn" disabled={loading} onClick={() => void startRecording()}>
              Record voice
            </button>
          )
        ) : (
          <button type="button" className="btn" disabled>
            Voice not supported
          </button>
        )}
        <button type="button" className="btn" onClick={onBack}>
          Back
        </button>
      </div>
    </section>
  );
}

function AskProfessorView({
  onBack,
  onSent,
}: {
  onBack: () => void;
  onSent: (threadId: string) => void;
}) {
  const [professors, setProfessors] = useState<
    Array<{ id: string; email: string; displayName: string; title: string; officeHours: string }>
  >([]);
  const [professorId, setProfessorId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await authFetch(apiBase, "/api/professors");
        if (!res.ok) return;
        const data = (await res.json()) as {
          professors: Array<{
            id: string;
            email: string;
            displayName: string;
            title: string;
            officeHours: string;
          }>;
        };
        setProfessors(data.professors);
        if (data.professors.length === 1) setProfessorId(data.professors[0]!.id);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const submit = async () => {
    setErr(null);
    setStatus(null);
    setSending(true);
    try {
      const res = await authFetch(apiBase, "/api/messages", {
        method: "POST",
        body: JSON.stringify({ professorId, subject, body }),
      });
      const data = (await res.json()) as { threadId?: string; message?: string; error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Failed to send.");
        return;
      }
      setStatus(data.message ?? "Message sent to professor's inbox.");
      if (data.threadId) onSent(data.threadId);
      setBody("");
    } catch {
      setErr("Network error. Start the API server (see README).");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Ask professors</h2>
      <p className="subtitle" style={{ marginBottom: "1rem" }}>
        Choose a professor and send a message to their inbox.
      </p>
      {status && <div className="success-banner">{status}</div>}
      <div className="field">
        <label htmlFor="prof">Professor</label>
        <select
          id="prof"
          value={professorId}
          onChange={(e) => setProfessorId(e.target.value)}
          style={{
            width: "100%",
            padding: "0.65rem 0.75rem",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: "0.95rem",
          }}
        >
          <option value="">Select a professor…</option>
          {professors.map((p) => (
            <option key={p.id} value={p.id}>
              {p.displayName} ({p.email})
            </option>
          ))}
        </select>
      </div>
      {professorId ? (
        <div
          className="hint"
          style={{
            marginTop: "-0.5rem",
            marginBottom: "1rem",
            padding: "0.75rem",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg)",
          }}
        >
          {(() => {
            const p = professors.find((x) => x.id === professorId);
            if (!p) return null;
            return (
              <>
                {p.title ? (
                  <div style={{ marginBottom: 6 }}>
                    <strong>Title:</strong> {p.title}
                  </div>
                ) : null}
                {p.officeHours ? (
                  <div>
                    <strong>Office hours:</strong> {p.officeHours}
                  </div>
                ) : (
                  <span>No office hours listed yet.</span>
                )}
              </>
            );
          })()}
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="sub">Subject</label>
        <input
          id="sub"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Question about Assignment 3"
        />
      </div>
      <div className="field">
        <label htmlFor="msg">Message</label>
        <textarea
          id="msg"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message…"
        />
      </div>
      {err && <p className="error">{err}</p>}
      <div className="btn-row">
        <button type="button" className="btn btn-primary" disabled={sending} onClick={() => void submit()}>
          {sending ? "Sending…" : "Send to inbox"}
        </button>
        <button type="button" className="btn" onClick={onBack}>
          Back
        </button>
      </div>
    </section>
  );
}

function StudentThreadView({
  threadId,
  onBack,
}: {
  threadId: string | null;
  onBack: () => void;
}) {
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!threadId) return;
    setErr(null);
    try {
      const res = await authFetch(apiBase, `/api/inbox/${threadId}`);
      if (res.status === 403) {
        setErr("You cannot open this conversation.");
        return;
      }
      if (!res.ok) throw new Error("not found");
      setThread((await res.json()) as ThreadDetail);
    } catch {
      setErr("Could not load conversation.");
    }
  }, [threadId]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 4000);
    return () => clearInterval(t);
  }, [load]);

  if (!threadId) {
    return (
      <section className="card">
        <p>No conversation selected.</p>
        <button type="button" className="btn" onClick={onBack}>
          Back
        </button>
      </section>
    );
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Conversation</h2>
      <p className="subtitle" style={{ marginBottom: "1rem" }}>
        Refreshes every few seconds when your professor replies.
      </p>
      {err && <p className="error">{err}</p>}
      {thread && (
        <>
          <p style={{ margin: "0 0 1rem", fontSize: "0.9rem" }}>
            <strong>{thread.subject}</strong>
            <br />
            <span className="hint" style={{ marginTop: 0 }}>
              Professor: {thread.professorName ?? "—"}
            </span>
          </p>
          {thread.messages.map((m) => (
            <div key={m.id} className="msg-row">
              <div className={`msg-from${m.fromRole === "professor" ? " prof" : ""}`}>
                {m.fromRole === "student" ? "You" : "Professor"}
              </div>
              <div>{m.body}</div>
            </div>
          ))}
        </>
      )}
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => void load()}>
          Refresh
        </button>
        <button type="button" className="btn" onClick={onBack}>
          Back
        </button>
      </div>
    </section>
  );
}

function ProfessorFlow({
  screen,
  setScreen,
  selectedThreadId,
  setSelectedThreadId,
  viewerRole,
}: {
  screen: "inbox" | "thread";
  setScreen: (s: "inbox" | "thread") => void;
  selectedThreadId: string | null;
  setSelectedThreadId: (id: string | null) => void;
  viewerRole: AppRole;
}) {
  const [threads, setThreads] = useState<InboxSummary[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const loadInbox = useCallback(async () => {
    setErr(null);
    try {
      const res = await authFetch(apiBase, "/api/inbox");
      if (!res.ok) throw new Error("fail");
      const data = (await res.json()) as { threads: InboxSummary[] };
      setThreads(data.threads);
    } catch {
      setErr("Could not load inbox.");
    }
  }, []);

  useEffect(() => {
    if (screen === "inbox") void loadInbox();
  }, [screen, loadInbox]);

  if (screen === "inbox") {
    return (
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Professor inbox</h2>
        <p className="subtitle" style={{ marginBottom: "1rem" }}>
          {viewerRole === "admin"
            ? "All student threads (admin view)."
            : "Threads from students who messaged you."}
        </p>
        {err && <p className="error">{err}</p>}
        {threads.length === 0 && !err && (
          <p className="hint">No messages yet. Students pick you from &quot;Ask professors&quot;.</p>
        )}
        <ul className="thread-list">
          {threads.map((th) => (
            <li key={th.id}>
              <button
                type="button"
                className="thread-item"
                onClick={() => {
                  setSelectedThreadId(th.id);
                  setScreen("thread");
                }}
              >
                <strong>{th.subject}</strong>
                <span>
                  {th.studentName}
                  {viewerRole === "admin" && th.professorName ? ` · ${th.professorName}` : ""} ·{" "}
                  {th.messageCount} message(s)
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => void loadInbox()}>
            Refresh inbox
          </button>
        </div>
      </section>
    );
  }

  return (
    <ProfessorThreadView
      threadId={selectedThreadId}
      onBack={() => {
        setScreen("inbox");
        setSelectedThreadId(null);
        void loadInbox();
      }}
    />
  );
}

function ProfessorThreadView({
  threadId,
  onBack,
}: {
  threadId: string | null;
  onBack: () => void;
}) {
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [reply, setReply] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!threadId) return;
    setErr(null);
    try {
      const res = await authFetch(apiBase, `/api/inbox/${threadId}`);
      if (!res.ok) throw new Error("nf");
      setThread((await res.json()) as ThreadDetail);
    } catch {
      setErr("Thread not found.");
    }
  }, [threadId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sendReply = async () => {
    if (!threadId || !reply.trim()) return;
    setSending(true);
    setErr(null);
    setOk(null);
    try {
      const res = await authFetch(apiBase, `/api/inbox/${threadId}/reply`, {
        method: "POST",
        body: JSON.stringify({ body: reply }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Failed.");
        return;
      }
      setOk(data.message ?? "Reply sent to student.");
      setReply("");
      await load();
    } catch {
      setErr("Network error.");
    } finally {
      setSending(false);
    }
  };

  if (!threadId) {
    return (
      <section className="card">
        <p>No thread selected.</p>
        <button type="button" className="btn" onClick={onBack}>
          Back to inbox
        </button>
      </section>
    );
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Review &amp; reply</h2>
      {ok && <div className="success-banner">{ok}</div>}
      {err && <p className="error">{err}</p>}
      {thread && (
        <>
          <p style={{ margin: "0 0 1rem" }}>
            <strong>{thread.subject}</strong> — {thread.studentName}
            {thread.professorName ? (
              <>
                <br />
                <span className="hint">You: {thread.professorName}</span>
              </>
            ) : null}
          </p>
          {thread.messages.map((m) => (
            <div key={m.id} className="msg-row">
              <div className={`msg-from${m.fromRole === "professor" ? " prof" : ""}`}>
                {m.fromRole === "student" ? "Student" : "You (professor)"}
              </div>
              <div>{m.body}</div>
            </div>
          ))}
          <div className="field" style={{ marginTop: "1rem" }}>
            <label htmlFor="rep">Reply to student</label>
            <textarea
              id="rep"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply…"
            />
          </div>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-primary"
              disabled={sending}
              onClick={() => void sendReply()}
            >
              {sending ? "Sending…" : "Send reply to student"}
            </button>
            <button type="button" className="btn" onClick={onBack}>
              Back to inbox
            </button>
          </div>
        </>
      )}
    </section>
  );
}

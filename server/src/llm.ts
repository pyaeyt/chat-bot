import { matchKnowledge } from "./knowledge.js";

export type AnswerSource = "knowledge" | "llm" | "fallback";
export type TargetLanguage = "en" | "th";

export interface AskAiResult {
  canAnswer: boolean;
  message: string;
  source: AnswerSource;
}

interface OpenAiChatChoice {
  message?: { content?: string };
}

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_TRANSCRIBE_URL = "https://api.openai.com/v1/audio/transcriptions";
const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";
const HF_ASR_MODEL = "openai/whisper-large-v3";

function getApiKey(): string | null {
  return process.env.OPENAI_API_KEY?.trim() || null;
}

function getHfApiKey(): string | null {
  return process.env.HUGGINGFACE_API_KEY?.trim() || process.env.HF_API_KEY?.trim() || null;
}

async function callHfChat(
  messages: Array<{ role: "system" | "user"; content: string }>,
  opts?: { model?: string; temperature?: number; maxTokens?: number; jsonObject?: boolean }
): Promise<string | null> {
  const apiKey = getHfApiKey();
  if (!apiKey) return null;
  const model = opts?.model || process.env.HF_CHAT_MODEL?.trim() || "meta-llama/Llama-3.1-8B-Instruct";
  const res = await fetch(HF_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: opts?.jsonObject ? { type: "json_object" } : undefined,
      messages,
      temperature: opts?.temperature ?? 0.2,
      max_tokens: opts?.maxTokens ?? 500,
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[llm] HuggingFace chat error", res.status, errText.slice(0, 200));
    return null;
  }
  const data = (await res.json()) as { choices?: OpenAiChatChoice[] };
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

async function callOpenAiChat(
  messages: Array<{ role: "system" | "user"; content: string }>,
  opts?: { model?: string; temperature?: number; maxTokens?: number; jsonObject?: boolean }
): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const model = opts?.model ?? process.env.OPENAI_MODEL?.trim() ?? "gpt-4o-mini";
  const res = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: opts?.jsonObject ? { type: "json_object" } : undefined,
      messages,
      temperature: opts?.temperature ?? 0.2,
      max_tokens: opts?.maxTokens ?? 500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[llm] OpenAI chat error", res.status, errText.slice(0, 200));
    return null;
  }
  const data = (await res.json()) as { choices?: OpenAiChatChoice[] };
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

export async function translateText(text: string, targetLanguage: TargetLanguage): Promise<string> {
  const input = text.trim();
  if (!input) return "";
  const label = targetLanguage === "th" ? "Thai" : "English";
  const promptMessages: Array<{ role: "system" | "user"; content: string }> = [
    {
      role: "system",
      content:
        "You are a translation engine. Translate naturally, preserve meaning and proper nouns, return only translated text.",
    },
    {
      role: "user",
      content: `Translate to ${label}:\n\n${input}`,
    },
  ];
  const out =
    (await callHfChat(promptMessages, { temperature: 0.1, maxTokens: 700 })) ||
    (await callOpenAiChat(
      promptMessages,
      { temperature: 0.1, maxTokens: 700 }
    ));
  return out || input;
}

async function transcribeWithHf(audioBuffer: Buffer, mimeType: string): Promise<{ text: string }> {
  const apiKey = getHfApiKey();
  if (!apiKey) return { text: "" };
  const model = process.env.HF_ASR_MODEL?.trim() || HF_ASR_MODEL;
  const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`;
  const audioBlob = new Blob([audioBuffer as unknown as BlobPart], {
    type: mimeType || "audio/webm",
  });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": mimeType || "audio/webm",
    },
    body: audioBlob,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[llm] HuggingFace ASR error", res.status, errText.slice(0, 200));
    return { text: "" };
  }
  const data = (await res.json()) as { text?: string; generated_text?: string };
  return { text: (data.text || data.generated_text || "").trim() };
}

async function transcribeWithOpenAi(
  audioBuffer: Buffer,
  mimeType: string
): Promise<{ text: string; sourceLanguage?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { text: "" };
  }

  const model = process.env.OPENAI_TRANSCRIBE_MODEL?.trim() || "gpt-4o-mini-transcribe";
  const ext = mimeType.includes("ogg")
    ? "ogg"
    : mimeType.includes("webm")
      ? "webm"
      : mimeType.includes("wav")
        ? "wav"
        : "m4a";
  const file = new File([audioBuffer as unknown as BlobPart], `speech.${ext}`, {
    type: mimeType,
  });

  const form = new FormData();
  form.append("model", model);
  form.append("file", file);
  form.append("temperature", "0");

  const res = await fetch(OPENAI_TRANSCRIBE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[llm] OpenAI transcribe error", res.status, errText.slice(0, 200));
    return { text: "" };
  }

  const data = (await res.json()) as { text?: string; language?: string };
  return { text: data.text?.trim() || "", sourceLanguage: data.language };
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string,
  targetLanguage?: TargetLanguage
): Promise<{ text: string; translatedText?: string; sourceLanguage?: string }> {
  const hfResult = await transcribeWithHf(audioBuffer, mimeType);
  const openAiResult = hfResult.text ? null : await transcribeWithOpenAi(audioBuffer, mimeType);
  const text = (hfResult.text || openAiResult?.text || "").trim();
  if (!text) {
    return {
      text: "Speech transcription requires HUGGINGFACE_API_KEY (or OPENAI_API_KEY fallback) on the server.",
    };
  }

  if (!targetLanguage) {
    return { text, sourceLanguage: openAiResult?.sourceLanguage };
  }
  const translated = await translateText(text, targetLanguage);
  return { text, translatedText: translated, sourceLanguage: openAiResult?.sourceLanguage };
}

/**
 * Tries keyword knowledge first, then optional Hugging Face/OpenAI, then safe fallback.
 */
export async function answerQuestion(question: string): Promise<AskAiResult> {
  const q = question.trim();
  if (!q) {
    return {
      canAnswer: false,
      message:
        "Please ask about campus info, lessons, or regulations—or contact your teacher for course-specific help.",
      source: "fallback",
    };
  }

  const kb = matchKnowledge(q);
  if (kb.answered) {
    return { canAnswer: true, message: kb.answer, source: "knowledge" };
  }

  if (!getHfApiKey() && !getApiKey()) {
    return {
      canAnswer: false,
      message: kb.answer,
      source: "fallback",
    };
  }

  try {
    const messages: Array<{ role: "system" | "user"; content: string }> = [
      {
        role: "system",
        content: `You are a helpful assistant for university students about campus life, general academic policies, and where to find information.
Rules:
- Answer only from general knowledge typical of a university FAQ. Do not invent specific dates, room numbers, or policies for a named school unless they are widely standard.
- If you are not reasonably sure, set "canAnswer" to false and in "message" tell the student to contact their instructor or the relevant office.
- Reply as JSON only: {"canAnswer": boolean, "message": string}
- Keep "message" concise (under 200 words).`,
      },
      { role: "user", content: q },
    ];

    const raw =
      (await callHfChat(messages, { jsonObject: true, temperature: 0.3, maxTokens: 500 })) ||
      (await callOpenAiChat(messages, { jsonObject: true, temperature: 0.3, maxTokens: 500 }));

    if (!raw) {
      return { canAnswer: false, message: kb.answer, source: "fallback" };
    }

    let jsonText = raw;
    const fence = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence?.[1]) jsonText = fence[1].trim();

    let parsed: { canAnswer?: boolean; message?: string };
    try {
      parsed = JSON.parse(jsonText) as { canAnswer?: boolean; message?: string };
    } catch {
      return {
        canAnswer: true,
        message: raw,
        source: "llm",
      };
    }

    const msg =
      typeof parsed.message === "string" && parsed.message.trim()
        ? parsed.message.trim()
        : kb.answer;
    return {
      canAnswer: Boolean(parsed.canAnswer),
      message: msg,
      source: "llm",
    };
  } catch (e) {
    console.error("[llm] fetch failed", e);
    return {
      canAnswer: false,
      message: kb.answer,
      source: "fallback",
    };
  }
}

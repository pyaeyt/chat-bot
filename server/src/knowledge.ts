import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface KnowledgeEntry {
  keywords: string[];
  answer: string;
}

let knowledge: KnowledgeEntry[] = [];

try {
  const raw = readFileSync(
    path.join(__dirname, "../data/knowledge.json"),
    "utf-8"
  );
  knowledge = JSON.parse(raw) as KnowledgeEntry[];
} catch {
  knowledge = [];
}

export function matchKnowledge(question: string): { answered: boolean; answer: string } {
  const q = question.toLowerCase().trim();
  if (!q) {
    return {
      answered: false,
      answer:
        "Please ask about campus info, lessons, or regulations—or contact your teacher for course-specific help.",
    };
  }

  for (const entry of knowledge) {
    const hit = entry.keywords.some((k) => q.includes(k.toLowerCase()));
    if (hit) {
      return { answered: true, answer: entry.answer };
    }
  }

  return {
    answered: false,
    answer:
      "I don’t have enough information to answer that reliably. Please contact the respective teacher or your department office for this topic.",
  };
}

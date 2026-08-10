import Anthropic from "@anthropic-ai/sdk";
import { tools } from "./tools.js";

const client = new Anthropic();

const SYSTEM_PROMPT =
  "Tu es un assistant IA personnel qui aide l'utilisateur à gérer ses tâches quotidiennes : " +
  "to-do list, rappels et priorisation. Réponds en français, de façon concise et directe. " +
  "Utilise les outils disponibles pour consulter ou modifier la liste de tâches plutôt que de deviner son contenu.";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chat(history: ChatMessage[]): Promise<string> {
  const runner = client.beta.messages.toolRunner({
    model: "claude-opus-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools,
    messages: history,
  });

  let lastText = "";
  for await (const message of runner) {
    const textBlock = message.content.find(
      (b): b is Anthropic.Beta.BetaTextBlock => b.type === "text",
    );
    if (textBlock) lastText = textBlock.text;
  }
  return lastText;
}

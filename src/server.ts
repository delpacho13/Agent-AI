import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chat, type ChatMessage } from "./agent.js";
import { listTasks } from "./db.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/tasks", (_req, res) => {
  res.json({ tasks: listTasks("all") });
});

app.post("/api/chat", async (req, res) => {
  const { history } = req.body as { history?: ChatMessage[] };
  if (!Array.isArray(history) || history.length === 0) {
    res.status(400).json({ error: "history requis" });
    return;
  }
  try {
    const reply = await chat(history);
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'appel à l'agent." });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`Agent IA disponible sur http://localhost:${PORT}`);
});

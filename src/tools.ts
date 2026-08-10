import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod/v4";
import { addTask, completeTask, deleteTask, listTasks, type Task } from "./db.js";

function formatTask(t: Task): string {
  const status = t.done ? "[x]" : "[ ]";
  const due = t.due_at ? ` (échéance: ${t.due_at})` : "";
  return `${status} #${t.id} ${t.title}${due}`;
}

export const addTaskTool = betaZodTool({
  name: "add_task",
  description:
    "Ajoute une nouvelle tâche à la liste de tâches quotidiennes de l'utilisateur. Utilise cet outil quand l'utilisateur demande d'ajouter, de créer ou de noter une tâche, un rappel ou une chose à faire.",
  inputSchema: z.object({
    title: z.string().describe("Le titre / la description de la tâche."),
    due_at: z
      .string()
      .optional()
      .describe(
        "Date ou date-heure d'échéance au format ISO 8601 (ex: 2026-08-11), si mentionnée par l'utilisateur.",
      ),
  }),
  run: async ({ title, due_at }) => {
    const task = addTask(title, due_at ?? null);
    return `Tâche ajoutée : ${formatTask(task)}`;
  },
});

export const listTasksTool = betaZodTool({
  name: "list_tasks",
  description:
    "Liste les tâches de l'utilisateur. Utilise cet outil pour répondre à des questions comme « quelles sont mes tâches » ou « qu'est-ce qu'il me reste à faire », ou pour vérifier l'état actuel avant d'agir.",
  inputSchema: z.object({
    filter: z
      .enum(["all", "pending", "done"])
      .default("pending")
      .describe("Quelles tâches lister : « pending » (en cours), « done » (terminées) ou « all » (toutes)."),
  }),
  run: async ({ filter }) => {
    const tasks = listTasks(filter);
    if (tasks.length === 0) return "Aucune tâche trouvée pour ce filtre.";
    return tasks.map(formatTask).join("\n");
  },
});

export const completeTaskTool = betaZodTool({
  name: "complete_task",
  description:
    "Marque une tâche comme terminée à partir de son identifiant numérique (#id). Utilise list_tasks avant si tu ne connais pas l'id exact.",
  inputSchema: z.object({
    id: z.number().int().describe("L'identifiant numérique de la tâche à marquer comme terminée."),
  }),
  run: async ({ id }) => {
    const task = completeTask(id);
    if (!task) return `Aucune tâche trouvée avec l'id ${id}.`;
    return `Tâche marquée comme terminée : ${formatTask(task)}`;
  },
});

export const deleteTaskTool = betaZodTool({
  name: "delete_task",
  description: "Supprime définitivement une tâche à partir de son identifiant numérique (#id).",
  inputSchema: z.object({
    id: z.number().int().describe("L'identifiant numérique de la tâche à supprimer."),
  }),
  run: async ({ id }) => {
    const ok = deleteTask(id);
    return ok ? `Tâche #${id} supprimée.` : `Aucune tâche trouvée avec l'id ${id}.`;
  },
});

export const dailyBriefingTool = betaZodTool({
  name: "get_daily_briefing",
  description:
    "Retourne un résumé structuré de l'état actuel des tâches : en retard, prévues aujourd'hui, et le reste en attente. Utilise cet outil quand l'utilisateur demande un résumé, un briefing ou un point sur sa journée.",
  inputSchema: z.object({}),
  run: async () => {
    const pending = listTasks("pending");
    const today = new Date().toISOString().slice(0, 10);
    const overdue = pending.filter((t) => t.due_at && t.due_at.slice(0, 10) < today);
    const dueToday = pending.filter((t) => t.due_at && t.due_at.slice(0, 10) === today);
    const noDate = pending.filter((t) => !t.due_at);
    const section = (label: string, items: Task[]) =>
      items.length ? `${label} (${items.length}) :\n${items.map(formatTask).join("\n")}` : `${label} : aucune`;
    return [section("En retard", overdue), section("Aujourd'hui", dueToday), section("Sans échéance", noDate)].join(
      "\n\n",
    );
  },
});

export const tools = [addTaskTool, listTasksTool, completeTaskTool, deleteTaskTool, dailyBriefingTool];

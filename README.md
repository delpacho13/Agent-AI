# Agent IA — Tâches quotidiennes

Un agent IA (Claude) pour gérer tes tâches du quotidien : to-do list, rappels et
briefing de la journée, via une interface de chat web.

> Ce dépôt héberge aussi **[le site NACRÉ](site/)** — la boutique vitrine avec
> panier et précommandes, publiée sur GitHub Pages. Voir [`site/README.md`](site/README.md).

## Fonctionnement

- **Backend** : Node.js / TypeScript, Express.
- **Agent** : Claude (`claude-opus-5`) avec function calling — l'agent appelle des
  outils pour lire/écrire les tâches plutôt que d'inventer des réponses.
- **Stockage** : SQLite local (`data/agent.db`), créé automatiquement au premier lancement.
- **Interface** : une page de chat simple, avec un panneau listant les tâches en temps réel.

Outils disponibles pour l'agent : `add_task`, `list_tasks`, `complete_task`,
`delete_task`, `get_daily_briefing`.

## Démarrage

```bash
npm install
cp .env.example .env
# renseigne ANTHROPIC_API_KEY dans .env
npm run dev
```

Puis ouvre http://localhost:3000.

## Build de production

```bash
npm run build
npm start
```

## Exemples de messages

- « Ajoute une tâche : appeler le dentiste, pour demain »
- « Qu'est-ce qu'il me reste à faire aujourd'hui ? »
- « Fais-moi un résumé de ma journée »
- « Marque la tâche #3 comme terminée »

# NACRÉ — site vitrine & précommandes

Site statique de la maison NACRÉ, issu de la maquette Claude Design
`NACRE Landing.dc.html`. Aucune dépendance, aucune étape de build : ce sont
les fichiers du dossier qui sont servis tels quels.

**En ligne :** https://delpacho13.github.io/Agent-AI/

## Ce que fait le site

- Panier réel : ajout sans rechargement, compteur, quantités +/−, retrait,
  total, persistance dans le navigateur (`localStorage`).
- Bouton **Commander** → formulaire de précommande (nom, e-mail, adresse,
  message) avec validation, récapitulatif de la commande et référence unique.
- **Aucun paiement** : phase de lancement, on collecte des intentions d'achat.
- Lettre d'information avec validation d'adresse.
- Accessible au clavier (piège de focus dans le panier et la modale, `Échap`
  pour fermer, libellés ARIA, `prefers-reduced-motion` respecté).

## Structure

```
site/
├── index.html              page unique (contenu en dur → indexable)
├── mentions-legales.html
├── confidentialite.html
├── 404.html
├── robots.txt
├── sitemap.xml
├── site.webmanifest
├── .nojekyll               GitHub Pages sert les fichiers tels quels
└── assets/
    ├── css/styles.css      + fonts.css (@font-face)
    ├── fonts/*.woff2       Cormorant Garamond + Montserrat auto-hébergés
    ├── img/*.svg           packshots produits vectoriels
    ├── img/og-nacre.jpg    image de partage 1200×630
    └── js/
        ├── config.js       ← le seul fichier à éditer pour brancher un back
        └── app.js          panier + précommande (vanilla, ~11 ko)
```

## Brancher la réception des précommandes

Par défaut, `assets/js/config.js` ne contient pas d'URL de réception : la
précommande est alors enregistrée dans le navigateur du client et un e-mail
pré-rempli lui est proposé pour vous la transmettre. Le parcours fonctionne,
mais rien n'arrive automatiquement dans votre boîte.

Pour recevoir les précommandes directement, il suffit d'une ligne :

```js
window.NACRE_CONFIG = {
  preorderEndpoint: "https://formspree.io/f/VOTRE_ID",   // ou Basin, Getform,
  newsletterEndpoint: "",                                 // Apps Script, votre API…
  contactEmail: "precommande@nacre-paris.fr",
  ...
};
```

Le site envoie un `POST` JSON :

```json
{
  "reference": "NCR-260819-A7QK",
  "createdAt": "2026-08-19T18:20:00.000Z",
  "customer": { "name": "…", "email": "…", "address": "…", "message": "…" },
  "items": [{ "id": "mascara", "name": "…", "unitPrice": 32, "qty": 2, "lineTotal": 64 }],
  "total": 112,
  "currency": "EUR",
  "type": "precommande-sans-paiement"
}
```

## Modifier le catalogue

Les produits sont décrits directement dans `index.html` (bon pour le
référencement). Chaque `<article class="product">` porte ses données :

```html
<article class="product" id="mascara"
         data-id="mascara" data-name="Mascara Volume Infini"
         data-price="32" data-image="assets/img/mascara-volume-infini.svg">
```

Le JavaScript lit ces attributs : ajouter un produit = dupliquer le bloc,
ajouter l'entrée correspondante dans le JSON-LD de `<head>`, et déposer le
visuel dans `assets/img/`.

## Développer en local

```bash
python3 -m http.server 8099 --directory site
# puis http://127.0.0.1:8099
```

## Version « un seul fichier »

```bash
node tools/build-standalone.mjs
```

Produit `standalone/nacre-standalone.html` : tout le site en un fichier de
~440 ko (CSS, JS, polices et visuels intégrés en `data:` URI). Zéro requête
externe. Il s'ouvre en double-cliquant et se dépose tel quel sur n'importe
quel hébergeur. `standalone/nacre-artifact.html` est la même page sans
`<html>`/`<head>`/`<body>`, pour une publication en Artifact.

## Déploiement

`.github/workflows/deploy-site.yml` publie ce dossier sur GitHub Pages à
chaque push touchant `site/`, et vérifie ensuite le site en ligne (titre,
fiches produits, boutons, `robots.txt`, `sitemap.xml`, assets).

**Première activation — une seule fois, à la main.** L'endpoint qui active
GitHub Pages exige un droit « admin » que le `GITHUB_TOKEN` d'Actions n'a pas
(`403 Resource not accessible by integration`). Le workflow pousse donc le
site sur la branche `gh-pages` et attend :

1. **Settings → Pages** ;
2. *Source* : **Deploy from a branch** ;
3. *Branch* : `gh-pages`, dossier `/ (root)` → **Save**.

Ensuite tout est automatique. Le résumé de chaque run rappelle cette marche à
suivre tant que Pages n'est pas actif.

## Domaine personnalisé

Pour passer sur un vrai nom de domaine (`nacre-paris.fr`) :

1. déposer un fichier `site/CNAME` contenant le domaine ;
2. faire pointer un `CNAME` DNS vers `delpacho13.github.io` ;
3. remplacer `https://delpacho13.github.io/Agent-AI/` par le nouveau domaine
   dans `index.html` (canonical, Open Graph, JSON-LD), `sitemap.xml` et
   `robots.txt`.

C'est aussi à ce moment que `robots.txt` devient pleinement effectif : à la
racine d'un domaine, Google le lit ; sous un sous-chemin `github.io`, il ne
lit que celui de la racine du domaine. Le `sitemap.xml` reste soumettable
directement dans la Search Console dans les deux cas.

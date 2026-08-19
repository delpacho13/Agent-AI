/**
 * Construit une version « un seul fichier » du site NACRÉ.
 *
 *   node tools/build-standalone.mjs
 *
 * Tout est intégré au HTML : CSS, JavaScript, polices (data: URI) et
 * visuels SVG. Le fichier obtenu s'ouvre en double-cliquant et se dépose
 * tel quel sur n'importe quel hébergeur, sans dossier d'assets.
 *
 * Deux sorties :
 *   standalone/nacre-standalone.html  page complète, autonome
 *   standalone/nacre-artifact.html    même page sans <html>/<head>/<body>,
 *                                     pour une publication en Artifact
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = join(ROOT, "site");
const OUT = join(ROOT, "standalone");

const read = (p) => readFileSync(join(SITE, p), "utf8");
const b64 = (p) => readFileSync(join(SITE, p)).toString("base64");

/* ---------------------------------------------------------- polices ---
   On ne garde que le sous-ensemble « latin » : il couvre le français et
   divise par deux le poids du fichier final. */
function inlineFonts(css) {
  return css
    .split("\n")
    .filter((rule) => rule.includes("-latin.woff2"))
    .map((rule) =>
      rule.replace(/url\('\.\.\/fonts\/([^']+)'\)/, (_, file) => {
        return `url('data:font/woff2;base64,${b64(`assets/fonts/${file}`)}')`;
      })
    )
    .join("\n");
}

/* ------------------------------------------------------------ images --- */
const dataUri = (p) =>
  p.endsWith(".svg")
    ? `data:image/svg+xml;base64,${b64(p)}`
    : `data:image/${p.endsWith(".jpg") ? "jpeg" : "png"};base64,${b64(p)}`;

/* -------------------------------------------------------------- build --- */
let html = read("index.html");

const styles = read("assets/css/styles.css").replace(
  /@import url\("fonts\.css"\);/,
  inlineFonts(read("assets/css/fonts.css"))
);

const scripts = read("assets/js/config.js") + "\n" + read("assets/js/app.js");

// visuels référencés par src="…" et par data-image="…"
const images = [
  "assets/img/huile-cheveux-reparatrice.svg",
  "assets/img/mascara-volume-infini.svg",
  "assets/img/fond-de-teint-seconde-peau.svg",
  "assets/img/recourbe-cils-precision.svg",
  "assets/img/atelier-nacre.svg",
  "assets/img/favicon.svg",
];
// NB : les remplacements passent par une fonction — une chaîne de
// remplacement interpréterait les « $$ » du code JS comme un « $ ».
for (const p of images) {
  const uri = dataUri(p);
  html = html.replaceAll(p, () => uri);
}

// on remplace les balises externes par leur contenu
html = html
  .replace(
    /<link rel="preload"[^>]*>\s*/g,
    ""
  )
  .replace(
    /<link rel="stylesheet" href="assets\/css\/styles\.css">/,
    () => `<style>\n${styles}\n</style>`
  )
  .replace(/<link rel="apple-touch-icon"[^>]*>\s*/, "")
  .replace(/<link rel="manifest"[^>]*>\s*/, "")
  .replace(/<script src="assets\/js\/config\.js" defer><\/script>\s*/, "")
  .replace(
    /<script src="assets\/js\/app\.js" defer><\/script>/,
    () => `<script>\n${scripts}\n</script>`
  );

// les pages annexes n'existent pas dans un fichier unique
html = html
  .replace(/href="mentions-legales\.html"/g, 'href="#" aria-disabled="true"')
  .replace(/href="confidentialite\.html"/g, 'href="#" aria-disabled="true"');

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "nacre-standalone.html"), html);

/* -------- variante Artifact : contenu seul, sans squelette de page ----- */
const head = html.slice(html.indexOf("<head>") + 6, html.indexOf("</head>"));
const body = html.slice(html.indexOf("<body>") + 6, html.indexOf("</body>"));
// dans une galerie d'Artifacts, le nom de la maison suffit à identifier la page
const title = "<title>NACRÉ</title>";
const style = head.match(/<style>[\s\S]*?<\/style>/)[0];
const boot = "<script>document.documentElement.classList.add('js');</script>";

writeFileSync(join(OUT, "nacre-artifact.html"), `${title}\n${style}\n${boot}\n${body}\n`);

const size = (f) => (readFileSync(join(OUT, f)).length / 1024).toFixed(0) + " ko";
console.log("standalone/nacre-standalone.html :", size("nacre-standalone.html"));
console.log("standalone/nacre-artifact.html   :", size("nacre-artifact.html"));

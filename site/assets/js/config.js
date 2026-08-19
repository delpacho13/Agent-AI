/**
 * Configuration NACRÉ — le seul fichier à toucher pour brancher le site.
 *
 * preorderEndpoint : URL qui reçoit les précommandes en POST (JSON).
 *   Laissé vide, le site fonctionne quand même : la précommande est
 *   enregistrée dans le navigateur et un e-mail pré-rempli est proposé
 *   au client pour la transmettre à la maison.
 *   Exemples d'URL à coller ici : Formspree, Basin, Getform,
 *   Google Apps Script, ou votre propre API.
 *
 * newsletterEndpoint : idem pour les inscriptions à la lettre.
 */
window.NACRE_CONFIG = {
  preorderEndpoint: "",
  newsletterEndpoint: "",
  contactEmail: "precommande@nacre-paris.fr",
  currency: "EUR",
  locale: "fr-FR"
};

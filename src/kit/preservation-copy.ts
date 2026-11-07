/** Textes affichés. Jamais le document brut, jamais le nom de la clé de quarantaine. */

export function quarantineNotice(copied: boolean): { title: string; text: string } {
  if (copied) {
    return {
      title: 'Copie mise de côté',
      text: 'Le document local n’a pas pu être lu. Il n’a pas été modifié. Son contenu n’est pas affiché. Une copie a été conservée à part, sans être ouverte.',
    };
  }
  return {
    title: 'Document non lu',
    text: 'Le document local n’a pas pu être lu. Il n’a pas été modifié. La copie à part n’a pas pu être écrite. Rien n’est affiché.',
  };
}

export function unsavedNotice(writing: boolean): { title: string; text: string } {
  if (writing) {
    return {
      title: 'Non enregistré',
      text: 'Nouvelle tentative en cours. Tant qu’elle n’est pas relue sur l’appareil, rien n’est marqué comme enregistré.',
    };
  }
  return {
    title: 'Non enregistré',
    text: 'L’écriture sur cet appareil a échoué (espace insuffisant ou stockage indisponible). Les changements restent à l’écran. Ils ne sont pas enregistrés. Vous pouvez réessayer.',
  };
}

export function eraseNotice(): { title: string; text: string } {
  return {
    title: 'Effacement définitif',
    text: 'Cette action retire les données locales de cet appareil. Le bouton Annuler ne supprime rien. Aucune restauration n’est proposée ici.',
  };
}

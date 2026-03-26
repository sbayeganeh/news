export const GENRES = [
  'Politics',
  'Business',
  'Technology',
  'Science',
  'Sports',
  'Entertainment',
  'Crime',
  'Health',
  'World',
  'Environment',
];

export const GENRE_COLORS = {
  Politics:      '#E63946',
  Business:      '#2DC653',
  Technology:    '#4CC9F0',
  Science:       '#B5179E',
  Sports:        '#F77F00',
  Entertainment: '#FFBE0B',
  Crime:         '#FF6B35',
  Health:        '#06D6A0',
  World:         '#7209B7',
  Environment:   '#80ED99',
};

export function getGenreColor(genre) {
  return GENRE_COLORS[genre] || '#AAAAAA';
}

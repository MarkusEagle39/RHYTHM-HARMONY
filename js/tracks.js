export const TRACKS = {
  beethoven: {
    title: 'Für Elise',
    composer: 'Ludwig van Beethoven',
    artwork: 'assets/music/beethoven-fur-elise.jpg',
    phrase: [
      [76, 0], [75, 1], [76, 0], [75, 1], [76, 0], [71, 2], [74, 3],
      [72, 2], [69, 1], [64, 2], [69, 1], [71, 2], [72, 3], [76, 0],
    ],
  },
  atraente: {
    title: 'Atraente',
    composer: 'Chiquinha Gonzaga',
    artwork: 'assets/music/atraente.jpg',
    // Polca leve, com frases curtas, saltos e ritmo regular.
    phrase: [
      [65, 0, 1], [69, 2, 0.5], [72, 3, 0.5], [69, 1, 1],
      [67, 0, 0.5], [69, 2, 0.5], [72, 1, 1.5], [77, 3, 0.5],
      [76, 2, 0.5], [72, 0, 1], [69, 1, 0.5], [67, 3, 0.5],
      [65, 0, 1], [72, 2, 1],
    ],
  },
  brejeiro: {
    title: 'Brejeiro',
    composer: 'Ernesto Nazareth',
    artwork: 'assets/music/brejeiro.jpg',
    // Tango brasileiro sincopado, alternando notas repetidas e contratempos.
    phrase: [
      [73, 1, 1.5], [76, 1, 0.5], [78, 3, 0.5], [76, 0, 1],
      [73, 2, 0.5], [69, 2, 1.5], [71, 0, 0.5], [73, 3, 0.5],
      [76, 1, 1.5], [78, 1, 0.5], [81, 3, 1], [78, 2, 0.5],
      [76, 0, 0.5], [73, 2, 1],
    ],
  },
  odeon: {
    title: 'Odeon',
    composer: 'Ernesto Nazareth',
    artwork: 'assets/music/odeon.jpg',
    // Linha mais grave e ampla, com pausas longas e respostas agudas.
    phrase: [
      [52, 0, 1.5], [59, 3, 1], [64, 1, 0.5], [59, 2, 1],
      [56, 0, 1.5], [63, 3, 0.5], [68, 2, 1], [64, 0, 1],
      [52, 1, 1.5], [59, 3, 0.5], [64, 2, 1], [71, 3, 1.5],
      [68, 1, 0.5], [64, 0, 1],
    ],
  },
};

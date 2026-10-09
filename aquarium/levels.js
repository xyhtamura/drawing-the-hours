export const SPECIES = {
  guppy: {name: 'Guppy', color: '#dda978', trim: '#aa6475', size: 18, radius: 12},
  ricefish: {name: 'Ricefish', color: '#e5e6cd', trim: '#839b91', size: 16, radius: 10},
};

// Motion and durations are authored game values, pending a human playtest.
export const LEVELS = [
  {id: 'guppies', title: 'Guppies', duration: 100, population: {guppy: 10},
    goals: {guppy: 3}, instruction: 'Enclose two guppies in one loop.', wash: '#b7c7a6'},
  {id: 'ricefish', title: 'Ricefish', duration: 110, population: {guppy: 6, ricefish: 8},
    goals: {guppy: 2, ricefish: 2}, instruction: 'Enclose two fish of the same kind. Ricefish pause, then dart.', wash: '#a9c9bf'},
];

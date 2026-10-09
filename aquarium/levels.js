export const SPECIES = {
  ricefish: {name: 'Ricefish', scientificName: 'Oryzias luzonensis', color: '#ded6ab', trim: '#8e9778', size: 16, radius: 10},
  goby: {name: 'Blue goby', scientificName: 'Stiphodon atropurpureus', color: '#425d5a', trim: '#71bec5', size: 19, radius: 12},
  barb: {name: 'Spotted barb', scientificName: 'Barbodes montanoi', color: '#c8c6a1', trim: '#b98b71', size: 17, radius: 11},
  halfbeak: {name: 'Halfbeak', scientificName: 'Dermogenys palawanensis', color: '#dbdfba', trim: '#8a9c80', size: 24, radius: 12},
};

// Motion and durations are authored game values, pending a human playtest.
export const LEVELS = [
  {id: 'shallows', title: 'Shallow water', duration: 100, population: {ricefish: 10},
    goals: {ricefish: 3}, instruction: 'Enclose two ricefish in one loop.', wash: '#b7c7a6'},
  {id: 'gobies', title: 'Stream stones', duration: 110, population: {ricefish: 6, goby: 6}, rocks: true,
    goals: {ricefish: 2, goby: 2}, instruction: 'Enclose matching pairs. Gobies pause on stones, then dart between them.', wash: '#a9c9bf'},
  {id: 'schools', title: 'Small schools', duration: 125, population: {barb: 9, ricefish: 4},
    goals: {barb: 3, ricefish: 1}, recipes: {barb: 3},
    instruction: 'Enclose three spotted barbs together, or a pair of ricefish. Keep each kind in its own pocket.', wash: '#acc8ba'},
  {id: 'stems', title: 'Between stems', duration: 115, population: {ricefish: 10}, stems: true,
    goals: {ricefish: 4}, instruction: 'Enclose pairs of ricefish. Stems cut the cord.', wash: '#bbc9a2'},
  {id: 'shade', title: 'Under leaves', duration: 125, population: {halfbeak: 8, ricefish: 4}, shade: true,
    goals: {halfbeak: 3, ricefish: 1},
    instruction: 'Enclose matching pairs. Halfbeaks glide, then turn sharply.', wash: '#b5c9c1'},
];

export const recipeSize = (level, kind) => level.recipes?.[kind] ?? 2;

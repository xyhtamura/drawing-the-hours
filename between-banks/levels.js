export const SPECIES = {
  ricefish: {name: 'Ricefish', scientificName: 'Oryzias luzonensis', color: '#ded6ab', trim: '#8e9778', size: 16, radius: 10},
  goby: {name: 'Blue goby', scientificName: 'Stiphodon atropurpureus', color: '#425d5a', trim: '#71bec5', size: 19, radius: 12},
  barb: {name: 'Spotted barb', scientificName: 'Barbodes montanoi', color: '#c8c6a1', trim: '#b98b71', size: 17, radius: 11},
  halfbeak: {name: 'Halfbeak', scientificName: 'Dermogenys palawanensis', color: '#dbdfba', trim: '#8a9c80', size: 24, radius: 12},
};

// Motion and durations are authored game values, pending a human playtest.
export const LEVELS = [
  {id: 'shallows', title: 'Shallow water', duration: 100, population: {ricefish: 10},
    story: 'The Luzon ricefish Oryzias luzonensis used to swim in our paddies, before the Japanese medaka and mosquitofish were introduced. Both eat mosquito larvae. They drift softly anyway.',
    goals: {ricefish: 3}, instruction: 'Enclose two ricefish in one loop.', wash: '#a8c6d3'},
  {id: 'gobies', title: 'Stream stones', duration: 110, population: {ricefish: 6, goby: 6}, rocks: true,
    story: 'You can’t breed a blue goby in a glass box. Their fry need the open sea before they can climb upstream.',
    goals: {ricefish: 2, goby: 2}, instruction: 'Enclose matching pairs. Gobies pause on stones, then dart between them.', wash: '#a8c6d3'},
  {id: 'schools', title: 'Small schools', duration: 125, population: {barb: 13, ricefish: 6}, shoals: {barb: [6, 7], ricefish: [6]}, bubbles: true,
    story: 'the spotted barb (paitan) form tight schooling pockets. They are quiet cousins to eighteen species in Lake Lanao that vanished when foreign fish were introduced into their water for aquaculture.',
    goals: {barb: 3, ricefish: 1}, recipes: {barb: 3},
    instruction: 'Enclose three spotted barbs together, or a pair of ricefish. Keep each kind in its own pocket.', wash: '#b2c8aa'},
  {id: 'leaves', title: 'Between leaves', duration: 115, population: {ricefish: 10}, leaves: true, beetles: 1, bubbles: true,
    story: 'In municipal public health drives, bucketfuls of feral guppies into the canals for pest control.',
    goals: {ricefish: 4}, instruction: 'Enclose pairs of ricefish. Leaves and beetles cut the cord.', wash: '#b2c8aa'},
  {id: 'shade', title: 'Under leaves', duration: 125, population: {halfbeak: 8, ricefish: 4}, shade: true, beetles: 2, bubbles: true,
    story: 'Halfbeaks lurk in the water, waiting on whatever falls out of the trees.',
    goals: {halfbeak: 3, ricefish: 1},
    instruction: 'Enclose matching pairs. Avoid the beetles.', wash: '#dfbca9'},
  {id: 'two-pockets', title: 'Two pockets', duration: 150, population: {ricefish: 8, goby: 6}, rocks: true, separateKinds: true,
    story: 'Palawan and Mindanao inherited primary Asian river fishes across ancient Sunda shelf land bridges, while oceanic islands like Cebu and Negros had to be colonized from the sea by climbing marine ancestors.', storyItalic: false,
    goals: {ricefish: 3, goby: 3},
    instruction: 'Draw a figure eight: two ricefish in one pocket, two gobies in the other.', wash: '#dfbca9'},
  {id: 'school-and-pair', title: 'School and pair', duration: 165, population: {barb: 9, halfbeak: 6}, shade: true, separateKinds: true,
    story: 'The Philippine aquarium trade treats wild native species as cheap filler or bycatch, while importing pristine Amazonian characins and factory-farmed show fish.',
    goals: {barb: 3, halfbeak: 3}, recipes: {barb: 3},
    instruction: 'Draw a figure eight: three barbs in one pocket, two halfbeaks in the other.', wash: '#beb3ce'},
  {id: 'open-water', title: 'Open water', duration: 180, population: {ricefish: 6, goby: 6, barb: 6, halfbeak: 4}, rocks: true, shade: true, beetles: 1, bubbles: true,
    story: "I like to visit the fish on some of my weekends. Today, It feels like we're all living between banks.",
    goals: {ricefish: 2, goby: 2, barb: 2, halfbeak: 2}, recipes: {barb: 3},
    instruction: 'Enclose pairs, or three barbs. Keep each kind in its own pocket.', wash: '#beb3ce'},
];

export const recipeSize = (level, kind) => level.recipes?.[kind] ?? 2;

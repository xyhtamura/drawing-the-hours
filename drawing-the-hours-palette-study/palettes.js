/* Independent color study. No game imports or runtime changes. */
window.PALETTE_STUDY = (() => {
  const hours = ['dawn', 'noon', 'dusk', 'midnight'];
  const groups = {
    'Field': { top: 'Upper wash', middle: 'Middle wash', bottom: 'Lower wash', edge: 'Frame / paving', leaf: 'Leaves', vein: 'Leaf veins' },
    'Interface': { panel: 'Card / controls', ink: 'Main text', muted: 'Secondary text' },
    'Drawing': { petite: 'Short cord', balanced: 'Medium cord', extended: 'Long cord', trace: 'Trace / target rings' },
    'Insects': { body: 'Bodies', outline: 'Wing outlines', brimstone: 'Brimstone', damselfly: 'Damselfly', hawkmoth: 'Hawkmoth', hoverfly: 'Hoverfly', lacewing: 'Lacewing', firefly: 'Firefly abdomen', seed: 'Seed filaments' }
  };
  const light = { panel:'#fdfbf7', ink:'#3a3225', muted:'#786c5a', edge:'#bfb6af', leaf:'#c6ccb6', vein:'#929d82', petite:'#d97777', balanced:'#c85a32', extended:'#5a3a66', trace:'#416e83', body:'#394955', outline:'#557e68', brimstone:'#fae37d', damselfly:'#afe1f5', hawkmoth:'#e07a8f', hoverfly:'#eab765', lacewing:'#e5f4de', firefly:'#fff0ae', seed:'#948c78' };
  const dark = { ...light, panel:'#202b43', ink:'#f2eddf', muted:'#b7c1d2', edge:'#36445d', leaf:'#354e50', vein:'#688a80', petite:'#f1a6a0', balanced:'#efbd84', extended:'#cab2eb', trace:'#9cdfe9', body:'#d5dfdc', outline:'#c6d9c6', seed:'#d2d8d1' };
  const make = (id, name, base, top, middle, bottom, overrides={}) => ({ id, name, colors:{...base, top, middle, bottom, ...overrides} });
  const presets = {
    dawn: [
      make('paper','Rose paper',light,'#f9eae6','#fcf8e9','#e6edd9'),
      make('peach','Peach / sage',light,'#f3d5c9','#f8e6cb','#cfdcca',{edge:'#b49b87',leaf:'#a6b58c',vein:'#718066'}),
      make('mist','Lilac / dew',light,'#dedde9','#f0edf0','#d5e2d8',{ink:'#393749',muted:'#696479',edge:'#aba8ba',trace:'#486e79'})
    ],
    noon: [
      make('paper','Sunlit paper',light,'#fff8e5','#f3f3df','#e4e9dd'),
      make('honey','Honey / olive',light,'#f9e8b8','#f4eed2','#d5deb9',{ink:'#423e29',muted:'#736b46',edge:'#bcb088',leaf:'#a1b079',vein:'#647948'}),
      make('glass','Glass / mint',light,'#e1f0ee','#f5f4e4','#cddfd6',{ink:'#2e4846',muted:'#5f7772',edge:'#a0b9b3',leaf:'#a6c1a5',trace:'#346b83'})
    ],
    dusk: [
      make('paper','Mauve paper',light,'#e6d6da','#f2e6d9','#d1d8ca'),
      make('ember','Terracotta / lavender',light,'#d8a99e','#e7c9b9','#bfb6d0',{panel:'#f2e2d7',ink:'#4a3541',muted:'#76556a',edge:'#9d7580',leaf:'#a1ad92',vein:'#606f61',balanced:'#8a4b30'}),
      make('violet','Violet evening',dark,'#4d465d','#65536a','#3c5054',{panel:'#383342',edge:'#797181',leaf:'#607167',vein:'#a8b5a3',ink:'#fff0df',muted:'#d5c2ce'})
    ],
    midnight: [
      make('paper','Current pale wash',light,'#d3d9e4','#e5e7e3','#c6d2d0',{edge:'#5e6a80',leaf:'#bccab9',vein:'#8a9e8e'}),
      make('blue','Ink blue / moonlight',dark,'#121b31','#1c2c43','#243c43'),
      make('plum','Plum / lamplight',dark,'#251b30','#35263d','#44333c',{panel:'#312436',edge:'#61445c',leaf:'#4c514e',vein:'#879580',ink:'#fae9d4',muted:'#ccb6c6',trace:'#a8dbcf',balanced:'#efc287'}),
      make('green','Deep green / amber',dark,'#142b2a','#203a35','#314638',{panel:'#20332e',edge:'#4c6050',leaf:'#4c6450',vein:'#97ad84',ink:'#f6edce',muted:'#bdcbb1',trace:'#9cd8c2',extended:'#cfb8e5'})
    ]
  };
  const sets = {
    'paper-blue': { name:'Paper day → blue night', ids:['paper','paper','paper','blue'] },
    'warm-plum': { name:'Warm day → plum night', ids:['peach','honey','ember','plum'] },
    'cool-green': { name:'Cool day → green night', ids:['mist','glass','violet','green'] },
    'current': { name:'Current field washes', ids:['paper','paper','paper','paper'] }
  };
  return { hours, groups, presets, sets };
})();

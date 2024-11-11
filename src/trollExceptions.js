export function getTrolled(charname) {
  const suckers = {
    'Aeo Arcanist': 'AoE Arcaner',
    'Sausage Roll': 'Sausage Rolls',
    'Kizu Sayuri': 'Midget Mama',
    'Sir Bj': 'Señor Bejongus',
  }

  if (charname in suckers) {
    return suckers[charname]
  } else {
    return charname
  }
}

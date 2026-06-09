// ── Palette ─────────────────────────────────────────────────────
export const COLORS = {
  parchment:     '#F2E7CF',
  parchmentDark: '#E4D4B0',
  ink:           '#1F1A14',
  inkSoft:       '#4A4036',
  blue:          '#1C3F5E',
  blueLight:     '#3D6E94',
  gold:          '#B8893E',
  oxblood:       '#7A2E2E',
};

// ── Canvas ──────────────────────────────────────────────────────
export const CANVAS_W = 960;
export const CANVAS_H = 600;

// ── Poem ────────────────────────────────────────────────────────
// The ordered tokens the player must shoot
export const POEM_SEQUENCE = [
  'Because','I','could','not','stop','for','Death',
  'He','kindly','stopped','for','me',
  'The','Carriage','held','but','just','Ourselves',
  'And','Immortality',
];

// How the composed lines render in the manuscript / victory screen
export const POEM_LINES = [
  'Because I could not stop for Death –',
  'He kindly stopped for me –',
  'The Carriage held but just Ourselves –',
  'And Immortality.',
];

// Words used as decoys (not in the sequence)
export const DECOY_BANK = [
  'Eternity','Sun','Children','Gazing','Setting','Frost',
  'Civility','Labor','Sunset','Grain','Recess','School',
  'Fields','Gossamer','Tulle','Horses','Surmised','Ground',
  'Centuries','Felt','Shorter','Day','Dews','Chill',
];

// ── Word tokens ─────────────────────────────────────────────────
export const WORD = {
  fallSpeed:    55,       // px / sec base fall speed
  sway:         18,       // horizontal sway amplitude px
  swayFreq:     0.6,      // sway frequency Hz
  fontSize:     22,       // px (canvas-internal)
  padding:      10,       // horizontal padding inside token box
  paddingV:     6,        // vertical padding
  borderRadius: 4,
  maxOnScreen:  6,
  correctColor: COLORS.blue,
  decoyColor:   COLORS.inkSoft,
  textColor:    COLORS.parchment,
};

// ── Projectile ──────────────────────────────────────────────────
export const PROJECTILE = {
  speed:    520,    // px / sec
  radius:   5,
  cooldown: 250,    // ms
  color:    COLORS.blue,
  trailLen: 12,     // trail segments
};

// ── Quill ───────────────────────────────────────────────────────
export const QUILL = {
  y:           540,   // canvas Y
  width:       48,
  height:      72,
  tiltMax:     18,    // degrees
  tiltSmooth:  8,     // lerp factor per second
  bobAmp:      3,
  bobFreq:     1.2,
};

// ── Particles ───────────────────────────────────────────────────
export const PARTICLE = {
  count:       12,
  speedMin:    80,
  speedMax:    280,
  lifeMin:     0.4,
  lifeMax:     0.9,
  gravity:     320,
  sizeMin:     2,
  sizeMax:     7,
};

// ── Screen shake ─────────────────────────────────────────────────
export const SHAKE = {
  magnitude: 5,
  decay:     14,   // magnitude units per second
};

// ── Scoring ──────────────────────────────────────────────────────
export const SCORE = {
  correct: 100,
  penalty: 30,
};

// ── Game rules ───────────────────────────────────────────────────
export const MAX_BLOTS = 5;
export const RESPAWN_DELAY = 1.5; // seconds before missed required word respawns

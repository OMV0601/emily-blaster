// ── Palette — Prussian-blue book cover ───────────────────────────
export const COLORS = {
  bgDeep:      '#0D1F33',   // dominant dark navy (book cover)
  bgMid:       '#1C3F5E',   // Prussian blue
  bgLight:     '#26527A',   // lighter navy surface
  accent:      '#3D6E94',   // wave blue highlight
  gold:        '#C9973F',   // antique gold — targets & key UI
  goldLight:   '#E8B86D',   // light gold — wave crests
  cream:       '#F2E7CF',   // warm cream — text on dark
  creamSoft:   '#9A8B78',   // muted cream — secondary text
  oxblood:     '#8B3A3A',   // error / blot
  // Legacy aliases used by render helpers
  parchment:   '#F2E7CF',
  parchmentDark:'#9A8B78',
  ink:         '#0A1520',
  inkSoft:     '#2E5478',
  blue:        '#1C3F5E',
  blueLight:   '#3D6E94',
};

// ── Canvas ──────────────────────────────────────────────────────
export const CANVAS_W = 960;
export const CANVAS_H = 600;

// ── Poems ────────────────────────────────────────────────────────
// Each poem object:
//   title      — display title
//   attribution — "Emily Dickinson, c. XXXX"
//   lines      — full stanza lines (with punctuation) for display
//   sequence   — ordered tokens the player shoots (no punctuation)
//   decoys     — thematic non-sequence words for this poem
export const POEMS = [
  {
    id: 'death',
    title: 'Because I could not stop for Death',
    attribution: 'Emily Dickinson, c. 1863',
    lines: [
      'Because I could not stop for Death –',
      'He kindly stopped for me –',
      'The Carriage held but just Ourselves –',
      'And Immortality.',
    ],
    sequence: [
      'Because','I','could','not','stop','for','Death',
      'He','kindly','stopped','for','me',
      'The','Carriage','held','but','just','Ourselves',
      'And','Immortality',
    ],
    decoys: [
      'Eternity','Sun','Children','Gazing','Setting','Frost',
      'Civility','Labor','Sunset','Grain','Recess','School',
      'Fields','Gossamer','Horses','Surmised','Ground','Centuries',
    ],
  },
  {
    id: 'hope',
    title: '"Hope" is the Thing with Feathers',
    attribution: 'Emily Dickinson, c. 1861',
    lines: [
      '"Hope" is the thing with feathers –',
      'That perches in the soul –',
      'And sings the tune without the words –',
      'And never stops – at all –',
    ],
    sequence: [
      'Hope','is','the','thing','with','feathers',
      'That','perches','in','the','soul',
      'And','sings','the','tune','without','the','words',
      'And','never','stops','at','all',
    ],
    decoys: [
      'Storm','Gale','Sea','Extremity','Sweetest','Land',
      'Bird','Wing','Sing','Dream','Sky','Wind',
      'Warmth','Kept','Coldest','Sore','Strangest','Sang',
    ],
  },
  {
    id: 'truth',
    title: 'Tell all the truth but tell it slant',
    attribution: 'Emily Dickinson, c. 1868',
    lines: [
      'Tell all the truth but tell it slant –',
      'Success in Circuit lies',
      'Too bright for our infirm Delight',
      "The Truth's superb surprise",
    ],
    sequence: [
      'Tell','all','the','truth','but','tell','it','slant',
      'Success','in','Circuit','lies',
      'Too','bright','for','our','infirm','Delight',
      'The','Truths','superb','surprise',
    ],
    decoys: [
      'Lightning','Children','Blind','Kindly','Ease','Explain',
      'Dazzle','Gradually','Gentle','Awe','Superb','Wonder',
      'Power','Infirm','Slow','Vast','Kind','Astonish',
    ],
  },
];

// ── Word tokens ─────────────────────────────────────────────────
export const WORD = {
  fallSpeed:    55,
  sway:         18,
  swayFreq:     0.6,
  fontSize:     22,
  padding:      10,
  paddingV:     6,
  borderRadius: 4,
  maxOnScreen:  6,
};

// ── Projectile ──────────────────────────────────────────────────
export const PROJECTILE = {
  speed:    520,
  radius:   5,
  cooldown: 250,
  trailLen: 12,
};

// ── Quill ───────────────────────────────────────────────────────
export const QUILL = {
  y:           540,
  width:       48,
  height:      72,
  tiltMax:     18,
  tiltSmooth:  8,
  bobAmp:      3,
  bobFreq:     1.2,
};

// ── Particles ───────────────────────────────────────────────────
export const PARTICLE = {
  count:    12,
  speedMin: 80,
  speedMax: 280,
  lifeMin:  0.4,
  lifeMax:  0.9,
  gravity:  320,
  sizeMin:  2,
  sizeMax:  7,
};

// ── Screen shake ─────────────────────────────────────────────────
export const SHAKE = {
  magnitude: 5,
  decay:     14,
};

// ── Scoring ──────────────────────────────────────────────────────
export const SCORE = {
  correct: 100,
  penalty: 30,
};

// ── Game rules ───────────────────────────────────────────────────
export const MAX_BLOTS = 5;
export const RESPAWN_DELAY = 1.5;

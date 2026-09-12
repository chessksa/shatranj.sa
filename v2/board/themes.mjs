export const DEFAULT_BOARD_THEME = 'shatranj';

export const BOARD_THEMES = {
  shatranj:{label:'شطرنج العرب',light:'#e8dec8',dark:'#87966a',line:'rgba(35,42,32,.28)'},
  '8-bit':{label:'8-Bit',light:'#f3e4b5',dark:'#6d7f3f',line:'rgba(25,25,25,.28)'},
  bases:{label:'Bases',light:'#f0d9b5',dark:'#b58863',line:'rgba(50,35,25,.22)'},
  blue:{label:'Blue',light:'#d7e3ef',dark:'#5f87a9',line:'rgba(24,48,70,.22)'},
  brown:{label:'Brown',light:'#ead9bf',dark:'#9b6a4d',line:'rgba(60,35,24,.22)'},
  bubblegum:{label:'Bubblegum',light:'#f9dce9',dark:'#c77aa5',line:'rgba(91,35,70,.18)'},
  'burled-wood':{label:'Burled Wood',light:'linear-gradient(135deg,#dcc29b,#f0ddbd)',dark:'linear-gradient(135deg,#8e5e3d,#6e452e)',line:'rgba(64,37,20,.25)'},
  'dark-wood':{label:'Dark Wood',light:'linear-gradient(135deg,#c7ab80,#b99668)',dark:'linear-gradient(135deg,#5f4633,#463226)',line:'rgba(30,20,15,.28)'},
  dash:{label:'Dash',light:'#e9e8e4',dark:'#7d8993',line:'rgba(28,36,42,.2)'},
  glass:{label:'Glass',light:'linear-gradient(135deg,#eef9fa,#d5eef1)',dark:'linear-gradient(135deg,#6ca6ad,#4f7f86)',line:'rgba(31,75,82,.18)'},
  graffiti:{label:'Graffiti',light:'linear-gradient(135deg,#ece7d3,#d8d0b3)',dark:'linear-gradient(135deg,#5a7460,#364d44)',line:'rgba(20,35,30,.28)'},
  green:{label:'Green',light:'#eeeed2',dark:'#769656',line:'rgba(35,61,25,.2)'},
  'icy-sea':{label:'Icy Sea',light:'#d9edf0',dark:'#6fa2ad',line:'rgba(30,65,70,.18)'},
  light:{label:'Light',light:'#f3f3f3',dark:'#b7c0c8',line:'rgba(50,55,60,.18)'},
  lolz:{label:'Lolz',light:'#f7eec8',dark:'#d07b6b',line:'rgba(80,45,35,.2)'},
  marble:{label:'Marble',light:'linear-gradient(135deg,#f4f2ee,#dedbd5)',dark:'linear-gradient(135deg,#8d9a9d,#69777a)',line:'rgba(45,55,58,.2)'},
  metal:{label:'Metal',light:'linear-gradient(135deg,#dde1e4,#bfc5ca)',dark:'linear-gradient(135deg,#6c7379,#4e555b)',line:'rgba(30,35,40,.24)'},
  neon:{label:'Neon',light:'#daf7eb',dark:'#2f8f7d',line:'rgba(9,52,45,.22)'},
  newspaper:{label:'Newspaper',light:'#ece7da',dark:'#9b978f',line:'rgba(30,30,30,.22)'},
  orange:{label:'Orange',light:'#f7e2bd',dark:'#cf8440',line:'rgba(91,49,18,.22)'},
  overlay:{label:'Overlay',light:'#e4e1d9',dark:'#7f8a7d',line:'rgba(36,45,35,.2)'},
  parchment:{label:'Parchment',light:'#efe0b7',dark:'#b89463',line:'rgba(70,50,25,.22)'},
  purple:{label:'Purple',light:'#e7dced',dark:'#8d6aa6',line:'rgba(60,35,75,.2)'},
  red:{label:'Red',light:'#efd9d3',dark:'#b45b53',line:'rgba(70,24,20,.22)'},
  sand:{label:'Sand',light:'#f0dfbd',dark:'#b99765',line:'rgba(72,54,27,.2)'},
  sky:{label:'Sky',light:'#e1f1f7',dark:'#70a9c8',line:'rgba(27,63,82,.18)'},
  stone:{label:'Stone',light:'linear-gradient(135deg,#d7d5cf,#c4c1b9)',dark:'linear-gradient(135deg,#777873,#5f605c)',line:'rgba(35,35,32,.24)'},
  tan:{label:'Tan',light:'#eddcc0',dark:'#b58b62',line:'rgba(64,44,26,.2)'},
  tournament:{label:'Tournament',light:'#e9e5ce',dark:'#4f7355',line:'rgba(28,55,34,.22)'},
  translucent:{label:'Translucent',light:'rgba(240,246,240,.84)',dark:'rgba(78,115,95,.82)',line:'rgba(25,50,38,.18)'},
  walnut:{label:'Walnut',light:'linear-gradient(135deg,#d2b48c,#c39a69)',dark:'linear-gradient(135deg,#7a5134,#5f3c27)',line:'rgba(45,28,18,.25)'}
};

export const THEME_ORDER = [
  'shatranj','8-bit','bases','blue','brown','bubblegum','burled-wood','dark-wood','dash','glass','graffiti',
  'green','icy-sea','light','lolz','marble','metal','neon','newspaper','orange','overlay','parchment','purple',
  'red','sand','sky','stone','tan','tournament','translucent','walnut'
];

export function normalizeBoardTheme(value){
  return typeof value === 'string' && BOARD_THEMES[value] ? value : DEFAULT_BOARD_THEME;
}

export function getBoardTheme(value){
  return BOARD_THEMES[normalizeBoardTheme(value)];
}

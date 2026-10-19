export type NickResult = { ok: true; nick: string } | { ok: false; reason: 'length' | 'chars' | 'blocked' };

const CHARS = /^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9 _-]+$/;

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' };

const collapse = (s: string): string => s.replace(/(.)\1+/g, '$1');

const fold = (s: string): string =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toLowerCase();

const RAW_STEMS = [
  'kurw', 'chuj', 'huj', 'pizd', 'jeba', 'jebi', 'jebc', 'jebn', 'pierdol', 'pierdal', 'kutas', 'fiut', 'dziwk', 'szmat',
  'cipa', 'cipk', 'zajeb', 'wyjeb', 'spierd', 'debil', 'kretyn', 'idiot', 'pedal', 'pedzio', 'ciota', 'cwel', 'czarnuch',
  'asfalt', 'murzyn', 'fuck', 'shit', 'bitch', 'cunt', 'dick', 'whore', 'slut', 'nigg', 'niger', 'retard', 'penis',
  'vagina', 'porn', 'sex', 'seks', 'hitler', 'adolf', 'nazi', 'heil', 'sieg', 'himmler', 'goebbels', 'mengele', 'swastyk',
  'swastik', 'holocaust', 'holokaust', 'auschwitz', 'zyklon', 'gestapo', 'hakenkreuz', 'fuhrer', 'fuehrer', 'thirdreich',
  'trzeciarzesz', 'stalin', 'mussolini', 'polpot', 'isis', 'daesh', 'alkaida', 'alkaeda', 'alqaeda', 'alqaida', 'jnim',
  'aqim', 'aqmi', 'ansardine', 'taliban', 'jihad', 'dzihad', 'dihad', 'terroryst', 'terrorist', 'binladen', 'iyadaghaly',
  'aghaly', 'koufa', 'qrw', 'hamas', 'hezbol', 'hezbal', 'bokoharam'
];

const RAW_ALLOW = ['sexton', 'essex'];

const STEMS = RAW_STEMS.map(collapse);
const ALLOW = RAW_ALLOW.map(collapse);
const TOKEN_RE = /^(?:k{3,}|s{2,}|sa|as{2,}|ns|nsdap)$/;

const deleet = (s: string, one = 'i'): string => s.replace(/[0134579@$]/g, (c) => (c === '1' ? one : LEET[c] || c));

function isBlocked(nick: string): boolean {
  const digits = nick.replace(/\D/g, '');
  if (digits.indexOf('88') >= 0) return true;
  for (const one of ['i', 'l']) {
    const base = deleet(fold(nick), one);
    const tokens = base.split(/[^a-z]+/).filter(Boolean);
    for (const t of tokens) if (TOKEN_RE.test(t)) return true;
    let joined = collapse(base.replace(/[^a-z]/g, ''));
    for (const a of ALLOW) joined = joined.split(a).join('');
    for (const s of STEMS) if (joined.indexOf(s) >= 0) return true;
  }
  return false;
}

export function checkNickname(raw: string): NickResult {
  const nick = String(raw).normalize('NFC').trim().replace(/\s+/g, ' ');
  if (nick.length < 2 || nick.length > 16) return { ok: false, reason: 'length' };
  if (!CHARS.test(nick)) return { ok: false, reason: 'chars' };
  if (isBlocked(nick)) return { ok: false, reason: 'blocked' };
  return { ok: true, nick };
}

export function nickKey(nick: string): string {
  return fold(nick).replace(/[ _-]/g, '');
}

import type { ErrorCode } from '../../shared/protocol.ts';

export const ERR: Record<ErrorCode, string> = {
  'bad-pin': 'Nie ma gry o takim PIN-ie.',
  locked: 'Quiz już trwa. Nie można dołączyć.',
  full: 'Gra jest pełna.',
  'nick-taken': 'Ten nick jest już zajęty.',
  'nick-invalid': 'Nick: 2-16 znaków, litery, cyfry, spacja, - lub _.',
  'nick-blocked': 'Ten nick jest niedozwolony. Wybierz inny.',
  banned: 'Ten nick został zablokowany przez prowadzącego.',
  'rate-limited': 'Za dużo prób. Spróbuj ponownie za chwilę.',
  'pow-failed': 'Weryfikacja nie powiodła się. Odśwież stronę.',
  'bad-key': 'Nieprawidłowy klucz prowadzącego.',
  'no-players': 'Nikt jeszcze nie dołączył.',
  expired: 'Sesja wygasła. Dołącz ponownie.',
  'not-open': 'Odpowiedzi są teraz zamknięte.',
  duplicate: 'Odpowiedź już zapisana.',
  'bad-choice': 'Coś poszło nie tak. Odśwież stronę.',
  'wrong-question': 'Coś poszło nie tak. Odśwież stronę.',
  'bad-msg': 'Coś poszło nie tak. Odśwież stronę.'
};

export const KICKED = 'Prowadzący usunął cię z gry.';
export const JOIN_HOST = 'prezentacje.fatum.cc/wos/mali/quiz';

export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const d = n % 10;
  const t = n % 100;
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many;
}

export function store(key: string, value?: unknown, durable = false): unknown {
  try {
    const s = durable ? localStorage : sessionStorage;
    if (value === undefined) {
      const v = s.getItem(key);
      return v ? JSON.parse(v) : null;
    }
    if (value === null) s.removeItem(key);
    else s.setItem(key, JSON.stringify(value));
  } catch {
    return null;
  }
  return null;
}

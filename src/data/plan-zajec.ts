/**
 * Plan zajęć — jedyne źródło prawdy.
 *
 * Ten sam plik zasila podstronę /plan-zajec i PDF do pobrania
 * (scripts/make-plan-zajec-pdf.py czyta go przez JSON w public/).
 * Zmiana godziny w jednym miejscu przechodzi na obie wersje.
 *
 * Puste pole (null) oznacza „w tym dniu zajęć nie ma".
 * `null` w całym wierszu — zajęcia zaplanowane, termin jeszcze nieustalony.
 */

export const DNI = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek'] as const;
export type Dzien = (typeof DNI)[number];

export interface Zajecia {
  nazwa: string;
  /** Termin w każdym dniu; null = brak zajęć tego dnia. */
  terminy: Partial<Record<Dzien, string>>;
  /** Krótkie wyjaśnienie pod nazwą — tylko tam, gdzie coś wnosi. */
  opis?: string;
}

export const ROK_SZKOLNY = '2026/2027';

export const PLAN: Zajecia[] = [
  {
    nazwa: 'Zajęcia dydaktyczne',
    opis: 'Codziennie, w każdej grupie',
    terminy: {
      poniedziałek: '9.15–10.30',
      wtorek: '9.15–10.30',
      środa: '9.15–10.30',
      czwartek: '9.15–10.30',
      piątek: '9.15–10.30',
    },
  },
  {
    nazwa: 'Język angielski',
    opis: 'Codziennie',
    terminy: {
      poniedziałek: '11.00–11.30',
      wtorek: '11.30–12.00',
      środa: '11.00–11.30',
      czwartek: '11.00–11.30',
      piątek: '11.00–11.30',
    },
  },
  {
    // Umowa (§ 4): zajęcia rytmiczne dwa razy w tygodniu — codzienna rytmika
    // była pomyłką przy przepisywaniu planu z kartki.
    nazwa: 'Rytmika',
    terminy: {
      wtorek: '11.30–12.00',
      piątek: '11.30–12.00',
    },
  },
  {
    nazwa: 'Gimnastyka',
    terminy: {
      poniedziałek: '12.30–13.00',
      środa: '15.15–15.45',
    },
  },
  {
    nazwa: 'Taniec — ciocia Weronika',
    terminy: {
      czwartek: '14.00–14.30',
    },
  },
  {
    nazwa: 'Taniec nowoczesny',
    terminy: {
      poniedziałek: '13.30–14.00',
    },
  },
  {
    nazwa: 'Plastyka',
    terminy: {},
  },
  {
    nazwa: 'Szachy',
    terminy: {},
  },
  {
    nazwa: 'Judo',
    terminy: {
      piątek: '15.15–16.15',
    },
  },
  {
    nazwa: 'Basen',
    terminy: {
      wtorek: '13.15–15.15',
    },
  },
  {
    nazwa: 'Robotyka',
    terminy: {
      poniedziałek: '15.15–15.45',
    },
  },
  {
    nazwa: 'Akrobatyka',
    terminy: {},
  },
];

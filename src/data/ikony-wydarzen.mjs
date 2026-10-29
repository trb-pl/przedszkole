/**
 * Wygląd wydarzeń — kolor i ikona każdego rodzaju.
 *
 * Jedno źródło dla strony /wydarzenia i dla PDF-u (scripts/wydarzenia-pdf.mjs),
 * żeby wydruk wyglądał jak strona. Rodzaj to wartość pola `ikona` wydarzenia
 * (docelowo: kolumny w arkuszu). Nowy rodzaj = jeden kolor i jedna ikona tutaj.
 */

/** Kolory wyłącznie z palety brandbooka — nazwy jak tokeny brand-* w Tailwindzie. */
export const KOLOR_WYDARZENIA = {
  trabka: 'yellow',
  muzyka: 'yellow',
  teatr: 'navy',
  halloween: 'navy',
  guzik: 'forest',
  muzeum: 'forest',
  lisc: 'teal',
  dynia: 'coral',
  flaga: 'coral',
  prawa: 'teal',
  mis: 'yellow',
  andrzejki: 'navy',
  spotkanie: 'teal',
  prezent: 'coral',
  wigilia: 'forest',
  warsztaty: 'yellow',
  przerwa: 'navy',
};
export const DOMYSLNY_KOLOR = 'teal';

export const IKONY_Z_ZESTAWU = {
  teatr: 'tabler:masks-theater',
  lisc: 'tabler:leaf',
  // Rysowany zwierzak z guzika w rozmiarze kropki czytał się jak budzik.
  guzik: 'tabler:paw',
  // Koncert bez trąbki (gitary) — nuta zamiast konkretnego instrumentu.
  muzyka: 'tabler:music',
  muzeum: 'tabler:building-bank',
  halloween: 'tabler:ghost',
  flaga: 'tabler:flag',
  prawa: 'tabler:heart-handshake',
  // Lanie wosku — świeca mówi „andrzejki" bez słów.
  andrzejki: 'tabler:candle',
  spotkanie: 'tabler:users-group',
  prezent: 'tabler:gift',
  wigilia: 'tabler:christmas-tree',
  warsztaty: 'tabler:brush',
  przerwa: 'tabler:snowflake',
};
export const DOMYSLNA_IKONA = 'tabler:star';

/**
 * Trąbki i przyjaznej dyni nie ma w zestawie Tabler (tamtejsza dynia jest
 * halloweenowa, straszna), więc są narysowane tutaj — na tej samej siatce
 * 24 px, do obrysu tą samą kreską 2 px z zaokrąglonymi końcami. Obok ikon
 * z zestawu nie odstają. Same ścieżki SVG: strona wstawia je do <svg>,
 * PDF rysuje je bezpośrednio.
 */
export const IKONY_WLASNE = {
  trabka: [
    'M2.5 10.5v3',
    'M2.5 12H16',
    'M16 9.5l5-3v11l-5-3z',
    'M6 12v2.5A1.5 1.5 0 0 0 7.5 16h5a1.5 1.5 0 0 0 1.5-1.5V12',
    'M7.5 12V9M10.5 12V9M13.5 12V9',
  ],
  dynia: [
    'M4 13.5a8 6.5 0 1 0 16 0a8 6.5 0 1 0 -16 0',
    'M12 7c-2.2 1.5-3.3 3.8-3.3 6.5s1.1 5 3.3 6.5',
    'M12 7c2.2 1.5 3.3 3.8 3.3 6.5s-1.1 5-3.3 6.5',
    'M12 7V4',
    'M12 5c1-1.5 2.8-2 4.5-1.5-.5 1.7-2.5 2.5-4.5 1.5z',
  ],
  // Pluszowy miś — Tabler ma tylko dzikie zwierzęta.
  mis: [
    'M5 13a7 7 0 1 0 14 0a7 7 0 1 0 -14 0',
    'M4.6 8.4a2.6 2.6 0 1 1 3.4 -3.4',
    'M16 5a2.6 2.6 0 1 1 3.4 3.4',
    'M9.2 15.5a2.8 2.1 0 1 0 5.6 0a2.8 2.1 0 1 0 -5.6 0',
    'M9.5 11h.01M14.5 11h.01M12 15v.01',
  ],
};

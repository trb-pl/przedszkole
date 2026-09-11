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
  teatr: 'navy',
  guzik: 'forest',
  lisc: 'teal',
  dynia: 'coral',
};
export const DOMYSLNY_KOLOR = 'teal';

export const IKONY_Z_ZESTAWU = {
  teatr: 'tabler:masks-theater',
  lisc: 'tabler:leaf',
  // Rysowany zwierzak z guzika w rozmiarze kropki czytał się jak budzik.
  guzik: 'tabler:paw',
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
};

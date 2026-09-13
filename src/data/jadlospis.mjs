/**
 * Jadłospis tygodnia — odczyt Arkusza Google, który kuchnia co tydzień nadpisuje.
 *
 * Układ arkusza (jedna zakładka):
 *
 *   Kolorowe Przedszkole - Jadłospis 14.09- 18.09.2026   ← tytuł z datami tygodnia
 *                    | poniedziałek | wtorek | … | piątek ← nagłówek dni
 *   Drugie Śniadanie | …                                  ← posiłki
 *   Zupa             | …
 *   Alergeny         | 1;3;7;9;     | …                   ← numery alergenów
 *
 * Wiersze rozpoznajemy po treści (dni tygodnia, słowo „Alergeny"), a nie po
 * numerach — dopisany pusty wiersz albo nowy posiłek niczego nie psują.
 *
 * Arkusz pobiera wyłącznie scripts/jadlospis-pliki.mjs, raz na build, i zapisuje
 * wynik do src/data/jadlospis.json. Strona czyta już tylko ten plik.
 */
import { DNI } from './plan-zajec.mjs';

/** 14 alergenów z rozporządzenia UE 1169/2011 — ta sama numeracja, której używa kuchnia. */
export const ALERGENY = {
  1: { krotko: 'gluten', pelna: 'Zboża zawierające gluten' },
  2: { krotko: 'skorupiaki', pelna: 'Skorupiaki' },
  3: { krotko: 'jaja', pelna: 'Jaja' },
  4: { krotko: 'ryby', pelna: 'Ryby' },
  5: { krotko: 'orzeszki ziemne', pelna: 'Orzeszki ziemne (arachidowe)' },
  6: { krotko: 'soja', pelna: 'Soja' },
  7: { krotko: 'mleko', pelna: 'Mleko (łącznie z laktozą)' },
  8: { krotko: 'orzechy', pelna: 'Orzechy' },
  9: { krotko: 'seler', pelna: 'Seler' },
  10: { krotko: 'gorczyca', pelna: 'Gorczyca' },
  11: { krotko: 'sezam', pelna: 'Nasiona sezamu' },
  12: { krotko: 'siarczyny', pelna: 'Dwutlenek siarki i siarczyny' },
  13: { krotko: 'łubin', pelna: 'Łubin' },
  14: { krotko: 'mięczaki', pelna: 'Mięczaki' },
};

/** Kolor (z palety brandbooka) i ikona każdego rodzaju posiłku — dla strony i PDF-u. */
export const WYGLAD_POSILKU = {
  sniadanie: { kolor: 'yellow', ikona: 'tabler:bread' },
  zupa: { kolor: 'coral', ikona: 'tabler:soup' },
  obiad: { kolor: 'teal', ikona: 'tabler:tools-kitchen-2' },
  podwieczorek: { kolor: 'forest', ikona: 'tabler:apple' },
};

export function rodzajPosilku(nazwa) {
  const n = nazwa.toLowerCase();
  if (n.includes('śniadanie')) return 'sniadanie';
  if (n.includes('zupa')) return 'zupa';
  if (n.includes('podwieczorek')) return 'podwieczorek';
  return 'obiad';
}

/**
 * CSV z Arkusza Google, łącznie z komórkami w cudzysłowach, w których są
 * przecinki albo przejścia do nowej linii (Alt+Enter w komórce). Dlatego nie
 * dzielimy najpierw tekstu na linie, jak przy planie zajęć.
 */
export function parsujCsv(tekst) {
  const wiersze = [];
  let wiersz = [];
  let pole = '';
  let wCudzyslowie = false;

  for (let i = 0; i < tekst.length; i++) {
    const znak = tekst[i];

    if (wCudzyslowie) {
      if (znak !== '"') pole += znak;
      else if (tekst[i + 1] === '"') {
        pole += '"';
        i++;
      } else wCudzyslowie = false;
      continue;
    }

    if (znak === '"') wCudzyslowie = true;
    else if (znak === ',') {
      wiersz.push(pole);
      pole = '';
    } else if (znak === '\n' || znak === '\r') {
      if (znak === '\r' && tekst[i + 1] === '\n') i++;
      wiersz.push(pole);
      wiersze.push(wiersz);
      wiersz = [];
      pole = '';
    } else pole += znak;
  }

  if (pole || wiersz.length) {
    wiersz.push(pole);
    wiersze.push(wiersz);
  }
  return wiersze.map((w) => w.map((p) => p.trim()));
}

/**
 * Typografia bez zmiany treści: pojedyncze spacje i łącznik bez spacji
 * w złożeniach („żytnio -razowe", „mleczno- bananowy" → „żytnio-razowe").
 * Pierwszy człon polskiego złożenia kończy się na „-o", więc tylko wtedy
 * sklejamy — myślnik między zdaniami zostaje nietknięty.
 */
function oczysc(tekst) {
  return tekst
    .replace(/\s+/g, ' ')
    .replace(/(\p{Ll}o) ?- ?(\p{Ll})/gu, '$1-$2')
    .trim();
}

/**
 * „…mix warzyw. Herbata z cytryną." → ["…mix warzyw", "Herbata z cytryną"].
 * Kuchnia oddziela napój kropką; na stronie każde zdanie dostaje linijkę.
 * Dzielimy tylko przed wielką literą, więc „ok. 200 g" zostaje w całości.
 */
function naLinijki(tekst) {
  return oczysc(tekst)
    .split(/\.\s+(?=\p{Lu})/u)
    .map((z) => z.replace(/\.$/, '').trim())
    .filter(Boolean)
    .map((z) => z.charAt(0).toUpperCase() + z.slice(1));
}

const naIso = (rok, miesiac, dzien) =>
  `${rok}-${String(miesiac).padStart(2, '0')}-${String(dzien).padStart(2, '0')}`;

/** „Jadłospis 14.09- 18.09.2026" → { od: '2026-09-14', do: '2026-09-18' }. */
function tydzienZTytulu(tytul) {
  const m = tytul.match(/(\d{1,2})\.(\d{1,2})\.?(\d{4})?\s*[-–—]\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!m) return null;

  const [, d1, m1, r1, d2, m2, r2] = m;
  const rokKonca = Number(r2);
  // Tydzień na przełomie roku: „29.12- 2.01.2027" zaczyna się w 2026.
  const rokPoczatku = r1 ? Number(r1) : Number(m1) > Number(m2) ? rokKonca - 1 : rokKonca;
  return { od: naIso(rokPoczatku, m1, d1), do: naIso(rokKonca, m2, d2) };
}

export function parsujJadlospis(csv) {
  const wiersze = parsujCsv(csv);
  const ostrzezenia = [];

  const iNaglowka = wiersze.findIndex((w) => DNI.every((d) => w.some((p) => p.toLowerCase() === d)));
  if (iNaglowka === -1) throw new Error('W arkuszu nie ma wiersza z dniami od poniedziałku do piątku');

  const naglowek = wiersze[iNaglowka].map((p) => p.toLowerCase());
  const kolumny = DNI.map((d) => naglowek.indexOf(d));

  const tytul = wiersze.slice(0, iNaglowka).flat().find(Boolean) ?? '';
  const tydzien = tydzienZTytulu(tytul);
  if (!tydzien) ostrzezenia.push(`nie rozumiem dat w tytule „${tytul}" — strona pokaże jadłospis bez dat`);

  // Daty dni tylko wtedy, gdy tydzień zaczyna się w poniedziałek — inaczej
  // podświetlenie „dziś" trafiałoby w zły dzień.
  let pierwszyDzien = tydzien ? new Date(tydzien.od + 'T12:00:00Z') : null;
  if (pierwszyDzien && pierwszyDzien.getUTCDay() !== 1) {
    ostrzezenia.push(`tydzień w tytule zaczyna się ${tydzien.od}, a to nie poniedziałek — pomijam daty dni`);
    pierwszyDzien = null;
  }
  const dataDnia = (i) => {
    if (!pierwszyDzien) return null;
    const d = new Date(pierwszyDzien);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  };

  const posilki = [];
  let alergeny = DNI.map(() => []);

  for (const w of wiersze.slice(iNaglowka + 1)) {
    const etykieta = w[0];
    if (!etykieta) continue;

    if (/alergen/i.test(etykieta)) {
      alergeny = kolumny.map((k) => {
        const numery = [...new Set((w[k]?.match(/\d+/g) ?? []).map(Number))].sort((a, b) => a - b);
        for (const n of numery.filter((n) => !ALERGENY[n])) {
          ostrzezenia.push(`nieznany numer alergenu ${n} — pomijam`);
        }
        return numery.filter((n) => ALERGENY[n]);
      });
      continue;
    }

    // „Drugie Śniadanie" → „Drugie śniadanie" — po polsku bez wielkich liter w środku.
    const nazwa = etykieta.charAt(0).toUpperCase() + etykieta.slice(1).toLowerCase();
    posilki.push({
      nazwa,
      rodzaj: rodzajPosilku(nazwa),
      pozycje: kolumny.map((k) => (w[k] ? naLinijki(w[k]) : [])),
    });
  }

  if (!posilki.length) throw new Error('Arkusz nie zawiera żadnych posiłków');

  return {
    jadlospis: {
      tytul,
      tydzien,
      dni: DNI.map((dzien, i) => ({ dzien, data: dataDnia(i), alergeny: alergeny[i] })),
      posilki,
    },
    ostrzezenia,
  };
}

/** Pobiera i parsuje arkusz. Rzuca błędem — decyzję o planie B podejmuje wołający. */
export async function pobierzJadlospis(adres) {
  const odpowiedz = await fetch(adres, { signal: AbortSignal.timeout(15_000) });
  if (!odpowiedz.ok) throw new Error('HTTP ' + odpowiedz.status);
  return parsujJadlospis(await odpowiedz.text());
}

/** „14–18 września 2026", „28 września – 2 października 2026". */
export function opisTygodnia(tydzien) {
  if (!tydzien) return '';
  const czesci = (iso) => {
    const d = new Date(iso + 'T12:00:00Z');
    return {
      dzien: d.getUTCDate(),
      miesiac: d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', timeZone: 'UTC' }).replace(/^\d+\s*/, ''),
      rok: d.getUTCFullYear(),
    };
  };
  const a = czesci(tydzien.od);
  const b = czesci(tydzien.do);
  if (a.rok !== b.rok) return `${a.dzien} ${a.miesiac} ${a.rok} – ${b.dzien} ${b.miesiac} ${b.rok}`;
  if (a.miesiac !== b.miesiac) return `${a.dzien} ${a.miesiac} – ${b.dzien} ${b.miesiac} ${b.rok}`;
  return `${a.dzien}–${b.dzien} ${b.miesiac} ${b.rok}`;
}

/** Nazwa PDF-u z datą początku tygodnia — w Pobranych od razu widać, który to tydzień. */
export function plikPdfJadlospisu(jadlospis) {
  return `jadlospis-${jadlospis.tydzien?.od ?? 'tydzien'}.pdf`;
}

/** Nazwy alergenów dnia: „gluten, jaja, mleko, seler". */
export function nazwyAlergenow(numery) {
  return numery.map((n) => ALERGENY[n]?.krotko).filter(Boolean).join(', ');
}

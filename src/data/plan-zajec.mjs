/**
 * Plan zajęć — dane pobierane z Arkusza Google przy budowaniu strony.
 *
 * Dyrekcja edytuje arkusz, Apps Script po zapisie woła Deploy Hook Vercela,
 * a strona przebudowuje się z nowymi godzinami. Rodzic dostaje statyczny
 * HTML, więc plan wyświetla się natychmiast i nie miga przy ładowaniu.
 *
 * PLAN_ZAPASOWY to ostatni znany plan wpisany do repozytorium. Używamy go,
 * gdy arkusz jest niedostępny — awaria Google nie może wywalić budowania ani
 * pokazać rodzicom pustej tabeli.
 *
 * Adres arkusza (opublikowanego jako CSV) siedzi w PUBLIC_PLAN_CSV.
 *
 * Plik jest zwykłym JS-em, nie TS-em, bo korzysta z niego również skrypt
 * budujący PDF uruchamiany w Node — inaczej parser istniałby w dwóch
 * kopiach, a rozjazd między nimi to dokładnie ten rodzaj błędu, którego
 * nikt nie zauważa aż do wydruku.
 */

export const DNI = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek'];

/**
 * @typedef {Object} Zajecia
 * @property {string} nazwa
 * @property {Object<string, string>} terminy  termin w danym dniu; brak klucza = nie ma zajęć
 * @property {string} [opis]                   krótkie wyjaśnienie pod nazwą
 */

export const ROK_SZKOLNY = '2026/2027';

/** @type {Zajecia[]} */
const PLAN_ZAPASOWY = [
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
  { nazwa: 'Rytmika', terminy: { wtorek: '11.30–12.00', piątek: '11.30–12.00' } },
  { nazwa: 'Gimnastyka', terminy: { poniedziałek: '12.30–13.00', środa: '15.15–15.45' } },
  { nazwa: 'Taniec — ciocia Weronika', terminy: { czwartek: '14.00–14.30' } },
  { nazwa: 'Taniec nowoczesny', terminy: { poniedziałek: '13.30–14.00' } },
  { nazwa: 'Plastyka', terminy: {} },
  { nazwa: 'Szachy', terminy: {} },
  { nazwa: 'Judo', terminy: { piątek: '15.15–16.15' } },
  { nazwa: 'Basen', terminy: { wtorek: '13.15–15.15' } },
  { nazwa: 'Robotyka', terminy: { poniedziałek: '15.15–15.45' } },
  { nazwa: 'Akrobatyka', terminy: {} },
];

/** Rozbija wiersz CSV z uwzględnieniem pól w cudzysłowach. */
function podzielWiersz(linia) {
  /** @type {string[]} */
  const pola = [];
  let biezace = '';
  let wCudzyslowie = false;

  for (let i = 0; i < linia.length; i++) {
    const znak = linia[i];

    if (znak === '"') {
      // Podwójny cudzysłów w środku pola to zapis jednego znaku ".
      if (wCudzyslowie && linia[i + 1] === '"') {
        biezace += '"';
        i++;
      } else {
        wCudzyslowie = !wCudzyslowie;
      }
      continue;
    }

    if (znak === ',' && !wCudzyslowie) {
      pola.push(biezace);
      biezace = '';
      continue;
    }

    biezace += znak;
  }

  pola.push(biezace);
  return pola.map((p) => p.trim());
}

function zParsujCsv(csv) {
  const linie = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (linie.length < 2) throw new Error('Arkusz nie zawiera danych');

  const naglowki = podzielWiersz(linie[0]).map((n) => n.toLowerCase());
  const kolumnaDnia = DNI.map((d) => naglowki.indexOf(d));
  const kolumnaOpisu = naglowki.indexOf('opis');

  if (kolumnaDnia.some((i) => i === -1)) {
    throw new Error('W arkuszu brakuje kolumny z którymś dniem tygodnia');
  }

  return linie.slice(1).map((linia) => {
    const pola = podzielWiersz(linia);
    const terminy = {};

    DNI.forEach((dzien, i) => {
      const wartosc = pola[kolumnaDnia[i]];
      if (wartosc) terminy[dzien] = wartosc;
    });

    const opis = kolumnaOpisu >= 0 ? pola[kolumnaOpisu] : '';
    return { nazwa: pola[0], terminy, ...(opis ? { opis } : {}) };
  }).filter((z) => z.nazwa);
}

/**
 * Plan z arkusza, a gdy się nie uda — ostatni znany z repozytorium.
 * Budowanie strony nigdy nie przerywa się przez Google.
 */
export async function wczytajPlan() {
  // Astro podaje zmienne przez import.meta.env, Node przez process.env —
  // ten moduł czyta oba, bo używa go i strona, i skrypt generujący PDF.
  const adres =
    (typeof process !== 'undefined' && process.env?.PUBLIC_PLAN_CSV) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_PLAN_CSV) ||
    '';
  if (!adres) return { plan: PLAN_ZAPASOWY, zrodlo: 'repozytorium' };

  try {
    const odpowiedz = await fetch(adres, { signal: AbortSignal.timeout(10_000) });
    if (!odpowiedz.ok) throw new Error('HTTP ' + odpowiedz.status);

    const plan = zParsujCsv(await odpowiedz.text());
    if (!plan.length) throw new Error('Arkusz jest pusty');

    return { plan, zrodlo: 'arkusz' };
  } catch (blad) {
    console.warn('[plan zajęć] Nie udało się pobrać arkusza, używam planu z repozytorium:', blad);
    return { plan: PLAN_ZAPASOWY, zrodlo: 'repozytorium' };
  }
}

export { PLAN_ZAPASOWY };

/**
 * Plan zajęć — odczyt Arkusza Google z planami wszystkich grup.
 *
 * Arkusz ma jedną zakładkę, a w niej grupy jedna pod drugą:
 *
 *   Gwiazdki                                  ← nazwa grupy
 *   Zajęcia | Opis | Poniedziałek | … | Piątek ← nagłówek
 *   Rytmika |      |              | … |        ← zajęcia
 *   (puste wiersze)
 *   Liski
 *   Zajęcia | Opis | …
 *
 * Moduł jest zwykłym JS-em, bo czyta go skrypt budujący (Node) — ten sam
 * parser dla stron, PDF-ów i kalendarzy, więc nie mogą się rozjechać.
 *
 * Arkusz pobiera wyłącznie scripts/plan-pliki.mjs, raz na build, i zapisuje
 * wynik do src/data/plan-zajec.json. Strony czytają już tylko ten plik.
 */

export const DNI = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek'];
export const ROK_SZKOLNY = '2026/2027';

/** „Wiewiórki" → „wiewiorki". Adresy URL i nazwy plików bez ogonków. */
export function naSlug(tekst) {
  return String(tekst)
    .replace(/ł/g, 'l').replace(/Ł/g, 'L')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Sprowadza wpisaną godzinę do jednej postaci.
 *
 * Dyrekcja wpisuje raz „12:00–12.30", raz „10:45-11:15", raz „9.15–10.30".
 * Na stronie i w PDF-ie ma to wyglądać jednakowo, a kalendarz potrzebuje
 * godzin, które da się policzyć. Wpis, którego nie da się odczytać, zostaje
 * pokazany dosłownie — ale nie trafia do kalendarza.
 */
export function normalizujTermin(surowy) {
  const tekst = String(surowy).trim();
  const m = tekst.match(/^(\d{1,2})[.:](\d{2})\s*[-–—]\s*(\d{1,2})[.:](\d{2})$/);
  if (!m) return { tekst };

  const [, h1, m1, h2, m2] = m;
  return {
    tekst: `${Number(h1)}.${m1}–${Number(h2)}.${m2}`,
    od: `${h1.padStart(2, '0')}:${m1}`,
    do: `${h2.padStart(2, '0')}:${m2}`,
  };
}

/** Rozbija wiersz CSV z uwzględnieniem pól w cudzysłowach. */
function podzielWiersz(linia) {
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

const pusty = (wiersz) => wiersz.every((pole) => !pole);

/**
 * Dzieli arkusz na grupy.
 *
 * Kotwicą jest wiersz nagłówka („Zajęcia | Opis | …"), a nazwą grupy —
 * najbliższy niepusty wiersz nad nim. Nie da się rozpoznać nazwy grupy po
 * samym wyglądzie wiersza: „Akrobatyka" bez żadnej godziny wygląda
 * identycznie jak „Liski". Różni je tylko to, że pod nazwą grupy stoi nagłówek.
 */
export function parsujArkusz(csv) {
  const wiersze = csv.split(/\r?\n/).map(podzielWiersz);
  const naglowki = wiersze
    .map((w, i) => (w[0]?.toLowerCase() === 'zajęcia' ? i : -1))
    .filter((i) => i >= 0);

  if (!naglowki.length) throw new Error('W arkuszu nie ma wiersza nagłówka „Zajęcia"');

  // Wiersz z nazwą grupy nad każdym nagłówkiem (albo brak, gdy nagłówek
  // stoi na samej górze).
  const wierszeNazw = naglowki.map((h) => {
    for (let i = h - 1; i >= 0; i--) {
      if (!pusty(wiersze[i])) return i;
    }
    return -1;
  });

  return naglowki.map((h, k) => {
    const kolumny = wiersze[h].map((n) => n.toLowerCase());
    const kolumnaDnia = DNI.map((d) => kolumny.indexOf(d));
    const kolumnaOpisu = kolumny.indexOf('opis');

    if (kolumnaDnia.some((i) => i === -1)) {
      throw new Error(`W nagłówku grupy nr ${k + 1} brakuje któregoś dnia tygodnia`);
    }

    // Zajęcia kończą się tuż przed nazwą następnej grupy.
    const koniec = k + 1 < naglowki.length ? wierszeNazw[k + 1] : wiersze.length;
    const nazwa = wierszeNazw[k] >= 0 ? wiersze[wierszeNazw[k]][0] : `Grupa ${k + 1}`;

    const zajecia = wiersze.slice(h + 1, koniec)
      .filter((w) => w[0])
      .map((w) => {
        const terminy = {};
        DNI.forEach((dzien, i) => {
          if (w[kolumnaDnia[i]]) terminy[dzien] = normalizujTermin(w[kolumnaDnia[i]]);
        });
        const opis = kolumnaOpisu >= 0 ? w[kolumnaOpisu] : '';
        return { nazwa: w[0], ...(opis ? { opis } : {}), terminy };
      });

    return { nazwa, slug: naSlug(nazwa), zajecia };
  });
}

/**
 * Wyłapuje nakładające się zajęcia w tej samej grupie i dniu. Przy ręcznym
 * przepisywaniu planu to dokładnie ten błąd, który inaczej wychodzi dopiero
 * pod drzwiami sali.
 */
export function znajdzKolizje(grupy) {
  const kolizje = [];

  for (const grupa of grupy) {
    for (const dzien of DNI) {
      const tegoDnia = grupa.zajecia
        .filter((z) => z.terminy[dzien]?.od)
        .map((z) => ({ nazwa: z.nazwa, ...z.terminy[dzien] }))
        .sort((a, b) => a.od.localeCompare(b.od));

      for (let i = 1; i < tegoDnia.length; i++) {
        if (tegoDnia[i].od < tegoDnia[i - 1].do) {
          kolizje.push(`${grupa.nazwa}, ${dzien}: ${tegoDnia[i - 1].nazwa} `
            + `(${tegoDnia[i - 1].tekst}) nachodzi na ${tegoDnia[i].nazwa} (${tegoDnia[i].tekst})`);
        }
      }
    }
  }

  return kolizje;
}

/** Pobiera i parsuje arkusz. Rzuca błędem — decyzję o planie B podejmuje wołający. */
export async function pobierzGrupy(adres) {
  const odpowiedz = await fetch(adres, { signal: AbortSignal.timeout(15_000) });
  if (!odpowiedz.ok) throw new Error('HTTP ' + odpowiedz.status);

  const grupy = parsujArkusz(await odpowiedz.text());
  if (!grupy.some((g) => g.zajecia.length)) throw new Error('Arkusz nie zawiera żadnych zajęć');
  return grupy;
}

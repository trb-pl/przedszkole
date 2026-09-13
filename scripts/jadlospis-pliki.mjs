/**
 * Jadłospis — pobranie arkusza i PDF, raz na build.
 *
 *   1. src/data/jadlospis.json            migawka, z której buduje się strona /jadlospis
 *   2. public/dokumenty/jadlospis-*.pdf   wydruk na drzwi przedszkola
 *
 * Tak jak przy planie zajęć: jedno pobranie na build, więc strona i PDF
 * pokazują tę samą wersję arkusza, a gdy arkusz jest niedostępny (albo jeszcze
 * nieopublikowany) — zostaje ostatnia migawka zapisana w repo.
 *
 * Uruchamiany automatycznie przez `npm run build` (skrypt `prebuild`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import PDFDocument from 'pdfkit';

import {
  ALERGENY,
  WYGLAD_POSILKU,
  nazwyAlergenow,
  opisTygodnia,
  plikPdfJadlospisu,
  pobierzJadlospis,
} from '../src/data/jadlospis.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MIGAWKA = path.join(ROOT, 'src/data/jadlospis.json');
const KATALOG_PDF = path.join(ROOT, 'public/dokumenty');
const FONTY = path.join(ROOT, 'scripts/fonty');
const LOGO = path.join(ROOT, 'docs/apps-script/szablon/logo.png');

// ─────────────────────────────────────────────────────────────────────────
// 1. DANE
// ─────────────────────────────────────────────────────────────────────────

/** Lokalny `npm run build` nie czyta .env sam — bez tego zawsze budowałaby się migawka. */
function wczytajEnv() {
  const plik = path.join(ROOT, '.env');
  if (!fs.existsSync(plik)) return;
  for (const linia of fs.readFileSync(plik, 'utf8').split('\n')) {
    const m = linia.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

async function wczytajDane() {
  wczytajEnv();
  const adres = process.env.PUBLIC_JADLOSPIS_CSV;

  try {
    if (!adres) throw new Error('brak zmiennej PUBLIC_JADLOSPIS_CSV');
    const { jadlospis, ostrzezenia } = await pobierzJadlospis(adres);
    for (const o of ostrzezenia) console.warn('[jadłospis] ⚠ ' + o);
    fs.writeFileSync(MIGAWKA, JSON.stringify(jadlospis, null, 2) + '\n');
    return { jadlospis, zrodlo: 'arkusz' };
  } catch (blad) {
    console.warn(`[jadłospis] Nie pobrano arkusza (${blad.message}) — używam ostatniej migawki z repo.`);
    return { jadlospis: JSON.parse(fs.readFileSync(MIGAWKA, 'utf8')), zrodlo: 'migawka' };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 2. PDF
// ─────────────────────────────────────────────────────────────────────────

// Paleta z brandbooka — te same wartości co tokeny brand-* w tailwind.css.
const BRAND = {
  navy: '#2D346F',
  teal: '#34BBA8',
  coral: '#F2795D',
  yellow: '#F5C41F',
  forest: '#415D43',
};
const SZARY = '#8B8FA8';
const LINIA = '#D5D7E3';
const PASEK = '#F7F5F2';
const MM = 72 / 25.4;

// Zdanie ze strony (porady: „Ile kosztuje prywatne przedszkole") — nie nowa obietnica.
const DIETY =
  'Dzieci na dietach eliminacyjnych (alergie, nietolerancje pokarmowe) otrzymują odpowiednio zmodyfikowane menu — bez dodatkowych opłat.';

const naDuzaLitere = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const krotkaData = (iso) => (iso ? `${Number(iso.slice(8, 10))}.${iso.slice(5, 7)}` : '');

function rysujPdf(dok, j) {
  const W = dok.page.width;
  const H = dok.page.height;
  const margines = 12 * MM;

  // ── Nagłówek — jak w PDF-ach planu zajęć ──────────────────────────────
  if (fs.existsSync(LOGO)) dok.image(LOGO, margines, 10 * MM, { width: 36 * MM });
  dok.font('Bold').fontSize(17).fillColor(BRAND.navy)
    .text('JADŁOSPIS', 0, 10.5 * MM, { width: W, align: 'center' });
  const tydzien = opisTygodnia(j.tydzien);
  if (tydzien) {
    dok.font('Bold').fontSize(11).fillColor(BRAND.teal)
      .text(tydzien, 0, 17 * MM, { width: W, align: 'center' });
  }

  // ── Tabela ────────────────────────────────────────────────────────────
  const gora = 27 * MM;
  const kolNazwy = 34 * MM;
  const szerDnia = (W - 2 * margines - kolNazwy) / j.dni.length;
  const wysNaglowka = 11 * MM;
  const padX = 2.6 * MM;
  const padY = 2.4 * MM;
  const dolTabeli = H - 30 * MM; // pod tabelą legenda i stopka

  // Wysokość komórki przy danym rozmiarze pisma. Kolejne linijki (zwykle napój)
  // są mniejsze i szare, jak na stronie.
  const wysKomorki = (linijki, rozmiar) => {
    let h = 0;
    linijki.forEach((l, i) => {
      dok.font('Regular').fontSize(i ? rozmiar - 0.5 : rozmiar);
      h += dok.heightOfString(l, { width: szerDnia - 2 * padX, lineGap: 0.6 }) + (i ? 1.5 : 0);
    });
    return h + 2 * padY;
  };
  const wysAlergenow = (rozmiar) =>
    Math.max(...j.dni.map((d) => {
      dok.font('Regular').fontSize(rozmiar - 1);
      return 11 + dok.heightOfString(nazwyAlergenow(d.alergeny) || '—', { width: szerDnia - 2 * padX });
    })) + 2 * padY;

  // Największe pismo, przy którym cały tydzień mieści się na jednej kartce.
  let rozmiar = 9;
  let wysokosci;
  for (; rozmiar >= 6.5; rozmiar -= 0.5) {
    wysokosci = j.posilki.map((p) =>
      Math.max(12 * MM, ...p.pozycje.map((linijki) => wysKomorki(linijki, rozmiar))),
    );
    const razem = wysNaglowka + wysokosci.reduce((a, b) => a + b, 0) + wysAlergenow(rozmiar);
    if (gora + razem <= dolTabeli) break;
  }

  dok.rect(margines, gora, W - 2 * margines, wysNaglowka).fill(PASEK);
  dok.font('Bold').fontSize(9.5).fillColor(BRAND.navy).text('Posiłek', margines + padX, gora + 3.8 * MM);
  j.dni.forEach((d, i) => {
    const x = margines + kolNazwy + i * szerDnia;
    dok.font('Bold').fontSize(9.5).fillColor(BRAND.navy)
      .text(naDuzaLitere(d.dzien), x, gora + 2.2 * MM, { width: szerDnia, align: 'center' });
    if (d.data) {
      dok.font('Regular').fontSize(8).fillColor(SZARY)
        .text(krotkaData(d.data), x, gora + 6.4 * MM, { width: szerDnia, align: 'center' });
    }
  });

  let y = gora + wysNaglowka;
  j.posilki.forEach((p, n) => {
    const h = wysokosci[n];
    if (n % 2) dok.rect(margines, y, W - 2 * margines, h).fill(PASEK);

    const kolor = BRAND[WYGLAD_POSILKU[p.rodzaj]?.kolor] ?? BRAND.teal;
    dok.circle(margines + padX + 1.6 * MM, y + padY + 1.9 * MM, 1.6 * MM).fill(kolor);
    dok.font('Bold').fontSize(9).fillColor(BRAND.navy)
      .text(p.nazwa, margines + padX + 4.6 * MM, y + padY, { width: kolNazwy - padX - 5.5 * MM });

    p.pozycje.forEach((linijki, i) => {
      let ty = y + padY;
      const x = margines + kolNazwy + i * szerDnia + padX;
      if (!linijki.length) {
        dok.font('Regular').fontSize(rozmiar).fillColor(LINIA).text('—', x, ty, { width: szerDnia - 2 * padX });
        return;
      }
      linijki.forEach((l, k) => {
        dok.font('Regular').fontSize(k ? rozmiar - 0.5 : rozmiar).fillColor(k ? SZARY : BRAND.navy)
          .text(l, x, ty + (k ? 1.5 : 0), { width: szerDnia - 2 * padX, lineGap: 0.6 });
        ty = dok.y;
      });
    });
    y += h;
  });

  // Wiersz alergenów: numery jak w arkuszu, pod nimi nazwy.
  const hAlergenow = wysAlergenow(rozmiar);
  dok.rect(margines, y, W - 2 * margines, hAlergenow).fill('#FDF3D2');
  dok.font('Bold').fontSize(9).fillColor(BRAND.navy).text('Alergeny', margines + padX, y + padY);
  j.dni.forEach((d, i) => {
    const x = margines + kolNazwy + i * szerDnia + padX;
    dok.font('Bold').fontSize(rozmiar).fillColor(BRAND.navy)
      .text(d.alergeny.join(', ') || '—', x, y + padY, { width: szerDnia - 2 * padX });
    if (d.alergeny.length) {
      dok.font('Regular').fontSize(rozmiar - 1).fillColor(SZARY)
        .text(nazwyAlergenow(d.alergeny), x, dok.y + 0.5, { width: szerDnia - 2 * padX });
    }
  });
  const dol = y + hAlergenow;

  dok.lineWidth(0.5).strokeColor(LINIA);
  let yLinii = gora + wysNaglowka;
  for (const h of [...wysokosci, hAlergenow]) {
    dok.moveTo(margines, yLinii).lineTo(W - margines, yLinii).stroke();
    yLinii += h;
  }
  for (let i = 0; i <= j.dni.length; i++) {
    const x = margines + kolNazwy + i * szerDnia;
    dok.moveTo(x, gora).lineTo(x, dol).stroke();
  }
  dok.lineWidth(0.8).strokeColor(BRAND.navy);
  dok.rect(margines, gora, W - 2 * margines, dol - gora).stroke();
  dok.moveTo(margines, gora + wysNaglowka).lineTo(W - margines, gora + wysNaglowka).stroke();

  // ── Legenda alergenów i stopka ────────────────────────────────────────
  const legenda = Object.entries(ALERGENY).map(([n, a]) => `${n} ${a.krotko}`).join(' · ');
  dok.font('Bold').fontSize(7.5).fillColor(BRAND.teal).text('ALERGENY', margines, dol + 4 * MM, { lineBreak: false });
  dok.font('Regular').fontSize(7.5).fillColor(BRAND.navy)
    .text(legenda, margines + 18 * MM, dol + 4 * MM, { width: W - 2 * margines - 18 * MM });
  dok.font('Italic').fontSize(7.5).fillColor(SZARY).text(DIETY, margines, dok.y + 1.5 * MM, { width: W - 2 * margines });

  dok.font('Regular').fontSize(7.5).fillColor(SZARY)
    .text('Kontakt: 605 657 366 · przedszkole@kolorowe.eu', margines, H - 10 * MM, { lineBreak: false });
  dok.text('www.koloroweprzedszkole.com', W - margines - 60 * MM, H - 10 * MM, {
    width: 60 * MM,
    align: 'right',
    lineBreak: false,
  });

  return rozmiar;
}

// ─────────────────────────────────────────────────────────────────────────
// URUCHOMIENIE
// ─────────────────────────────────────────────────────────────────────────

const { jadlospis, zrodlo } = await wczytajDane();
const plik = plikPdfJadlospisu(jadlospis);

fs.mkdirSync(KATALOG_PDF, { recursive: true });
// PDF poprzedniego tygodnia znika — na stronie jest link tylko do bieżącego.
for (const stary of fs.readdirSync(KATALOG_PDF)) {
  if (/^jadlospis-.+\.pdf$/.test(stary) && stary !== plik) fs.rmSync(path.join(KATALOG_PDF, stary));
}

const dok = new PDFDocument({
  size: 'A4',
  layout: 'landscape',
  margin: 0,
  info: { Title: `Jadłospis ${opisTygodnia(jadlospis.tydzien)}`.trim(), Author: 'Kolorowe Przedszkole' },
});
dok.registerFont('Regular', path.join(FONTY, 'Nunito-Regular.ttf'));
dok.registerFont('Bold', path.join(FONTY, 'Nunito-Bold.ttf'));
dok.registerFont('Italic', path.join(FONTY, 'Nunito-Italic.ttf'));

const zapisany = new Promise((gotowe, blad) => {
  const strumien = fs.createWriteStream(path.join(KATALOG_PDF, plik));
  strumien.on('finish', gotowe).on('error', blad);
  dok.pipe(strumien);
});
const rozmiar = rysujPdf(dok, jadlospis);
dok.end();
await zapisany;

console.log(`[jadłospis] ${plik}: ${jadlospis.posilki.length} posiłków, pismo ${rozmiar} pt, źródło danych: ${zrodlo}`);

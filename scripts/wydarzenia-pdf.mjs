/**
 * Wydarzenia miesiąca w PDF — ten sam miesiąc co na stronie /wydarzenia,
 * do wydruku na tablicę albo wysłania rodzicom.
 *
 * Dane, kolory i ikony pochodzą z tych samych plików co strona
 * (src/data/wydarzenia.mjs, src/data/ikony-wydarzen.mjs), więc wydruk nie
 * rozjedzie się ze stroną. Minione wydarzenia nie są tu wyszarzone — kartka
 * nie wie, kiedy ktoś ją czyta.
 *
 * Uruchamiany automatycznie przez `npm run build` (skrypt `prebuild`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import PDFDocument from 'pdfkit';

import { ROK_SZKOLNY } from '../src/data/plan-zajec.mjs';
import {
  wydarzeniaPosortowane,
  tytulMiesiaca,
  plikPdfWydarzen,
  opisDaty,
  pokazGodzine,
} from '../src/data/wydarzenia.mjs';
import {
  KOLOR_WYDARZENIA,
  DOMYSLNY_KOLOR,
  IKONY_WLASNE,
  IKONY_Z_ZESTAWU,
  DOMYSLNA_IKONA,
} from '../src/data/ikony-wydarzen.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const KATALOG = path.join(ROOT, 'public/dokumenty');
const FONTY = path.join(ROOT, 'scripts/fonty');
const LOGO = path.join(ROOT, 'docs/apps-script/szablon/logo.png');

// Paleta z brandbooka — te same wartości co tokeny brand-* w tailwind.css.
const BRAND = {
  navy: '#2D346F',
  cream: '#FCF6F0',
  warm: '#FEFAF3',
  teal: '#34BBA8',
  coral: '#F2795D',
  yellow: '#F5C41F',
  forest: '#415D43',
};
const SZARY = '#8B8FA8';
const LINIA = '#E4E1EA';
const MM = 72 / 25.4;

// ─────────────────────────────────────────────────────────────────────────
// IKONY
// ─────────────────────────────────────────────────────────────────────────

const tabler = JSON.parse(
  fs.readFileSync(createRequire(import.meta.url).resolve('@iconify-json/tabler/icons.json'), 'utf8'),
);

/** Ikona z zestawu Tabler jako lista ścieżek SVG (koła zamienione na łuki). */
function ikonaZestawu(nazwa) {
  const body = tabler.icons[nazwa.replace(/^tabler:/, '')]?.body ?? '';
  const sciezki = [...body.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);

  for (const m of body.matchAll(/<circle\b([^>]*)>/g)) {
    const atrybut = (n) => Number(m[1].match(new RegExp(`\\b${n}="([\\d.]+)"`))?.[1]);
    const [cx, cy, r] = [atrybut('cx'), atrybut('cy'), atrybut('r')];
    sciezki.push(`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`);
  }

  // Niewidoczna ramka 24×24 z pliku źródłowego, obrysowana, dałaby kwadrat.
  return sciezki.filter((d) => !/^M0 0h24v24H0z$/i.test(d));
}

const ikonaWydarzenia = (nazwa) =>
  IKONY_WLASNE[nazwa] ?? ikonaZestawu(IKONY_Z_ZESTAWU[nazwa] ?? DOMYSLNA_IKONA);

/** Ikona z siatki 24 px w kwadracie o boku `bok` — ta sama kreska co na stronie. */
function rysujIkone(dok, sciezki, x, y, bok, kolor) {
  dok.save();
  dok.translate(x, y).scale(bok / 24);
  dok.lineWidth(2).lineCap('round').lineJoin('round').strokeColor(kolor);
  for (const d of sciezki) dok.path(d).stroke();
  dok.restore();
}

// ─────────────────────────────────────────────────────────────────────────
// UKŁAD
// ─────────────────────────────────────────────────────────────────────────

const wydarzenia = wydarzeniaPosortowane();
const tytul = tytulMiesiaca(wydarzenia);
const plik = plikPdfWydarzen(wydarzenia);

const dok = new PDFDocument({
  size: 'A4',
  margin: 0,
  info: { Title: tytul, Author: 'Kolorowe Przedszkole' },
});
dok.registerFont('Regular', path.join(FONTY, 'Nunito-Regular.ttf'));
dok.registerFont('Bold', path.join(FONTY, 'Nunito-Bold.ttf'));
dok.registerFont('Italic', path.join(FONTY, 'Nunito-Italic.ttf'));

const W = dok.page.width;
const H = dok.page.height;
const MARGINES = 18 * MM;
const OS_X = MARGINES + 7 * MM; // środek kropek na osi
const PROMIEN = 6.5 * MM;
const KARTA_X = OS_X + PROMIEN + 6 * MM;
const KARTA_W = W - MARGINES - KARTA_X;
const PAD = 5 * MM;
const KOL_DATY = 22 * MM;
const TRESC_X = KARTA_X + PAD + KOL_DATY + 5 * MM;
const TRESC_W = KARTA_X + KARTA_W - PAD - TRESC_X;
const ODSTEP = 5 * MM;
const DOL = H - 24 * MM; // niżej jest już stopka
const PLAKIETKA_H = 5.6 * MM;
const PLAKIETKA_PAD = 2.6 * MM;
const PLAKIETKA_IKONA = 3.4 * MM;
const PLAKIETKA_ODSTEP = 1.6 * MM;

/** Logo, tytuł i rok szkolny — jak w PDF-ach planu zajęć. Zwraca y pod nagłówkiem. */
function naglowek() {
  let y = 14 * MM;
  if (fs.existsSync(LOGO)) {
    const logo = dok.openImage(LOGO);
    const szer = 44 * MM;
    dok.image(logo, (W - szer) / 2, y, { width: szer });
    y += szer * (logo.height / logo.width) + 7 * MM;
  }
  dok.font('Bold').fontSize(17).fillColor(BRAND.navy)
    .text(tytul.toUpperCase(), MARGINES, y, { width: W - 2 * MARGINES, align: 'center' });
  dok.font('Bold').fontSize(11).fillColor(BRAND.teal)
    .text('rok szkolny ' + ROK_SZKOLNY, MARGINES, y + 8 * MM, { width: W - 2 * MARGINES, align: 'center' });
  return y + 20 * MM;
}

function stopka() {
  const y = H - 14 * MM;
  dok.font('Regular').fontSize(8).fillColor(SZARY)
    .text('Kontakt: 605 657 366 · przedszkole@kolorowe.eu', MARGINES, y, { lineBreak: false });
  dok.text('www.koloroweprzedszkole.com', W - MARGINES - 70 * MM, y, {
    width: 70 * MM,
    align: 'right',
    lineBreak: false,
  });
}

/** Plakietki wydarzenia z pozycjami; ta, która nie mieści się w rzędzie, schodzi niżej. */
function plakietki(w) {
  const lista = [];
  if (w.grupa) {
    lista.push({ ikona: 'tabler:users', tekst: `grupa ${w.grupa}`, kolor: BRAND.yellow, krycie: 0.3 });
  }
  if (w.wyjazd) {
    const tekst = `wyjazd ${pokazGodzine(w.wyjazd)}` + (w.powrot ? ` · powrót ${pokazGodzine(w.powrot)}` : '');
    lista.push({ ikona: 'tabler:bus', tekst, kolor: BRAND.teal, krycie: 0.16 });
  }
  if (w.koszt) {
    lista.push({ ikona: 'tabler:coin', tekst: `koszt ${w.koszt}`, kolor: BRAND.coral, krycie: 0.2 });
  }

  dok.font('Bold').fontSize(8);
  let x = 0;
  let rzad = 0;
  for (const p of lista) {
    p.szer = 2 * PLAKIETKA_PAD + PLAKIETKA_IKONA + 1.4 * MM + dok.widthOfString(p.tekst);
    if (x > 0 && x + p.szer > TRESC_W) {
      x = 0;
      rzad++;
    }
    p.dx = x;
    p.rzad = rzad;
    x += p.szer + 2 * MM;
  }
  return { lista, rzedy: lista.length ? rzad + 1 : 0 };
}

/** Wysokość karty liczona przed rysowaniem — potrzebna do tła i do łamania strony. */
function wysokosc(w) {
  let h = 15; // wiersz z godziną
  dok.font('Bold').fontSize(12.5);
  h += dok.heightOfString(w.tytul, { width: TRESC_W, lineGap: 1 });
  if (w.opis) {
    dok.font('Italic').fontSize(9);
    h += 2 + dok.heightOfString(w.opis, { width: TRESC_W });
  }
  const { rzedy } = plakietki(w);
  if (rzedy) h += 3 * MM + rzedy * PLAKIETKA_H + (rzedy - 1) * PLAKIETKA_ODSTEP;
  return Math.max(h, 46) + 2 * PAD;
}

function rysujKarte(w, y, h) {
  dok.lineWidth(0.6);
  dok.roundedRect(KARTA_X, y, KARTA_W, h, 4 * MM).fillAndStroke(BRAND.warm, LINIA);

  // Data w kolumnie po lewej: duży dzień, pod nim miesiąc i dzień tygodnia.
  const d = opisDaty(w.data);
  const kolX = KARTA_X + PAD;
  dok.font('Bold').fontSize(26).fillColor(BRAND.navy)
    .text(String(d.dzien), kolX, y + PAD - 3, { width: KOL_DATY, align: 'center', lineBreak: false });
  dok.font('Bold').fontSize(8.5).fillColor(BRAND.navy)
    .text(d.miesiac, kolX, y + PAD + 30, { width: KOL_DATY, align: 'center', lineBreak: false });
  dok.font('Regular').fontSize(8).fillColor(SZARY)
    .text(d.tydzien, kolX, y + PAD + 41, { width: KOL_DATY, align: 'center', lineBreak: false });

  const kreskaX = KARTA_X + PAD + KOL_DATY + 2.5 * MM;
  dok.lineWidth(0.5).strokeColor(LINIA).moveTo(kreskaX, y + PAD).lineTo(kreskaX, y + h - PAD).stroke();

  let ty = y + PAD;
  rysujIkone(dok, ikonaZestawu('tabler:clock'), TRESC_X, ty + 1.2, 9, SZARY);
  dok.font('Regular').fontSize(9).fillColor(SZARY)
    .text(`godz. ${pokazGodzine(w.godzina)}`, TRESC_X + 12, ty, { lineBreak: false });
  ty += 15;

  dok.font('Bold').fontSize(12.5).fillColor(BRAND.navy)
    .text(w.tytul, TRESC_X, ty, { width: TRESC_W, lineGap: 1 });
  ty = dok.y;
  if (w.opis) {
    dok.font('Italic').fontSize(9).fillColor(SZARY).text(w.opis, TRESC_X, ty + 2, { width: TRESC_W });
    ty = dok.y;
  }

  for (const p of plakietki(w).lista) {
    const px = TRESC_X + p.dx;
    const py = ty + 3 * MM + p.rzad * (PLAKIETKA_H + PLAKIETKA_ODSTEP);
    dok.save().fillColor(p.kolor).fillOpacity(p.krycie)
      .roundedRect(px, py, p.szer, PLAKIETKA_H, PLAKIETKA_H / 2).fill().restore();
    rysujIkone(
      dok, ikonaZestawu(p.ikona),
      px + PLAKIETKA_PAD, py + (PLAKIETKA_H - PLAKIETKA_IKONA) / 2, PLAKIETKA_IKONA, BRAND.navy,
    );
    dok.font('Bold').fontSize(8).fillColor(BRAND.navy)
      .text(p.tekst, px + PLAKIETKA_PAD + PLAKIETKA_IKONA + 1.4 * MM, py + (PLAKIETKA_H - 10.9) / 2, {
        lineBreak: false,
      });
  }
}

/**
 * Oś czasu: kropkowana fala od pierwszej do ostatniej kropki na stronie,
 * o tych samych proporcjach co na stronie www, a na niej kolorowe kropki.
 */
function rysujOs(kropki) {
  if (kropki.length > 1) {
    const y0 = kropki[0].y;
    const y1 = kropki[kropki.length - 1].y;
    const n = Math.max(1, Math.round((y1 - y0) / (14 * MM)));
    const L = (y1 - y0) / n;
    const wychylenie = 0.15 * L;

    dok.save().lineWidth(2.2).lineCap('round').strokeColor(BRAND.navy).strokeOpacity(0.28)
      .dash(0.5, { space: 6 });
    dok.moveTo(OS_X, y0);
    for (let i = 0; i < n; i++) {
      const s = i % 2 ? -wychylenie : wychylenie;
      const y = y0 + i * L;
      dok.bezierCurveTo(OS_X + s, y + 0.325 * L, OS_X + s, y + 0.675 * L, OS_X, y + L);
    }
    dok.stroke().undash().restore();
  }

  for (const { y, w } of kropki) {
    const kolor = BRAND[KOLOR_WYDARZENIA[w.ikona] ?? DOMYSLNY_KOLOR];
    // Biała obwódka odcina kropkowaną linię od kropki, jak kremowa ramka na stronie.
    dok.circle(OS_X, y, PROMIEN + 1.4 * MM).fill('#FFFFFF');
    dok.circle(OS_X, y, PROMIEN).fill(kolor);
    const bok = 7.4 * MM;
    const kolorIkony = kolor === BRAND.yellow ? BRAND.navy : BRAND.cream;
    rysujIkone(dok, ikonaWydarzenia(w.ikona), OS_X - bok / 2, y - bok / 2, bok, kolorIkony);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// URUCHOMIENIE
// ─────────────────────────────────────────────────────────────────────────

fs.mkdirSync(KATALOG, { recursive: true });

// PDF poprzedniego miesiąca znika — na stronie jest link tylko do bieżącego.
for (const stary of fs.readdirSync(KATALOG)) {
  if (/^wydarzenia-.+\.pdf$/.test(stary) && stary !== plik) fs.rmSync(path.join(KATALOG, stary));
}

const zapisany = new Promise((gotowe, blad) => {
  const strumien = fs.createWriteStream(path.join(KATALOG, plik));
  strumien.on('finish', gotowe).on('error', blad);
  dok.pipe(strumien);
});

let y = naglowek();
let kropki = [];
let strony = 1;

for (const w of wydarzenia) {
  const h = wysokosc(w);
  if (y + h > DOL && kropki.length) {
    rysujOs(kropki);
    stopka();
    dok.addPage();
    strony++;
    y = 18 * MM;
    kropki = [];
  }
  rysujKarte(w, y, h);
  kropki.push({ y: y + 9.5 * MM, w });
  y += h + ODSTEP;
}

rysujOs(kropki);
stopka();
dok.end();
await zapisany;

console.log(`[wydarzenia] ${plik}: ${wydarzenia.length} wydarzeń, stron: ${strony}`);

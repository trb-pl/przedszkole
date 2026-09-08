/**
 * Plan zajęć jako PDF — generowany przy każdym budowaniu strony.
 *
 * Czyta ten sam moduł co podstrona /plan-zajec, czyli w praktyce Arkusz
 * Google. Dzięki temu wydruk nie może pokazywać innych godzin niż strona:
 * dyrekcja poprawia arkusz, Vercel przebudowuje serwis i oba wychodzą
 * z jednego pobrania danych.
 *
 * Uruchamiany automatycznie przez `npm run build` (skrypt `prebuild`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import PDFDocument from 'pdfkit';

import { DNI, ROK_SZKOLNY, wczytajPlan } from '../src/data/plan-zajec.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const FONTY = path.join(ROOT, 'scripts/fonty');
const LOGO = path.join(ROOT, 'docs/apps-script/szablon/logo.png');
const WYNIK = path.join(ROOT, 'public/dokumenty/plan-zajec-2026-2027.pdf');

const GRANAT = '#2D346F';
const TURKUS = '#34BBA8';
const LINIA = '#D5D7E3';
const PASEK = '#F7F5F2';
const KAFEL = '#E4F5F1';
const SZARY = '#8B8FA8';
const PUSTE = '#CFD2E0';

const MM = 72 / 25.4;

function rysuj(dok, plan) {
  const szer = dok.page.width;
  const wys = dok.page.height;
  const margines = 15 * MM;

  const zPlanem = plan.filter((z) => Object.keys(z.terminy).length > 0);
  const bezTerminu = plan.filter((z) => Object.keys(z.terminy).length === 0);

  // ── Nagłówek ────────────────────────────────────────────────────────
  if (fs.existsSync(LOGO)) {
    dok.image(LOGO, margines, 12 * MM, { width: 38 * MM });
  }

  dok.font('Bold').fontSize(17).fillColor(GRANAT)
    .text('PLAN ZAJĘĆ', 0, 13 * MM, { width: szer, align: 'center' });

  dok.font('Bold').fontSize(11).fillColor(TURKUS)
    .text('rok szkolny ' + ROK_SZKOLNY, 0, 19.5 * MM, { width: szer, align: 'center' });

  // ── Wymiary tabeli ──────────────────────────────────────────────────
  const gora = 32 * MM;
  const kolNazwy = 62 * MM;
  const szerDnia = (szer - 2 * margines - kolNazwy) / DNI.length;
  const wysNaglowka = 10 * MM;
  const wysWiersza = 12 * MM;
  const dol = gora + wysNaglowka + wysWiersza * zPlanem.length;

  // Pasek nagłówka
  dok.rect(margines, gora, szer - 2 * margines, wysNaglowka).fill(PASEK);

  dok.font('Bold').fontSize(9.5).fillColor(GRANAT)
    .text('Zajęcia', margines + 4 * MM, gora + 3.4 * MM);

  DNI.forEach((dzien, i) => {
    const x = margines + kolNazwy + i * szerDnia;
    dok.font('Bold').fontSize(9.5).fillColor(GRANAT)
      .text(dzien.charAt(0).toUpperCase() + dzien.slice(1), x, gora + 3.4 * MM,
            { width: szerDnia, align: 'center' });
  });

  // ── Wiersze ─────────────────────────────────────────────────────────
  zPlanem.forEach((z, n) => {
    const y = gora + wysNaglowka + n * wysWiersza;

    if (n % 2) {
      dok.rect(margines, y, szer - 2 * margines, wysWiersza).fill(PASEK);
    }

    dok.font('Bold').fontSize(9).fillColor(GRANAT)
      .text(z.nazwa, margines + 4 * MM, y + (z.opis ? 3 : 4.4) * MM,
            { width: kolNazwy - 8 * MM, lineBreak: false });

    if (z.opis) {
      dok.font('Italic').fontSize(7.5).fillColor(SZARY)
        .text(z.opis, margines + 4 * MM, y + 6.6 * MM,
              { width: kolNazwy - 8 * MM, lineBreak: false });
    }

    DNI.forEach((dzien, i) => {
      const x = margines + kolNazwy + i * szerDnia;
      const godzina = z.terminy[dzien];

      if (!godzina) {
        dok.font('Regular').fontSize(9).fillColor(PUSTE)
          .text('—', x, y + 4.6 * MM, { width: szerDnia, align: 'center' });
        return;
      }

      // Godzina na kaflu — w druku czarno-białym zostaje delikatna ramka,
      // więc informacja nie znika.
      const szerKafla = Math.min(szerDnia - 6 * MM, 26 * MM);
      dok.roundedRect(x + (szerDnia - szerKafla) / 2, y + 2.8 * MM, szerKafla, 6.4 * MM, 1.6 * MM)
        .fillAndStroke(KAFEL, TURKUS);
      dok.lineWidth(0.4);

      dok.font('Bold').fontSize(8.5).fillColor(GRANAT)
        .text(godzina, x, y + 4.6 * MM, { width: szerDnia, align: 'center' });
    });
  });

  // ── Siatka ──────────────────────────────────────────────────────────
  dok.lineWidth(0.5).strokeColor(LINIA);
  for (let n = 0; n <= zPlanem.length; n++) {
    const y = gora + wysNaglowka + n * wysWiersza;
    dok.moveTo(margines, y).lineTo(szer - margines, y).stroke();
  }
  for (let i = 0; i <= DNI.length; i++) {
    const x = margines + kolNazwy + i * szerDnia;
    dok.moveTo(x, gora).lineTo(x, dol).stroke();
  }

  dok.lineWidth(0.8).strokeColor(GRANAT);
  dok.rect(margines, gora, szer - 2 * margines, dol - gora).stroke();
  dok.moveTo(margines, gora + wysNaglowka).lineTo(szer - margines, gora + wysNaglowka).stroke();

  // ── Zajęcia bez ustalonego terminu ──────────────────────────────────
  let y = dol + 6 * MM;
  if (bezTerminu.length) {
    dok.font('Bold').fontSize(8).fillColor(TURKUS)
      .text('TERMINY W USTALENIU', margines, y, { lineBreak: false });
    dok.font('Regular').fontSize(8.5).fillColor(GRANAT)
      .text(bezTerminu.map((z) => z.nazwa).join(' · '), margines + 42 * MM, y, { lineBreak: false });
    y += 6 * MM;
  }

  dok.font('Regular').fontSize(7.5).fillColor(SZARY)
    .text('Plan może się zmienić — o każdej zmianie informujemy rodziców.  '
          + 'Kontakt: 605 657 366 · przedszkole@kolorowe.eu', margines, y, { lineBreak: false });

  dok.font('Regular').fontSize(7.5).fillColor(SZARY)
    .text('www.koloroweprzedszkole.com', szer - margines - 60 * MM, y,
          { width: 60 * MM, align: 'right', lineBreak: false });
}

const { plan, zrodlo } = await wczytajPlan();

fs.mkdirSync(path.dirname(WYNIK), { recursive: true });

const dok = new PDFDocument({
  size: 'A4',
  layout: 'landscape',
  margin: 0,
  info: { Title: 'Plan zajęć ' + ROK_SZKOLNY, Author: 'Kolorowe Przedszkole' },
});

dok.registerFont('Regular', path.join(FONTY, 'Nunito-Regular.ttf'));
dok.registerFont('Bold', path.join(FONTY, 'Nunito-Bold.ttf'));
dok.registerFont('Italic', path.join(FONTY, 'Nunito-Italic.ttf'));

dok.pipe(fs.createWriteStream(WYNIK));
rysuj(dok, plan);
dok.end();

const zTerminem = plan.filter((z) => Object.keys(z.terminy).length > 0).length;
console.log(`[plan zajęć] PDF z danych: ${zrodlo} — ${zTerminem} zajęć z terminem, `
  + `${plan.length - zTerminem} bez`);

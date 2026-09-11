/**
 * Plan zajęć — pobranie arkusza i wszystkie pliki pochodne, raz na build.
 *
 *   1. src/data/plan-zajec.json        migawka danych, z której budują się strony
 *   2. public/dokumenty/plan-zajec-*.pdf   wydruk dla każdej grupy
 *   3. public/kalendarz/plan-*.ics         kalendarz do subskrypcji dla każdej grupy
 *
 * Jedno pobranie na build to warunek spójności: Google publikuje zmieniony
 * arkusz z opóźnieniem, więc dwa osobne pobrania w odstępie kilku sekund
 * potrafią zwrócić różne wersje — strona pokazałaby jedną godzinę, PDF drugą.
 *
 * Gdy arkusz jest niedostępny, zostaje ostatnia migawka zapisana w repo.
 * Awaria Google nie wywala budowania ani nie zostawia rodziców z pustą tabelą.
 *
 * Uruchamiany automatycznie przez `npm run build` (skrypt `prebuild`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import PDFDocument from 'pdfkit';

import { DNI, ROK_SZKOLNY, naSlug, pobierzGrupy, znajdzKolizje } from '../src/data/plan-zajec.mjs';
import { DNI_WOLNE, KONIEC_ROKU, POCZATEK_ROKU } from '../src/data/kalendarz-szkolny.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MIGAWKA = path.join(ROOT, 'src/data/plan-zajec.json');
const KATALOG_PDF = path.join(ROOT, 'public/dokumenty');
const KATALOG_ICS = path.join(ROOT, 'public/kalendarz');
const FONTY = path.join(ROOT, 'scripts/fonty');
const LOGO = path.join(ROOT, 'docs/apps-script/szablon/logo.png');
const DOMENA = 'koloroweprzedszkole.com';

// ─────────────────────────────────────────────────────────────────────────
// 1. DANE
// ─────────────────────────────────────────────────────────────────────────

/**
 * Vercel podaje zmienne w process.env, ale lokalny `npm run build` nie czyta
 * .env sam z siebie — bez tego lokalnie zawsze budowałaby się migawka.
 */
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
  const adres = process.env.PUBLIC_PLAN_CSV;

  try {
    if (!adres) throw new Error('brak zmiennej PUBLIC_PLAN_CSV');
    const grupy = await pobierzGrupy(adres);
    fs.writeFileSync(MIGAWKA, JSON.stringify({ rokSzkolny: ROK_SZKOLNY, grupy }, null, 2) + '\n');
    return { grupy, zrodlo: 'arkusz' };
  } catch (blad) {
    console.warn(`[plan zajęć] Nie pobrano arkusza (${blad.message}) — używam ostatniej migawki z repo.`);
    return { grupy: JSON.parse(fs.readFileSync(MIGAWKA, 'utf8')).grupy, zrodlo: 'migawka' };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 2. PDF
// ─────────────────────────────────────────────────────────────────────────

const GRANAT = '#2D346F';
const TURKUS = '#34BBA8';
const LINIA = '#D5D7E3';
const PASEK = '#F7F5F2';
const KAFEL = '#E4F5F1';
const SZARY = '#8B8FA8';
const PUSTE = '#CFD2E0';
const MM = 72 / 25.4;

function rysujPdf(dok, grupa) {
  const szer = dok.page.width;
  const margines = 15 * MM;

  const zPlanem = grupa.zajecia.filter((z) => Object.keys(z.terminy).length > 0);
  const bezTerminu = grupa.zajecia.filter((z) => Object.keys(z.terminy).length === 0);

  // ── Nagłówek ────────────────────────────────────────────────────────
  if (fs.existsSync(LOGO)) dok.image(LOGO, margines, 12 * MM, { width: 38 * MM });

  dok.font('Bold').fontSize(17).fillColor(GRANAT)
    .text('PLAN ZAJĘĆ · ' + grupa.nazwa.toUpperCase(), 0, 13 * MM, { width: szer, align: 'center' });
  dok.font('Bold').fontSize(11).fillColor(TURKUS)
    .text('rok szkolny ' + ROK_SZKOLNY, 0, 19.5 * MM, { width: szer, align: 'center' });

  // ── Tabela ──────────────────────────────────────────────────────────
  const gora = 32 * MM;
  const kolNazwy = 62 * MM;
  const szerDnia = (szer - 2 * margines - kolNazwy) / DNI.length;
  const wysNaglowka = 10 * MM;
  // Wiewiórki mają sześć zajęć, Gwiazdki kilkanaście — wiersz się ścieśnia,
  // żeby każda grupa zmieściła się na jednej kartce.
  const wysWiersza = Math.min(12 * MM, (140 * MM) / Math.max(zPlanem.length, 1));
  const dol = gora + wysNaglowka + wysWiersza * zPlanem.length;

  dok.rect(margines, gora, szer - 2 * margines, wysNaglowka).fill(PASEK);
  dok.font('Bold').fontSize(9.5).fillColor(GRANAT).text('Zajęcia', margines + 4 * MM, gora + 3.4 * MM);
  DNI.forEach((dzien, i) => {
    dok.font('Bold').fontSize(9.5).fillColor(GRANAT).text(
      dzien.charAt(0).toUpperCase() + dzien.slice(1),
      margines + kolNazwy + i * szerDnia, gora + 3.4 * MM, { width: szerDnia, align: 'center' },
    );
  });

  zPlanem.forEach((z, n) => {
    const y = gora + wysNaglowka + n * wysWiersza;
    const srodek = y + wysWiersza / 2;

    if (n % 2) dok.rect(margines, y, szer - 2 * margines, wysWiersza).fill(PASEK);

    dok.font('Bold').fontSize(9).fillColor(GRANAT).text(
      z.nazwa, margines + 4 * MM, srodek - (z.opis ? 4.4 : 1.6) * MM,
      { width: kolNazwy - 8 * MM, lineBreak: false },
    );
    if (z.opis) {
      dok.font('Italic').fontSize(7.5).fillColor(SZARY).text(
        z.opis, margines + 4 * MM, srodek + 0.4 * MM, { width: kolNazwy - 8 * MM, lineBreak: false },
      );
    }

    DNI.forEach((dzien, i) => {
      const x = margines + kolNazwy + i * szerDnia;
      const termin = z.terminy[dzien];

      if (!termin) {
        dok.font('Regular').fontSize(9).fillColor(PUSTE)
          .text('—', x, srodek - 1.6 * MM, { width: szerDnia, align: 'center' });
        return;
      }

      // Godzina na kaflu — w druku czarno-białym zostaje delikatna ramka,
      // więc informacja nie znika.
      const szerKafla = Math.min(szerDnia - 6 * MM, 26 * MM);
      dok.lineWidth(0.4);
      dok.roundedRect(x + (szerDnia - szerKafla) / 2, srodek - 3.2 * MM, szerKafla, 6.4 * MM, 1.6 * MM)
        .fillAndStroke(KAFEL, TURKUS);
      dok.font('Bold').fontSize(8.5).fillColor(GRANAT)
        .text(termin.tekst, x, srodek - 1.5 * MM, { width: szerDnia, align: 'center' });
    });
  });

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

  // ── Stopka ──────────────────────────────────────────────────────────
  let y = dol + 6 * MM;
  if (bezTerminu.length) {
    dok.font('Bold').fontSize(8).fillColor(TURKUS).text('TERMINY W USTALENIU', margines, y, { lineBreak: false });
    dok.font('Regular').fontSize(8.5).fillColor(GRANAT)
      .text(bezTerminu.map((z) => z.nazwa).join(' · '), margines + 42 * MM, y, { lineBreak: false });
    y += 6 * MM;
  }
  dok.font('Regular').fontSize(7.5).fillColor(SZARY).text(
    'Plan może się zmienić — o każdej zmianie informujemy rodziców.  Kontakt: 605 657 366 · przedszkole@kolorowe.eu',
    margines, y, { lineBreak: false },
  );
  dok.text('www.' + DOMENA, szer - margines - 60 * MM, y, { width: 60 * MM, align: 'right', lineBreak: false });
}

function zapiszPdf(grupa) {
  return new Promise((gotowe, blad) => {
    const plik = path.join(KATALOG_PDF, `plan-zajec-${grupa.slug}.pdf`);
    const dok = new PDFDocument({
      size: 'A4', layout: 'landscape', margin: 0,
      info: { Title: `Plan zajęć ${grupa.nazwa} ${ROK_SZKOLNY}`, Author: 'Kolorowe Przedszkole' },
    });
    dok.registerFont('Regular', path.join(FONTY, 'Nunito-Regular.ttf'));
    dok.registerFont('Bold', path.join(FONTY, 'Nunito-Bold.ttf'));
    dok.registerFont('Italic', path.join(FONTY, 'Nunito-Italic.ttf'));

    const strumien = fs.createWriteStream(plik);
    strumien.on('finish', gotowe).on('error', blad);
    dok.pipe(strumien);
    rysujPdf(dok, grupa);
    dok.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────
// 3. KALENDARZ (.ics)
// ─────────────────────────────────────────────────────────────────────────

/** Znaki specjalne w wartościach tekstowych iCalendar (RFC 5545, 3.3.11). */
const icsTekst = (t) => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/**
 * Linie dłuższe niż 75 bajtów trzeba łamać (RFC 5545, 3.1). Liczymy bajty,
 * nie znaki — „ż" to dwa bajty, a kalendarz Google odrzuca plik z linią
 * łamaną w środku znaku.
 */
function zawin(linia) {
  const czesci = [];
  let biezaca = '';
  let bajty = 0;
  for (const znak of linia) {
    const dl = Buffer.byteLength(znak);
    if (bajty + dl > (czesci.length ? 74 : 75)) {
      czesci.push(biezaca);
      biezaca = '';
      bajty = 0;
    }
    biezaca += znak;
    bajty += dl;
  }
  czesci.push(biezaca);
  return czesci.join('\r\n ');
}

// Strefa czasowa w pliku — bez niej kalendarze traktują godziny jako UTC
// i po zmianie czasu w październiku zajęcia przesuwają się o godzinę.
const STREFA = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/Warsaw',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST',
  'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET',
  'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

const bezKresek = (data) => data.replace(/-/g, '');
const bezDwukropka = (godzina) => godzina.replace(':', '') + '00';

/** Pierwszy dzień tygodnia `indeks` (0 = poniedziałek) od początku roku szkolnego. */
function pierwszyTakiDzien(indeks) {
  const d = new Date(POCZATEK_ROKU + 'T00:00:00Z');
  const cel = indeks + 1; // w JS 1 = poniedziałek
  while (d.getUTCDay() !== cel) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function dniWolneWTenDzien(indeks) {
  const cel = indeks + 1;
  return [...DNI_WOLNE]
    .filter((iso) => iso >= POCZATEK_ROKU && iso <= KONIEC_ROKU)
    .filter((iso) => new Date(iso + 'T00:00:00Z').getUTCDay() === cel)
    .sort();
}

function kalendarz(grupa, znacznikCzasu) {
  const linie = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Kolorowe Przedszkole//Plan zajec//PL',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsTekst(`Plan zajęć — ${grupa.nazwa}`)}`,
    `X-WR-CALDESC:${icsTekst(`Kolorowe Przedszkole, grupa ${grupa.nazwa}, rok szkolny ${ROK_SZKOLNY}`)}`,
    'X-WR-TIMEZONE:Europe/Warsaw',
    // Subskrybowany kalendarz pyta o zmiany co 12 godzin — po edycji
    // arkusza plan w telefonie rodzica aktualizuje się sam.
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H', 'X-PUBLISHED-TTL:PT12H',
    ...STREFA,
  ];

  // Koniec roku 23:59:59 czasu warszawskiego (latem UTC+2) zapisany w UTC.
  const koniec = bezKresek(KONIEC_ROKU) + 'T215959Z';
  let wydarzen = 0;
  const uzyteUid = new Set();

  for (const z of grupa.zajecia) {
    DNI.forEach((dzien, i) => {
      const termin = z.terminy[dzien];
      if (!termin?.od) return; // brak godziny albo wpis nie do odczytania

      const start = bezKresek(pierwszyTakiDzien(i));
      const wyjatki = dniWolneWTenDzien(i).map((iso) => bezKresek(iso) + 'T' + bezDwukropka(termin.od));

      // Stały identyfikator z nazwy i dnia, a nie z numeru wiersza: po
      // zmianie godziny kalendarz podmienia wydarzenie zamiast dopisywać
      // drugie obok. Licznik tylko dla zdublowanej nazwy w tej samej grupie.
      const bazaUid = `${grupa.slug}-${naSlug(z.nazwa)}-${i + 1}`;
      let uid = bazaUid;
      for (let n = 2; uzyteUid.has(uid); n++) uid = `${bazaUid}-${n}`;
      uzyteUid.add(uid);

      linie.push(
        'BEGIN:VEVENT',
        `UID:${uid}@${DOMENA}`,
        `DTSTAMP:${znacznikCzasu}`,
        `DTSTART;TZID=Europe/Warsaw:${start}T${bezDwukropka(termin.od)}`,
        `DTEND;TZID=Europe/Warsaw:${start}T${bezDwukropka(termin.do)}`,
        `RRULE:FREQ=WEEKLY;UNTIL=${koniec}`,
        ...(wyjatki.length ? [`EXDATE;TZID=Europe/Warsaw:${wyjatki.join(',')}`] : []),
        `SUMMARY:${icsTekst(z.nazwa)}`,
        `DESCRIPTION:${icsTekst(`Grupa ${grupa.nazwa} · Kolorowe Przedszkole${z.opis ? '\n' + z.opis : ''}`)}`,
        'END:VEVENT',
      );
      wydarzen++;
    });
  }

  linie.push('END:VCALENDAR');
  return { tresc: linie.map(zawin).join('\r\n') + '\r\n', wydarzen };
}

// ─────────────────────────────────────────────────────────────────────────
// URUCHOMIENIE
// ─────────────────────────────────────────────────────────────────────────

const { grupy, zrodlo } = await wczytajDane();

for (const kolizja of znajdzKolizje(grupy)) {
  console.warn('[plan zajęć] ⚠ Kolizja godzin — ' + kolizja);
}

for (const grupa of grupy) {
  for (const z of grupa.zajecia) {
    for (const [dzien, termin] of Object.entries(z.terminy)) {
      if (!termin.od) console.warn(`[plan zajęć] ⚠ ${grupa.nazwa}, ${z.nazwa}, ${dzien}: `
        + `nie rozumiem godziny „${termin.tekst}" — pokazuję dosłownie, pomijam w kalendarzu`);
    }
  }
}

fs.mkdirSync(KATALOG_PDF, { recursive: true });
fs.mkdirSync(KATALOG_ICS, { recursive: true });

// Pliki grup, których już nie ma w arkuszu, znikają — inaczej przemianowana
// grupa zostawiłaby w sieci stary PDF i stary kalendarz.
const aktualne = new Set(grupy.map((g) => g.slug));
for (const [katalog, wzor] of [[KATALOG_PDF, /^plan-zajec-(.+)\.pdf$/], [KATALOG_ICS, /^plan-(.+)\.ics$/]]) {
  for (const plik of fs.readdirSync(katalog)) {
    const m = plik.match(wzor);
    if (m && !aktualne.has(m[1])) fs.rmSync(path.join(katalog, plik));
  }
}

const znacznikCzasu = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

for (const grupa of grupy) {
  await zapiszPdf(grupa);
  const { tresc, wydarzen } = kalendarz(grupa, znacznikCzasu);
  fs.writeFileSync(path.join(KATALOG_ICS, `plan-${grupa.slug}.ics`), tresc);
  console.log(`[plan zajęć] ${grupa.nazwa}: ${grupa.zajecia.length} zajęć, ${wydarzen} wydarzeń w kalendarzu`);
}

console.log(`[plan zajęć] źródło danych: ${zrodlo}`);

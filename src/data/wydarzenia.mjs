/**
 * Wydarzenia miesiąca — koncerty, spektakle, wyjazdy.
 *
 * Na razie lista jest wpisana tutaj. Docelowo przyjdzie z Arkusza Google,
 * dlatego każde pole odpowiada jednej przyszłej kolumnie arkusza i każde
 * jest zwykłym tekstem, tak jak komórka. Podpięcie arkusza podmieni tylko
 * źródło listy — strona i kalendarze zostaną bez zmian.
 *
 *   data     2026-09-23        dzień wydarzenia
 *   do       2026-12-31        ostatni dzień — tylko przy kilkudniowych
 *   godzina  11.00             początek (kropka albo dwukropek); puste = w ciągu dnia
 *   tytul    …                 nazwa wydarzenia
 *   opis     …                 dopisek pod nazwą — opcjonalnie
 *   grupa    Gwiazdki          puste = wszystkie grupy
 *   wyjazd   10.15             tylko przy wyjazdach
 *   powrot   ok. 13.00         tylko przy wyjazdach
 *   koszt    100 zł            opcjonalnie
 *   ikona    rodzaj z src/data/ikony-wydarzen.mjs (teatr, muzyka, muzeum, wigilia…)
 */
import { naSlug } from './plan-zajec.mjs';

export const WYDARZENIA = [
  {
    data: '2026-11-05',
    godzina: '11.15',
    tytul: 'Muzeum Niepodległości',
    opis: 'Lekcja „Polska i ja” na wystawie stałej „Z orłem przez wieki”.',
    wyjazd: '10.30',
    ikona: 'muzeum',
  },
  {
    data: '2026-11-10',
    godzina: '11.11',
    tytul: 'Wspólne śpiewanie hymnu',
    opis: 'Uroczystość z okazji Dnia Niepodległości.',
    ikona: 'flaga',
  },
  {
    data: '2026-11-13',
    godzina: '11.00',
    tytul: 'Koncert „Chopin i przyjaciele”',
    opis: 'Pałac Staszica, Sala Lustrzana, ul. Nowy Świat 72.',
    wyjazd: '10.30',
    ikona: 'muzyka',
  },
  {
    data: '2026-11-16',
    godzina: '13.30',
    tytul: 'Spektakl „W krainie wróżek”',
    opis: 'Teatr Kalejdoskop, w przedszkolu.',
    ikona: 'teatr',
  },
  {
    data: '2026-11-19',
    godzina: '12.30',
    tytul: 'Koncert „Pluszowa symfonia”',
    opis: 'Razem z pluszowymi misiami poznamy tajemnice ciepłego i miękkiego brzmienia wiolonczeli.',
    ikona: 'muzyka',
  },
  {
    data: '2026-11-20',
    tytul: 'Międzynarodowy Dzień Praw Dziecka',
    opis: 'W ramach zajęć: rozmowy o prawach dziecka, zabawy i plakaty grupowe.',
    ikona: 'prawa',
  },
  {
    data: '2026-11-23',
    godzina: '17.15',
    tytul: 'Zebranie z rodzicami',
    opis: 'w przedszkolu przy ul. Lotaryńskiej',
    ikona: 'spotkanie',
  },
  {
    data: '2026-11-25',
    tytul: 'Dzień Pluszowego Misia',
    opis: 'Dzieci przynoszą misie, zabawy i konkursy.',
    ikona: 'mis',
  },
  {
    data: '2026-11-25',
    godzina: '17.15',
    tytul: 'Zebranie z rodzicami',
    opis: 'w przedszkolu przy ul. Zakopiańskiej',
    ikona: 'spotkanie',
  },
  {
    data: '2026-11-30',
    tytul: 'Andrzejki',
    opis: 'Tradycyjne zabawy andrzejkowe w wersji przedszkolnej.',
    ikona: 'andrzejki',
  },
];

/**
 * Następny miesiąc — jeszcze nie na stronie, tylko do PDF-u, który
 * przedszkole rozsyła z wyprzedzeniem:
 *   node scripts/wydarzenia-pdf.mjs --nastepny <katalog>
 * Gdy miesiąc się zmieni, ta lista przechodzi do WYDARZENIA.
 */
export const WYDARZENIA_NASTEPNE = [
  {
    data: '2026-12-03',
    godzina: '11.30',
    tytul: 'Muzeum Narodowe: „Pory roku, pory dnia”',
    ikona: 'muzeum',
  },
  {
    data: '2026-12-04',
    godzina: '11.30',
    tytul: 'Koncert „Czekoladowe nutki pod choinką” (fagot)',
    ikona: 'muzyka',
  },
  {
    data: '2026-12-07',
    godzina: '14.00',
    tytul: 'Spektakl „Zima w Cynamonowej Dolinie” i Mikołaj',
    ikona: 'prezent',
  },
  {
    data: '2026-12-17',
    godzina: '14.00',
    tytul: 'Wigilia grupy „Wiewiórki”',
    opis: 'w przedszkolu przy ul. Zakopiańskiej',
    ikona: 'wigilia',
  },
  {
    data: '2026-12-18',
    godzina: '14.30',
    tytul: 'Wigilia grupy „Liski”',
    ikona: 'wigilia',
  },
  {
    data: '2026-12-18',
    godzina: '15.00–16.00',
    tytul: 'Warsztaty świąteczne grupy „Liski”',
    ikona: 'warsztaty',
  },
  {
    data: '2026-12-18',
    godzina: '15.30',
    tytul: 'Wigilia grupy „Gwiazdki”',
    ikona: 'wigilia',
  },
  {
    data: '2026-12-18',
    godzina: '16.00',
    tytul: 'Życzenia, wspólne dzielenie się opłatkiem, poczęstunek',
    ikona: 'wigilia',
  },
  {
    data: '2026-12-23',
    do: '2026-12-31',
    tytul: 'Przerwa świąteczna',
    ikona: 'przerwa',
  },
];

const MIESIACE = [
  'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
  'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień',
];

/** Godzina wyłowiona z tekstu („ok. 13.00", „10:15") jako minuty od północy. */
function minuty(tekst) {
  const m = String(tekst ?? '').match(/(\d{1,2})[.:](\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** „10:15" → „10.15", „ok. 13:00" → „ok. 13.00" — jeden zapis godzin na stronie. */
export function pokazGodzine(tekst) {
  return String(tekst ?? '').replace(/(\d{1,2})[.:](\d{2})/, (_, h, m) => `${Number(h)}.${m}`);
}

/**
 * Wiersz z czasem na karcie: „godz. 11.15", „do 31 grudnia" przy
 * wydarzeniu kilkudniowym albo „w ciągu dnia", gdy godziny nie podano.
 */
export function opisCzasu(w) {
  if (w.do) {
    const d = opisDaty(w.do);
    return `do ${d.dzien} ${d.miesiac}`;
  }
  return w.godzina ? `godz. ${pokazGodzine(w.godzina)}` : 'w ciągu dnia';
}

export function wydarzeniaPosortowane(lista = WYDARZENIA) {
  const klucz = (w) => `${w.data} ${String(minuty(w.godzina) ?? 0).padStart(4, '0')}`;
  return [...lista].sort((a, b) => klucz(a).localeCompare(klucz(b)));
}

/** Nazwa miesiąca do nagłówka — z pierwszego wydarzenia na liście. */
export function miesiacWydarzen(lista) {
  return MIESIACE[Number(lista[0].data.slice(5, 7)) - 1];
}

/** „Wrzesień w Kolorowym Przedszkolu" — nagłówek strony i PDF-u. */
export function tytulMiesiaca(lista) {
  const miesiac = miesiacWydarzen(lista);
  return `${miesiac.charAt(0).toUpperCase() + miesiac.slice(1)} w Kolorowym Przedszkolu`;
}

/** Nazwa PDF-u z miesiącem i rokiem — plik w Pobranych od razu mówi, czego dotyczy. */
export function plikPdfWydarzen(lista) {
  return `wydarzenia-${naSlug(miesiacWydarzen(lista))}-${lista[0].data.slice(0, 4)}.pdf`;
}

/** Części daty do karty: 10 · września · czwartek. */
export function opisDaty(iso) {
  // Południe UTC, żeby żadna strefa czasowa nie przesunęła daty o dzień.
  const d = new Date(iso + 'T12:00:00Z');
  return {
    dzien: d.getUTCDate(),
    miesiac: d
      .toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', timeZone: 'UTC' })
      .replace(/^\d+\s*/, ''),
    tydzien: d.toLocaleDateString('pl-PL', { weekday: 'long', timeZone: 'UTC' }),
  };
}

/** Stały identyfikator: z daty i tytułu, więc przeżyje przestawienie wierszy w arkuszu. */
export function idWydarzenia(w) {
  const pelny = `${w.data}-${naSlug(w.tytul)}`;
  // Długi tytuł skracamy na granicy słowa, żeby adres pliku nie kończył się na „…ocz".
  return pelny.length <= 60 ? pelny : pelny.slice(0, 61).replace(/-[^-]*$/, '');
}

// ─────────────────────────────────────────────────────────────────────────
// KALENDARZ
// ─────────────────────────────────────────────────────────────────────────

/** Rodzic przegląda tydzień w telefonie — przedrostek mówi od razu, skąd jest wpis. */
export const tytulKalendarza = (w) => `Przedszkole: ${w.tytul}`;

/** Bez podanej godziny końca wydarzenie zajmuje w kalendarzu godzinę. */
const DOMYSLNY_CZAS_MIN = 60;

/**
 * Początek i koniec wpisu. Przy wyjeździe liczy się to, kiedy dziecko
 * wyjeżdża i wraca, a nie godzina samej lekcji — więc wpis trwa od wyjazdu
 * do powrotu.
 */
function termin(w) {
  // Bez godziny (albo kilkudniowe) — wpis na cały dzień, od daty do dnia po
  // ostatnim; tak kalendarze zapisują koniec wydarzeń całodniowych.
  if (w.do || (!w.godzina && !w.wyjazd)) {
    const nastepny = new Date((w.do || w.data) + 'T12:00:00Z');
    nastepny.setUTCDate(nastepny.getUTCDate() + 1);
    return {
      caly: true,
      start: w.data.replace(/-/g, ''),
      koniec: nastepny.toISOString().slice(0, 10).replace(/-/g, ''),
    };
  }
  const start = minuty(w.wyjazd) ?? minuty(w.godzina) ?? 9 * 60;
  const powrot = minuty(w.powrot);
  const koniec = powrot && powrot > start ? powrot : start + DOMYSLNY_CZAS_MIN;
  const zapis = (min) =>
    String(Math.floor(min / 60)).padStart(2, '0') + String(min % 60).padStart(2, '0') + '00';
  const dzien = w.data.replace(/-/g, '');
  return { start: `${dzien}T${zapis(start)}`, koniec: `${dzien}T${zapis(koniec)}` };
}

function opisKalendarza(w) {
  return [
    w.opis,
    w.wyjazd && `Wyjazd z przedszkola ${pokazGodzine(w.wyjazd)}`
      + (w.powrot ? `, powrót ${pokazGodzine(w.powrot)}` : '') + '.',
    w.grupa && `Grupa ${w.grupa}.`,
    w.koszt && `Koszt: ${w.koszt}.`,
    'Kolorowe Przedszkole · 605 657 366',
  ].filter(Boolean).join('\n');
}

/**
 * Kalendarz Google przyjmuje wydarzenie wprost z linku — bez pliku
 * i bez pytania o import. `ctz` sprawia, że godziny liczą się po polsku.
 */
export function linkGoogle(w) {
  const { start, koniec } = termin(w);
  const parametry = new URLSearchParams({
    action: 'TEMPLATE',
    text: tytulKalendarza(w),
    dates: `${start}/${koniec}`,
    ctz: 'Europe/Warsaw',
    details: opisKalendarza(w),
  });
  // URLSearchParams zapisuje spację jako „+"; %20 jest odczytywane pewniej.
  return `https://calendar.google.com/calendar/render?${parametry.toString().replace(/\+/g, '%20')}`;
}

/** Znaki specjalne w wartościach tekstowych iCalendar (RFC 5545, 3.3.11). */
const icsTekst = (t) =>
  String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Łamanie linii co 75 bajtów, nie znaków — „ż" to dwa bajty (RFC 5545, 3.1). */
function zawin(linia) {
  const czesci = [];
  let biezaca = '';
  let bajty = 0;
  for (const znak of linia) {
    const dl = new TextEncoder().encode(znak).length;
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

/** Plik .ics jednego wydarzenia — dla iPhone'a, Maca i Outlooka. */
export function icsWydarzenia(w) {
  const { start, koniec, caly } = termin(w);
  const znacznikCzasu = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Kolorowe Przedszkole//Wydarzenia//PL',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    // Strefa w pliku — bez niej część kalendarzy czyta godziny jako UTC.
    'BEGIN:VTIMEZONE', 'TZID:Europe/Warsaw',
    'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST',
    'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
    'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET',
    'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:wydarzenie-${idWydarzenia(w)}@koloroweprzedszkole.com`,
    `DTSTAMP:${znacznikCzasu}`,
    ...(caly
      ? [`DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${koniec}`]
      : [`DTSTART;TZID=Europe/Warsaw:${start}`, `DTEND;TZID=Europe/Warsaw:${koniec}`]),
    `SUMMARY:${icsTekst(tytulKalendarza(w))}`,
    `DESCRIPTION:${icsTekst(opisKalendarza(w))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].map(zawin).join('\r\n') + '\r\n';
}

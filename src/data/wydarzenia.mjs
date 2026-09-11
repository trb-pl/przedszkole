/**
 * Wydarzenia miesiąca — koncerty, spektakle, wyjazdy.
 *
 * Na razie lista jest wpisana tutaj. Docelowo przyjdzie z Arkusza Google,
 * dlatego każde pole odpowiada jednej przyszłej kolumnie arkusza i każde
 * jest zwykłym tekstem, tak jak komórka. Podpięcie arkusza podmieni tylko
 * źródło listy — strona i kalendarze zostaną bez zmian.
 *
 *   data     2026-09-23        dzień wydarzenia
 *   godzina  11.00             początek (kropka albo dwukropek)
 *   tytul    …                 nazwa wydarzenia
 *   opis     …                 dopisek pod nazwą — opcjonalnie
 *   grupa    Gwiazdki          puste = wszystkie grupy
 *   wyjazd   10.15             tylko przy wyjazdach
 *   powrot   ok. 13.00         tylko przy wyjazdach
 *   koszt    100 zł            opcjonalnie
 *   ikona    trabka | teatr | guzik | lisc | dynia
 */
import { naSlug } from './plan-zajec.mjs';

export const WYDARZENIA = [
  {
    data: '2026-09-10',
    godzina: '11.40',
    tytul: 'Koncert muzyczny z udziałem instrumentu trąbka',
    ikona: 'trabka',
  },
  {
    data: '2026-09-16',
    godzina: '11.00',
    tytul: 'Spektakl teatralny pt. „Strach ma tylko wielkie oczy”',
    opis: 'w wykonaniu aktorów teatru „Kwatera”',
    ikona: 'teatr',
  },
  {
    data: '2026-09-23',
    godzina: '11.00',
    tytul: 'Wyjazd do Parku Wilanowskiego na lekcję pt. „Guzikozwierzaki”',
    grupa: 'Gwiazdki',
    wyjazd: '10.15',
    powrot: 'ok. 13.00',
    ikona: 'guzik',
  },
  {
    data: '2026-09-24',
    godzina: '11.00',
    tytul: 'Powitanie jesieni – spacer nad Wisłę',
    ikona: 'lisc',
  },
  {
    data: '2026-09-28',
    godzina: '11.30',
    tytul: 'Wyjazd na farmę dyń „Magic Pumpkin Farm” Powsin',
    koszt: '100 zł',
    ikona: 'dynia',
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

export function wydarzeniaPosortowane(lista = WYDARZENIA) {
  const klucz = (w) => `${w.data} ${String(minuty(w.godzina) ?? 0).padStart(4, '0')}`;
  return [...lista].sort((a, b) => klucz(a).localeCompare(klucz(b)));
}

/** Nazwa miesiąca do nagłówka — z pierwszego wydarzenia na liście. */
export function miesiacWydarzen(lista) {
  return MIESIACE[Number(lista[0].data.slice(5, 7)) - 1];
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
  const { start, koniec } = termin(w);
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
    `DTSTART;TZID=Europe/Warsaw:${start}`,
    `DTEND;TZID=Europe/Warsaw:${koniec}`,
    `SUMMARY:${icsTekst(tytulKalendarza(w))}`,
    `DESCRIPTION:${icsTekst(opisKalendarza(w))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].map(zawin).join('\r\n') + '\r\n';
}

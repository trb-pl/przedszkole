/**
 * Kolorowe Przedszkole — miesięczny raport strony
 * ===============================================
 *
 * Ten plik wkleja się do Apps Script w OSOBNYM arkuszu Google
 * („Raport strony — Kolorowe Przedszkole"), nie do arkusza z umowami.
 * Instrukcja krok po kroku: docs/apps-script/raport/INSTRUKCJA.md
 *
 * Co miesiąc (3. dnia rano — Search Console potrzebuje dwóch–trzech dni na
 * domknięcie danych) zbiera wyniki strony koloroweprzedszkole.com za
 * poprzedni miesiąc, porównuje je z miesiącem wcześniej i zapisuje
 * w nowej zakładce. Zakładka „Podsumowanie" zbiera po jednym wierszu na
 * miesiąc, więc widać trend.
 *
 * Źródła:
 *  - Google Analytics 4 — odwiedziny, źródła ruchu, strony, urządzenia, miasta
 *  - Google Search Console — kliknięcia i wyświetlenia w Google, zapytania
 *  - arkusz z formularzami — zapisy na listę rekrutacyjną (opcjonalnie)
 *
 * Skrypt tylko czyta dane — niczego nie zmienia w Analytics, Search
 * Console ani w arkuszu z formularzami.
 */

// ─────────────────────────────────────────────────────────────────────────
// KONFIGURACJA
// ─────────────────────────────────────────────────────────────────────────

const RAPORT = {
  // Google Analytics → Administracja → Ustawienia usługi → „Identyfikator
  // usługi" (same cyfry, np. 412345678). To NIE jest „G-…".
  GA4_PROPERTY_ID: 'WKLEJ_ID_USLUGI_GA4',

  // Usługa w Search Console: domena ('sc-domain:…') albo prefiks adresu
  // ('https://…/'). Strona ma zweryfikowane oba sposoby — domena obejmuje więcej.
  SEARCH_CONSOLE: 'sc-domain:koloroweprzedszkole.com',

  // Arkusz z formularzami ze strony (ten z zakładką „Dane do umów").
  // ID jest w adresie: docs.google.com/spreadsheets/d/ TO_JEST_ID /edit
  // Puste = raport bez zapisów na listę rekrutacyjną.
  ID_ARKUSZA_FORMULARZY: '',
  ZAKLADKA_LISTY: 'Lista — rekrutacja 2027/2028',

  // Adresy, na które przychodzi krótkie podsumowanie (po przecinku).
  // Puste = bez maila, raport tylko w arkuszu.
  EMAIL: '',
};

const STREFA = 'Europe/Warsaw';
const MIESIACE = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
  'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
const KANALY = {
  'Organic Search': 'Wyszukiwarki (bezpłatnie)',
  'Direct': 'Wejścia bezpośrednie',
  'Referral': 'Odnośniki z innych stron',
  'Organic Social': 'Media społecznościowe',
  'Paid Search': 'Reklamy w wyszukiwarce',
  'Paid Social': 'Reklamy w mediach społecznościowych',
  'Email': 'E-mail',
  'Organic Maps': 'Mapy Google',
  'Unassigned': 'Nieprzypisane',
};
const URZADZENIA = { mobile: 'Telefon', desktop: 'Komputer', tablet: 'Tablet' };

// Kolory jak na stronie i w dokumentach przedszkola.
const KOLOR = { GRANAT: '#2D346F', TURKUS: '#34BBA8', KORAL: '#F2795D', KREM: '#FCF6F0', SZARY: '#6B6F8C' };

// ─────────────────────────────────────────────────────────────────────────
// MENU
// ─────────────────────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📊 Raport strony')
    .addItem('Raport za poprzedni miesiąc', 'raportPoprzedniMiesiac')
    .addItem('Raport za bieżący miesiąc (do wczoraj)', 'raportBiezacyMiesiac')
    .addSeparator()
    .addItem('Włącz automatyczny raport co miesiąc', 'wlaczAutomat')
    .addItem('Wyłącz automatyczny raport', 'wylaczAutomat')
    .addSeparator()
    .addItem('Sprawdź połączenia', 'sprawdzPolaczenia')
    .addToUi();
}

function raportPoprzedniMiesiac() {
  const z = zakresPoprzedniegoMiesiaca(new Date());
  const wynik = zbudujRaport(z);
  SpreadsheetApp.getUi().alert('Gotowe: zakładka „' + wynik.zakladka + '".' + uwagiDoAlertu(wynik));
}

function raportBiezacyMiesiac() {
  const dzis = new Date();
  if (dzis.getDate() === 1) {
    SpreadsheetApp.getUi().alert('Dziś pierwszy dzień miesiąca — nie ma jeszcze danych. Użyj raportu za poprzedni miesiąc.');
    return;
  }
  const od = new Date(dzis.getFullYear(), dzis.getMonth(), 1);
  const doD = new Date(dzis.getFullYear(), dzis.getMonth(), dzis.getDate() - 1);
  // Porównanie z tym samym odcinkiem poprzedniego miesiąca (1.–n.).
  const dni = doD.getDate();
  const odP = new Date(dzis.getFullYear(), dzis.getMonth() - 1, 1);
  const ostatniP = new Date(dzis.getFullYear(), dzis.getMonth(), 0).getDate();
  const doP = new Date(dzis.getFullYear(), dzis.getMonth() - 1, Math.min(dni, ostatniP));
  const wynik = zbudujRaport({
    od: od, doD: doD, odP: odP, doP: doP,
    nazwa: MIESIACE[od.getMonth()] + ' ' + od.getFullYear() + ' (do ' + dni + '.)',
    klucz: fmt(od, 'yyyy-MM') + ' (w trakcie)',
    wPodsumowaniu: false,
  });
  SpreadsheetApp.getUi().alert('Gotowe: zakładka „' + wynik.zakladka + '".' + uwagiDoAlertu(wynik));
}

/** Uruchamiany przez wyzwalacz 3. dnia miesiąca. */
function raportAutomatyczny() {
  const wynik = zbudujRaport(zakresPoprzedniegoMiesiaca(new Date()));
  wyslijPodsumowanie(wynik);
}

function wlaczAutomat() {
  wylaczAutomat(true);
  ScriptApp.newTrigger('raportAutomatyczny').timeBased().onMonthDay(3).atHour(7).inTimezone(STREFA).create();
  SpreadsheetApp.getUi().alert(
    'Włączone: raport za poprzedni miesiąc powstanie sam 3. dnia każdego miesiąca, ok. 7:00.' +
    (RAPORT.EMAIL ? '\nPodsumowanie przyjdzie na: ' + RAPORT.EMAIL : '\nMail nie jest ustawiony (RAPORT.EMAIL) — raport będzie tylko w arkuszu.')
  );
}

function wylaczAutomat(cicho) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'raportAutomatyczny') ScriptApp.deleteTrigger(t);
  });
  if (cicho !== true) SpreadsheetApp.getUi().alert('Automatyczny raport wyłączony.');
}

// ─────────────────────────────────────────────────────────────────────────
// RAPORT
// ─────────────────────────────────────────────────────────────────────────

function zakresPoprzedniegoMiesiaca(dzis) {
  const od = new Date(dzis.getFullYear(), dzis.getMonth() - 1, 1);
  const doD = new Date(dzis.getFullYear(), dzis.getMonth(), 0);
  return {
    od: od, doD: doD,
    odP: new Date(dzis.getFullYear(), dzis.getMonth() - 2, 1),
    doP: new Date(dzis.getFullYear(), dzis.getMonth() - 1, 0),
    nazwa: MIESIACE[od.getMonth()] + ' ' + od.getFullYear(),
    klucz: fmt(od, 'yyyy-MM'),
    wPodsumowaniu: true,
  };
}

/**
 * Zbiera dane i zapisuje zakładkę. Każde źródło osobno: awaria jednego
 * (np. brak dostępu do Search Console) nie zatrzymuje reszty — raport
 * powstaje, a w miejscu brakujących danych stoi wyjaśnienie.
 */
function zbudujRaport(z) {
  const od = fmt(z.od, 'yyyy-MM-dd');
  const doD = fmt(z.doD, 'yyyy-MM-dd');
  const odP = fmt(z.odP, 'yyyy-MM-dd');
  const doP = fmt(z.doP, 'yyyy-MM-dd');
  const uwagi = [];

  // ── Google Analytics ──
  let ga = null;
  try {
    const METRYKI = ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'engagementRate'];
    const teraz = ga4(od, doD, [], METRYKI)[0];
    const przed = ga4(odP, doP, [], METRYKI)[0];
    const zero = { metryki: METRYKI.map(function () { return 0; }) };
    ga = {
      teraz: (teraz || zero).metryki,
      przed: (przed || zero).metryki,
      kanaly: ga4(od, doD, ['sessionDefaultChannelGroup'], ['sessions'], { sortuj: 'sessions', limit: 10 }),
      strony: ga4(od, doD, ['pagePath'], ['screenPageViews', 'activeUsers'], { sortuj: 'screenPageViews', limit: 12 }),
      urzadzenia: ga4(od, doD, ['deviceCategory'], ['activeUsers'], { sortuj: 'activeUsers', limit: 5 }),
      miasta: ga4(od, doD, ['city'], ['activeUsers'], { sortuj: 'activeUsers', limit: 6 }),
    };
  } catch (e) {
    uwagi.push('Google Analytics: ' + e.message);
  }

  // ── Search Console ──
  let sc = null;
  try {
    const suma = function (o, d) {
      const w = gsc(o, d, [], 1)[0];
      return w ? [w.clicks, w.impressions, w.ctr, w.position] : [0, 0, 0, 0];
    };
    sc = {
      teraz: suma(od, doD),
      przed: suma(odP, doP),
      zapytania: gsc(od, doD, ['query'], 15),
      strony: gsc(od, doD, ['page'], 8),
    };
  } catch (e) {
    uwagi.push('Search Console: ' + e.message + wskazowkaSearchConsole(e.message));
  }

  // ── Lista rekrutacyjna ──
  let lista = null;
  if (String(RAPORT.ID_ARKUSZA_FORMULARZY).trim()) {
    try {
      lista = zapisyNaListe(z.od, z.doD, z.odP, z.doP);
    } catch (e) {
      uwagi.push('Lista rekrutacyjna: ' + e.message);
    }
  }

  const zakladka = zapiszZakladke(z, ga, sc, lista, uwagi);
  if (z.wPodsumowaniu) zapiszPodsumowanie(z, ga, sc, lista);
  return { zakladka: zakladka, z: z, ga: ga, sc: sc, lista: lista, uwagi: uwagi };
}

// ─────────────────────────────────────────────────────────────────────────
// ŹRÓDŁA DANYCH
// ─────────────────────────────────────────────────────────────────────────

/** GA4 Data API (usługa zaawansowana AnalyticsData — włączona w appsscript.json). */
function ga4(od, doD, wymiary, metryki, opcje) {
  const id = String(RAPORT.GA4_PROPERTY_ID).replace(/\D/g, '');
  if (!id) throw new Error('wpisz identyfikator usługi GA4 w RAPORT.GA4_PROPERTY_ID');

  const zapytanie = {
    dateRanges: [{ startDate: od, endDate: doD }],
    dimensions: wymiary.map(function (n) { return { name: n }; }),
    metrics: metryki.map(function (n) { return { name: n }; }),
  };
  if (opcje && opcje.sortuj) zapytanie.orderBys = [{ metric: { metricName: opcje.sortuj }, desc: true }];
  if (opcje && opcje.limit) zapytanie.limit = opcje.limit;

  const odp = AnalyticsData.Properties.runReport(zapytanie, 'properties/' + id);
  return (odp.rows || []).map(function (w) {
    return {
      wymiary: (w.dimensionValues || []).map(function (v) { return v.value; }),
      metryki: (w.metricValues || []).map(function (v) { return Number(v.value); }),
    };
  });
}

/** Search Console API — bez usługi zaawansowanej, przez UrlFetchApp. */
function gsc(od, doD, wymiary, limit) {
  const url = 'https://www.googleapis.com/webmasters/v3/sites/' +
    encodeURIComponent(RAPORT.SEARCH_CONSOLE) + '/searchAnalytics/query';
  const odp = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ startDate: od, endDate: doD, dimensions: wymiary, rowLimit: limit }),
    muteHttpExceptions: true,
  });
  let dane = {};
  try { dane = JSON.parse(odp.getContentText() || '{}'); } catch (e) { /* zostaje pusty */ }
  if (odp.getResponseCode() !== 200) {
    throw new Error((dane.error && dane.error.message) || ('HTTP ' + odp.getResponseCode()));
  }
  return dane.rows || [];
}

function wskazowkaSearchConsole(komunikat) {
  if (/has not been used|is disabled|SERVICE_DISABLED|accessNotConfigured/i.test(komunikat)) {
    return ' → Skrypt potrzebuje własnego projektu Google Cloud z włączonym „Google Search Console API" ' +
      '(opis w INSTRUKCJA.md, krok „Jeśli Search Console nie działa").';
  }
  if (/permission|sufficient|403/i.test(komunikat)) {
    return ' → Konto, na którym działa skrypt, nie ma dostępu do tej usługi w Search Console — ' +
      'albo w RAPORT.SEARCH_CONSOLE jest inny adres niż w Search Console.';
  }
  return '';
}

/** Liczba zapisów na listę w obu okresach i łącznie — z arkusza z formularzami. */
function zapisyNaListe(od, doD, odP, doP) {
  const plik = SpreadsheetApp.openById(String(RAPORT.ID_ARKUSZA_FORMULARZY).trim());
  const arkusz = plik.getSheetByName(RAPORT.ZAKLADKA_LISTY);
  if (!arkusz || arkusz.getLastRow() < 2) return { teraz: 0, przed: 0, razem: 0 };

  const koniec = function (d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); };
  const daty = arkusz.getRange(2, 1, arkusz.getLastRow() - 1, 1).getValues()
    .map(function (w) { return w[0]; })
    .filter(function (d) { return d instanceof Date; });
  const ile = function (a, b) {
    return daty.filter(function (d) { return d >= a && d < koniec(b); }).length;
  };
  return { teraz: ile(od, doD), przed: ile(odP, doP), razem: daty.length };
}

// ─────────────────────────────────────────────────────────────────────────
// ZAPIS DO ARKUSZA
// ─────────────────────────────────────────────────────────────────────────

function zapiszZakladke(z, ga, sc, lista, uwagi) {
  const plik = SpreadsheetApp.getActiveSpreadsheet();
  const nazwa = z.klucz;
  let ark = plik.getSheetByName(nazwa);
  if (ark) ark.clear(); else ark = plik.insertSheet(nazwa, 1);
  ark.setHiddenGridlines(true);

  let r = 1;
  const wpisz = function (wiersze, styl) {
    if (!wiersze.length) return;
    const szer = Math.max.apply(null, wiersze.map(function (w) { return w.length; }));
    const pelne = wiersze.map(function (w) { while (w.length < szer) w.push(''); return w; });
    const zakres = ark.getRange(r, 1, pelne.length, szer);
    zakres.setValues(pelne).setFontFamily('Nunito').setFontColor(KOLOR.GRANAT).setVerticalAlignment('middle');
    if (styl) styl(zakres, r, pelne.length, szer);
    r += pelne.length;
  };
  const sekcja = function (tytul) {
    r++;
    wpisz([[tytul.toUpperCase()]], function (zk) { zk.setFontWeight('bold').setFontColor(KOLOR.TURKUS).setFontSize(9); });
  };
  const tabela = function (naglowki, wiersze, formaty) {
    wpisz([naglowki], function (zk) { zk.setFontWeight('bold').setBackground(KOLOR.KREM); });
    if (!wiersze.length) {
      wpisz([['Brak danych w tym okresie.']], function (zk) { zk.setFontColor(KOLOR.SZARY).setFontStyle('italic'); });
      return;
    }
    const start = r;
    wpisz(wiersze);
    (formaty || []).forEach(function (f, k) {
      if (f) ark.getRange(start, k + 1, wiersze.length, 1).setNumberFormat(f);
    });
  };

  // Nagłówek
  wpisz([['Raport strony koloroweprzedszkole.com — ' + z.nazwa]], function (zk) { zk.setFontSize(16).setFontWeight('bold'); });
  wpisz([[
    fmt(z.od, 'd.MM.yyyy') + ' – ' + fmt(z.doD, 'd.MM.yyyy') + ', porównanie z ' +
    fmt(z.odP, 'd.MM') + ' – ' + fmt(z.doP, 'd.MM.yyyy') + '. Wygenerowano ' + fmt(new Date(), 'd.MM.yyyy, HH:mm') + '.',
  ]], function (zk) { zk.setFontColor(KOLOR.SZARY).setFontSize(9); });

  if (uwagi.length) {
    r++;
    wpisz(uwagi.map(function (u) { return ['⚠️ ' + u]; }), function (zk) { zk.setFontColor(KOLOR.KORAL).setWrap(false); });
  }

  // Najważniejsze liczby
  sekcja('Najważniejsze liczby');
  const kpi = [];
  if (ga) {
    kpi.push(['Odwiedzający (użytkownicy)', ga.teraz[0], ga.przed[0], zmiana(ga.teraz[0], ga.przed[0])]);
    kpi.push(['W tym nowi', ga.teraz[1], ga.przed[1], zmiana(ga.teraz[1], ga.przed[1])]);
    kpi.push(['Wizyty (sesje)', ga.teraz[2], ga.przed[2], zmiana(ga.teraz[2], ga.przed[2])]);
    kpi.push(['Wyświetlenia stron', ga.teraz[3], ga.przed[3], zmiana(ga.teraz[3], ga.przed[3])]);
  }
  if (sc) {
    kpi.push(['Kliknięcia z wyników Google', sc.teraz[0], sc.przed[0], zmiana(sc.teraz[0], sc.przed[0])]);
    kpi.push(['Wyświetlenia w wynikach Google', sc.teraz[1], sc.przed[1], zmiana(sc.teraz[1], sc.przed[1])]);
  }
  if (lista) kpi.push(['Zapisy na listę rekrutacyjną', lista.teraz, lista.przed, zmiana(lista.teraz, lista.przed)]);
  tabela(['', z.nazwa, 'Miesiąc wcześniej', 'Zmiana'], kpi, [null, '#,##0', '#,##0', '+0%;-0%;0%']);
  if (ga || sc) {
    const doda = [];
    if (ga) doda.push(['Zaangażowane wizyty', ga.teraz[4], ga.przed[4], '']);
    if (sc) {
      doda.push(['Średnia pozycja w Google', sc.teraz[3], sc.przed[3], '']);
      doda.push(['Klikalność w Google (CTR)', sc.teraz[2], sc.przed[2], '']);
    }
    const start = r;
    wpisz(doda);
    doda.forEach(function (w, i) {
      const f = w[0] === 'Średnia pozycja w Google' ? '0.0' : '0.0%';
      ark.getRange(start + i, 2, 1, 2).setNumberFormat(f);
    });
  }
  if (lista) {
    wpisz([['Na liście rekrutacyjnej łącznie: ' + lista.razem + ' zapisów.']], function (zk) { zk.setFontColor(KOLOR.SZARY).setFontSize(9); });
  }

  // Szczegóły z Analytics
  if (ga) {
    sekcja('Skąd przychodzą odwiedzający');
    const sumaKanalow = ga.kanaly.reduce(function (s, w) { return s + w.metryki[0]; }, 0) || 1;
    tabela(['Źródło', 'Wizyty', 'Udział'], ga.kanaly.map(function (w) {
      return [KANALY[w.wymiary[0]] || w.wymiary[0], w.metryki[0], w.metryki[0] / sumaKanalow];
    }), [null, '#,##0', '0%']);

    sekcja('Najczęściej oglądane strony');
    tabela(['Strona', 'Wyświetlenia', 'Odwiedzający'], ga.strony.map(function (w) {
      return [w.wymiary[0], w.metryki[0], w.metryki[1]];
    }), [null, '#,##0', '#,##0']);

    sekcja('Urządzenia');
    tabela(['Urządzenie', 'Odwiedzający'], ga.urzadzenia.map(function (w) {
      return [URZADZENIA[w.wymiary[0]] || w.wymiary[0], w.metryki[0]];
    }), [null, '#,##0']);

    sekcja('Miasta');
    tabela(['Miasto', 'Odwiedzający'], ga.miasta.map(function (w) {
      return [w.wymiary[0] === '(not set)' ? 'nieznane' : w.wymiary[0], w.metryki[0]];
    }), [null, '#,##0']);
  }

  // Szczegóły z Search Console
  if (sc) {
    sekcja('Czego szukano w Google, zanim trafiono na stronę');
    tabela(['Zapytanie', 'Kliknięcia', 'Wyświetlenia', 'Średnia pozycja'], sc.zapytania.map(function (w) {
      return [w.keys[0], w.clicks, w.impressions, w.position];
    }), [null, '#,##0', '#,##0', '0.0']);

    sekcja('Strony najczęściej klikane w Google');
    tabela(['Strona', 'Kliknięcia', 'Wyświetlenia', 'Średnia pozycja'], sc.strony.map(function (w) {
      return [w.keys[0].replace(/^https?:\/\/[^/]+/, '') || '/', w.clicks, w.impressions, w.position];
    }), [null, '#,##0', '#,##0', '0.0']);
  }

  ark.setColumnWidth(1, 360);
  ark.setColumnWidths(2, 3, 130);
  ark.getRange(1, 2, r, 3).setHorizontalAlignment('right');
  ark.getRange(1, 1, 2, 1).setHorizontalAlignment('left');
  plik.setActiveSheet(ark);
  return nazwa;
}

/** Jeden wiersz na miesiąc — nadpisywany, gdy raport za ten miesiąc powstaje ponownie. */
function zapiszPodsumowanie(z, ga, sc, lista) {
  const plik = SpreadsheetApp.getActiveSpreadsheet();
  const NAGLOWKI = ['Miesiąc', 'Odwiedzający', 'Wizyty', 'Wyświetlenia stron',
    'Kliknięcia z Google', 'Wyświetlenia w Google', 'Średnia pozycja', 'Zapisy na listę'];
  let ark = plik.getSheetByName('Podsumowanie');
  if (!ark) {
    ark = plik.insertSheet('Podsumowanie', 0);
    ark.getRange(1, 1, 1, NAGLOWKI.length).setValues([NAGLOWKI])
      .setFontWeight('bold').setBackground(KOLOR.KREM).setFontFamily('Nunito').setFontColor(KOLOR.GRANAT);
    ark.setFrozenRows(1);
    ark.setColumnWidth(1, 110);
  }
  const wiersz = [
    z.klucz,
    ga ? ga.teraz[0] : '', ga ? ga.teraz[2] : '', ga ? ga.teraz[3] : '',
    sc ? sc.teraz[0] : '', sc ? sc.teraz[1] : '', sc ? sc.teraz[3] : '',
    lista ? lista.teraz : '',
  ];
  const klucze = ark.getLastRow() > 1
    ? ark.getRange(2, 1, ark.getLastRow() - 1, 1).getDisplayValues().map(function (w) { return w[0]; })
    : [];
  const i = klucze.indexOf(z.klucz);
  const nr = i >= 0 ? i + 2 : ark.getLastRow() + 1;
  // Miesiąc jako tekst — inaczej arkusz zamieni „2026-09" na datę.
  ark.getRange(nr, 1).setNumberFormat('@');
  ark.getRange(nr, 1, 1, wiersz.length).setValues([wiersz]).setFontFamily('Nunito').setFontColor(KOLOR.GRANAT);
  ark.getRange(nr, 2, 1, 5).setNumberFormat('#,##0');
  ark.getRange(nr, 7).setNumberFormat('0.0');
  if (ark.getLastRow() > 2) ark.getRange(2, 1, ark.getLastRow() - 1, NAGLOWKI.length).sort(1);
}

function wyslijPodsumowanie(wynik) {
  const do_ = String(RAPORT.EMAIL).trim();
  if (!do_) return;
  const linia = function (nazwa, a, b) {
    const zm = zmiana(a, b);
    return '<tr><td style="padding:4px 12px 4px 0">' + nazwa + '</td><td style="padding:4px 12px;text-align:right"><b>' +
      Math.round(a).toLocaleString('pl-PL') + '</b></td><td style="padding:4px 0;color:#6B6F8C;text-align:right">' +
      (zm === '' ? '' : (zm >= 0 ? '+' : '') + Math.round(zm * 100) + '%') + '</td></tr>';
  };
  const ga = wynik.ga, sc = wynik.sc, lista = wynik.lista;
  let html = '<div style="font-family:Arial,sans-serif;color:#2D346F;font-size:14px">' +
    '<p>Raport strony koloroweprzedszkole.com — <b>' + wynik.z.nazwa + '</b> (zmiana względem miesiąca wcześniej):</p><table>';
  if (ga) {
    html += linia('Odwiedzający', ga.teraz[0], ga.przed[0]) + linia('Wizyty', ga.teraz[2], ga.przed[2]) +
      linia('Wyświetlenia stron', ga.teraz[3], ga.przed[3]);
  }
  if (sc) html += linia('Kliknięcia z Google', sc.teraz[0], sc.przed[0]);
  if (lista) html += linia('Zapisy na listę rekrutacyjną', lista.teraz, lista.przed);
  html += '</table>';
  if (wynik.uwagi.length) html += '<p style="color:#F2795D">' + wynik.uwagi.join('<br>') + '</p>';
  html += '<p><a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '">Pełny raport w arkuszu</a></p></div>';
  MailApp.sendEmail({ to: do_, subject: 'Raport strony — ' + wynik.z.nazwa, htmlBody: html });
}

// ─────────────────────────────────────────────────────────────────────────
// DIAGNOSTYKA I POMOCNIKI
// ─────────────────────────────────────────────────────────────────────────

/** Z menu: sprawdza każde źródło osobno i mówi po ludzku, czego brakuje. */
function sprawdzPolaczenia() {
  const wczoraj = fmt(new Date(Date.now() - 864e5), 'yyyy-MM-dd');
  const tydzien = fmt(new Date(Date.now() - 8 * 864e5), 'yyyy-MM-dd');
  const wyniki = [];

  try {
    const w = ga4(tydzien, wczoraj, [], ['activeUsers'])[0];
    wyniki.push('✅ Google Analytics — ostatnie 7 dni: ' + (w ? w.metryki[0] : 0) + ' odwiedzających.');
  } catch (e) {
    wyniki.push('❌ Google Analytics — ' + e.message);
  }

  try {
    const w = gsc(tydzien, wczoraj, [], 1)[0];
    wyniki.push('✅ Search Console — ostatnie 7 dni: ' + (w ? w.clicks : 0) + ' kliknięć z Google.');
  } catch (e) {
    wyniki.push('❌ Search Console — ' + e.message + wskazowkaSearchConsole(e.message));
  }

  if (String(RAPORT.ID_ARKUSZA_FORMULARZY).trim()) {
    try {
      const l = zapisyNaListe(new Date(2000, 0, 1), new Date(), new Date(2000, 0, 1), new Date(2000, 0, 1));
      wyniki.push('✅ Lista rekrutacyjna — zapisów łącznie: ' + l.razem + '.');
    } catch (e) {
      wyniki.push('❌ Lista rekrutacyjna — ' + e.message);
    }
  } else {
    wyniki.push('➖ Lista rekrutacyjna — pominięta (puste RAPORT.ID_ARKUSZA_FORMULARZY).');
  }

  wyniki.push(RAPORT.EMAIL ? '✉️ Podsumowanie mailem na: ' + RAPORT.EMAIL : '➖ Mail z podsumowaniem — wyłączony (puste RAPORT.EMAIL).');
  const automat = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'raportAutomatyczny'; });
  wyniki.push(automat ? '⏰ Automatyczny raport: włączony (3. dnia miesiąca).' : '⏰ Automatyczny raport: wyłączony.');

  const raport = wyniki.join('\n\n');
  console.log(raport);
  try { SpreadsheetApp.getUi().alert(raport); } catch (e) { /* uruchomione z edytora */ }
}

function uwagiDoAlertu(wynik) {
  return wynik.uwagi.length ? '\n\nUwaga — część danych niedostępna:\n• ' + wynik.uwagi.join('\n• ') : '';
}

/** Zmiana względem poprzedniego okresu jako ułamek (0.25 = +25%), '' gdy nie ma z czym porównać. */
function zmiana(teraz, przed) {
  if (!przed) return '';
  return (teraz - przed) / przed;
}

function fmt(d, wzor) {
  return Utilities.formatDate(d, STREFA, wzor);
}

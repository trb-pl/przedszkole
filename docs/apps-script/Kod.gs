/**
 * Kolorowe Przedszkole — backend formularza danych do umowy 2026/2027
 * ====================================================================
 *
 * Ten plik wkleja się do Google Apps Script (script.google.com), powiązanego
 * z arkuszem, w którym zbierane są dane. Instrukcja wdrożenia krok po kroku:
 * docs/apps-script/INSTRUKCJA.md
 *
 * Co robi:
 *  1. doPost()        — odbiera dane z formularza na stronie, sprawdza kod
 *                       dostępu, dopisuje wiersz do arkusza, wysyła kopię
 *                       rodzicowi i powiadomienie do przedszkola.
 *  2. generujUmowy()  — z menu arkusza: dla zaznaczonych wierszy tworzy
 *                       na Dysku teczkę dziecka z kompletem dokumentów
 *                       (Google Doc + PDF), gotowych do wydruku.
 *
 * Dane osobowe (PESEL, adresy) nie opuszczają Google Workspace.
 */

// ─────────────────────────────────────────────────────────────────────────
// KONFIGURACJA — jedyna sekcja, którą trzeba uzupełnić
// ─────────────────────────────────────────────────────────────────────────

const CONFIG = {
  // Kod dostępu, który przekazujesz rodzicom. Zmień na własny.
  KOD_DOSTEPU: 'KOLOROWE2027',

  // ID folderu z szablonami (Dokumenty Google z polami {{...}}).
  // Jeden folder zamiast sześciu osobnych ID — skrypt znajduje w nim
  // dokumenty po nazwie, więc dołożenie kolejnego załącznika nie wymaga
  // przeklejania niczego do konfiguracji.
  // Znajdziesz je w adresie folderu: drive.google.com/drive/folders/ TO_JEST_ID
  ID_FOLDERU_SZABLONOW: 'WKLEJ_ID_FOLDERU_SZABLONOW',

  // ID folderu, w którym mają powstawać teczki dzieci.
  ID_FOLDERU_UMOW: 'WKLEJ_ID_FOLDERU',

  // Adres, na który przychodzą powiadomienia o nowym zgłoszeniu.
  EMAIL_PRZEDSZKOLA: 'przedszkole@kolorowe.eu',

  // Dane do umowy — zmieniane raz na rok.
  ROK_SZKOLNY: '2026/2027',
  DATA_UMOWY: '31.08.2026 r.',
  CZESNE_PODSTAWOWE: 2350,
  CZESNE_RODZENSTWO: 2150,
  OPLATA_ROCZNA_PODSTAWOWA: 28200,
  OPLATA_ROCZNA_RODZENSTWO: 25800,
};

// Komplet dokumentów w teczce dziecka. Nazwa po lewej to dokładna nazwa
// Dokumentu Google w folderze szablonów, po prawej — nazwa pliku w teczce.
// Numeracja z przodu ustawia je w kolejności do wpięcia w segregator.
const SZABLONY = [
  { szablon: 'SZABLON - Umowa',                 wynik: '1. Umowa' },
  { szablon: 'SZABLON - Zalacznik 1',           wynik: '2. Zalacznik 1 - postepowanie przy zachorowaniu' },
  { szablon: 'SZABLON - Zalacznik 2',           wynik: '3. Zalacznik 2 - zgoda na wizerunek' },
  { szablon: 'SZABLON - Zalacznik 3',           wynik: '4. Zalacznik 3 - piesze wyjscia' },
  { szablon: 'SZABLON - Zalacznik 4',           wynik: '5. Zalacznik 4 - zajecia dodatkowe' },
  { szablon: 'SZABLON - Informacje o dziecku',  wynik: '6. Informacje o dziecku - ankieta' },
];

// Kolejność kolumn w arkuszu. Nie zmieniaj bez zmiany funkcji poniżej.
const NAGLOWKI = [
  'Data zgłoszenia',
  'Nr umowy',
  'Stawka',
  'Umowa wygenerowana',
  'Dziecko — imiona',
  'Dziecko — nazwisko',
  'Data urodzenia',
  'PESEL',
  'Adres zamieszkania',
  'Dzielnica zamieszkania',
  'Adres zameldowania',
  'Dzielnica zameldowania',
  'Rodzic 1 — imię i nazwisko',
  'Rodzic 1 — adres',
  'Rodzic 1 — telefon',
  'Rodzic 1 — e-mail',
  'Rodzic 2 — imię i nazwisko',
  'Rodzic 2 — adres',
  'Rodzic 2 — telefon',
  'Rodzic 2 — e-mail',
  'E-mail do rachunków',
  'Upoważniona 1',
  'Upoważniona 2',
  'Upoważniona 3',
  'Upoważniona 4',
  'Wizerunek — aplikacja dla rodziców',
  'Wizerunek — strona www',
  'Wizerunek — Facebook',
  'Wizerunek — Instagram',
  'Wizerunek — materiały drukowane',
];

// ─────────────────────────────────────────────────────────────────────────
// 1. ODBIÓR DANYCH Z FORMULARZA
// ─────────────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    // Uruchomiona ręcznie przyciskiem „Uruchom" nie dostaje żadnych danych.
    // To normalne — doPost obsługuje wysyłkę z formularza. Do sprawdzenia
    // konfiguracji służy testKonfiguracji().
    if (!e || !e.postData) {
      throw new Error(
        'Ta funkcja odbiera dane z formularza i nie działa po kliknięciu „Uruchom". ' +
        'Aby sprawdzić ustawienia, uruchom funkcję testKonfiguracji().'
      );
    }

    const dane = JSON.parse(e.postData.contents);

    // Kod dostępu sprawdzamy po stronie serwera — brama na stronie tylko
    // odsłania formularz, nie chroni danych. Porównanie bez rozróżniania
    // wielkości liter i z obciętymi spacjami: rodzic przepisujący kod
    // ręcznie nie powinien wpaść przez capsa albo spację z kopiowania.
    const otrzymany = String(dane.kod_dostepu || '').trim();
    const oczekiwany = String(CONFIG.KOD_DOSTEPU || '').trim();

    if (otrzymany.toLowerCase() !== oczekiwany.toLowerCase()) {
      // Do dziennika wykonań (widocznego tylko dla właściciela skryptu) —
      // bez tego 'nieprawidłowy kod' jest nie do zdiagnozowania.
      console.warn(
        'Odrzucono zgłoszenie — kod się nie zgadza.\n' +
        'Otrzymano: "' + otrzymany + '" (znaków: ' + otrzymany.length + ')\n' +
        'Oczekiwano: "' + oczekiwany + '" (znaków: ' + oczekiwany.length + ')'
      );
      return odpowiedz({ status: 'bad-code' });
    }

    const arkusz = arkuszDanych();
    const nrUmowy = nastepnyNumerUmowy(arkusz);

    const adresZam = zlozAdres(dane.dziecko_ulica, dane.dziecko_kod, dane.dziecko_miasto);
    const adresZamel = zlozAdres(dane.zamel_ulica, dane.zamel_kod, dane.zamel_miasto);

    // Wartości opisane nazwą kolumny, nie pozycją. Dzięki temu zapis trafia
    // tam, gdzie wskazuje nagłówek arkusza — nawet jeśli arkusz powstał przy
    // innej wersji skryptu i ma dodatkowe albo przestawione kolumny.
    const wartosci = {
      'Data zgłoszenia': new Date(),
      'Nr umowy': nrUmowy,
      'Stawka': CONFIG.CZESNE_PODSTAWOWE, // Olga zmienia ręcznie dla rodzeństwa
      'Umowa wygenerowana': '',
      'Dziecko — imiona': dane.dziecko_imiona || '',
      'Dziecko — nazwisko': dane.dziecko_nazwisko || '',
      'Data urodzenia': dane.dziecko_data_ur || '',
      'PESEL': jakoTekst(dane.dziecko_pesel),
      'Adres zamieszkania': adresZam,
      'Dzielnica zamieszkania': dane.dziecko_dzielnica || '',
      'Adres zameldowania': adresZamel,
      'Dzielnica zameldowania': dane.zamel_dzielnica || dane.dziecko_dzielnica || '',
      'Rodzic 1 — imię i nazwisko': dane.r1_imie || '',
      'Rodzic 1 — adres': dane.r1_adres || '',
      'Rodzic 1 — telefon': jakoTekst(dane.r1_telefon),
      'Rodzic 1 — e-mail': dane.r1_email || '',
      'Rodzic 2 — imię i nazwisko': dane.r2_imie || '',
      'Rodzic 2 — adres': dane.r2_adres || '',
      'Rodzic 2 — telefon': jakoTekst(dane.r2_telefon),
      'Rodzic 2 — e-mail': dane.r2_email || '',
      'E-mail do rachunków': dane.email_rachunki || '',
      'Upoważniona 1': zlozUpowaznienie(dane.upow1_imie, dane.upow1_dokument),
      'Upoważniona 2': zlozUpowaznienie(dane.upow2_imie, dane.upow2_dokument),
      'Upoważniona 3': zlozUpowaznienie(dane.upow3_imie, dane.upow3_dokument),
      'Upoważniona 4': zlozUpowaznienie(dane.upow4_imie, dane.upow4_dokument),
      'Wizerunek — aplikacja dla rodziców': dane.wiz_aplikacja || 'NIE',
      'Wizerunek — strona www': dane.wiz_www || 'NIE',
      'Wizerunek — Facebook': dane.wiz_facebook || 'NIE',
      'Wizerunek — Instagram': dane.wiz_instagram || 'NIE',
      'Wizerunek — materiały drukowane': dane.wiz_druk || 'NIE',
    };

    const naglowkiArkusza = arkusz.getRange(1, 1, 1, arkusz.getLastColumn()).getValues()[0]
      .map(function (n) { return String(n).trim(); });

    arkusz.appendRow(naglowkiArkusza.map(function (naglowek) {
      return wartosci[naglowek] !== undefined ? wartosci[naglowek] : '';
    }));

    wyslijKopieRodzicowi(dane, nrUmowy);
    wyslijPowiadomienieDoPrzedszkola(dane, nrUmowy);

    return odpowiedz({ status: 'ok', nr: nrUmowy });
  } catch (err) {
    console.error(err);
    return odpowiedz({ status: 'error', message: String(err) });
  }
}

function odpowiedz(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function arkuszDanych() {
  const plik = SpreadsheetApp.getActiveSpreadsheet();
  let arkusz = plik.getSheetByName('Dane do umów');
  if (!arkusz) {
    arkusz = plik.insertSheet('Dane do umów');
    arkusz.appendRow(NAGLOWKI);
    arkusz.getRange(1, 1, 1, NAGLOWKI.length).setFontWeight('bold');
    arkusz.setFrozenRows(1);
  }
  ustawFormatTekstowy(arkusz);
  return arkusz;
}

/**
 * Druga warstwa ochrony przed #ERROR! w telefonach i PESEL-ach. Apostrof
 * przy zapisie wystarcza, ale gdyby ktoś wpisał numer ręcznie, wymuszony
 * format tekstowy sprawi, że „+48 …" nadal nie zostanie potraktowane jak
 * formuła. Wywoływane przy każdym dostępie do arkusza — jest tanie.
 */
function ustawFormatTekstowy(arkusz) {
  const kolumnyTekstowe = ['PESEL', 'Rodzic 1 — telefon', 'Rodzic 2 — telefon'];
  const naglowki = arkusz.getRange(1, 1, 1, arkusz.getLastColumn()).getValues()[0]
    .map(function (n) { return String(n).trim(); });

  kolumnyTekstowe.forEach(function (nazwa) {
    const i = naglowki.indexOf(nazwa);
    if (i < 0) return;
    const wierszy = Math.max(arkusz.getMaxRows() - 1, 1);
    arkusz.getRange(2, i + 1, wierszy, 1).setNumberFormat('@');
  });
}

/** Numeracja ciągła w formacie 2026/2027/001. */
/**
 * Odzyskuje numery telefonów i PESEL-e, które Arkusze zamieniły w #ERROR!
 * (bo zaczynały się od „+" i zostały uznane za formułę). Wpisana wartość
 * nie przepada — siedzi jako treść formuły, więc da się ją odczytać przez
 * getFormulas() i zapisać ponownie, już jako tekst.
 */
function naprawBledneKomorki() {
  const arkusz = arkuszDanych();
  const naglowki = arkusz.getRange(1, 1, 1, arkusz.getLastColumn()).getValues()[0]
    .map(function (n) { return String(n).trim(); });
  const ostatni = arkusz.getLastRow();

  if (ostatni < 2) {
    SpreadsheetApp.getUi().alert('Arkusz nie zawiera jeszcze żadnych danych.');
    return;
  }

  let naprawione = 0;

  ['PESEL', 'Rodzic 1 — telefon', 'Rodzic 2 — telefon'].forEach(function (nazwa) {
    const i = naglowki.indexOf(nazwa);
    if (i < 0) return;

    const zakres = arkusz.getRange(2, i + 1, ostatni - 1, 1);
    const wartosci = zakres.getValues();
    const formuly = zakres.getFormulas();
    zakres.setNumberFormat('@');

    for (let r = 0; r < wartosci.length; r++) {
      if (String(wartosci[r][0]).indexOf('#') !== 0) continue;
      const oryginal = String(formuly[r][0] || '').replace(/^=/, '').trim();
      if (!oryginal) continue;
      arkusz.getRange(r + 2, i + 1).setValue("'" + oryginal);
      naprawione++;
    }
  });

  SpreadsheetApp.getUi().alert(
    naprawione === 0
      ? 'Nie znalazłem komórek do naprawy — kolumny z telefonami i PESEL-em są w porządku.'
      : 'Naprawiono komórek: ' + naprawione + '.\n\nKolumny mają teraz format tekstowy, więc błąd nie powinien się powtórzyć.'
  );
}

function nastepnyNumerUmowy(arkusz) {
  const kolejny = Math.max(0, arkusz.getLastRow() - 1) + 1;
  return CONFIG.ROK_SZKOLNY + '/' + String(kolejny).padStart(3, '0');
}

function zlozAdres(ulica, kod, miasto) {
  return [ulica, [kod, miasto].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

function zlozUpowaznienie(imie, dokument) {
  if (!imie) return '';
  return dokument ? imie + ' (' + dokument + ')' : imie;
}

/**
 * Arkusz traktuje wartość zaczynającą się od „+" jak formułę i pokazuje
 * #ERROR!. Apostrof z przodu wymusza tekst — potrzebne przy numerach
 * telefonów (+48 …) i PESEL-ach z zerem wiodącym.
 */
function jakoTekst(wartosc) {
  const s = String(wartosc || '').trim();
  return s ? "'" + s : '';
}

/**
 * Przyjmuje ID pliku/folderu w dowolnej postaci: samo ID, ID z doklejonym
 * „?hl=PL", albo cały adres skopiowany z przeglądarki. Zwraca czyste ID.
 */
function czystyId(wartosc) {
  const s = String(wartosc || '').trim();
  const zAdresu = s.match(/\/(?:d|folders)\/([a-zA-Z0-9_-]+)/);
  if (zAdresu) return zAdresu[1];
  return s.split(/[?/#]/)[0];
}

// ─────────────────────────────────────────────────────────────────────────
// 1b. SPRAWDZENIE KONFIGURACJI
// ─────────────────────────────────────────────────────────────────────────

/**
 * Bezpiecznie uruchamiana ręcznie (przycisk „Uruchom"). Sprawdza, czy
 * wszystko jest poprawnie ustawione, i wypisuje wynik w dzienniku.
 * Za pierwszym razem Google poprosi o autoryzację — to właśnie ta funkcja
 * jest do tego najlepsza.
 */
function testKonfiguracji() {
  const ok = [];
  const problemy = [];

  // Arkusz
  try {
    const a = arkuszDanych();
    ok.push('Arkusz „' + a.getName() + '" gotowy (wierszy z danymi: ' + Math.max(0, a.getLastRow() - 1) + ')');
  } catch (e) {
    problemy.push('Arkusz: ' + e.message);
  }

  // Folder z szablonami — sprawdzamy komplet, bo brak jednego pliku
  // ujawniłby się dopiero przy generowaniu teczki.
  if (czystyId(CONFIG.ID_FOLDERU_SZABLONOW) === 'WKLEJ_ID_FOLDERU_SZABLONOW') {
    problemy.push('Nie uzupełniono ID_FOLDERU_SZABLONOW w sekcji CONFIG');
  } else {
    try {
      const folderSzablonow = DriveApp.getFolderById(czystyId(CONFIG.ID_FOLDERU_SZABLONOW));
      ok.push('Folder szablonów: ' + folderSzablonow.getName());

      SZABLONY.forEach(function (pozycja) {
        const plik = szablonPoNazwie(folderSzablonow, pozycja.szablon);
        if (!plik) {
          problemy.push('Brakuje szablonu „' + pozycja.szablon + '" w folderze szablonów');
        } else if (plik.getMimeType() !== MimeType.GOOGLE_DOCS) {
          problemy.push('„' + pozycja.szablon + '" nie jest Dokumentem Google — otwórz plik .docx przez „Otwórz za pomocą → Dokumenty Google" i skasuj .docx');
        } else {
          ok.push('Szablon: ' + pozycja.szablon);
        }
      });
    } catch (e) {
      problemy.push('Nie mogę otworzyć folderu szablonów — sprawdź ID_FOLDERU_SZABLONOW');
    }
  }

  // Folder na teczki
  if (CONFIG.ID_FOLDERU_UMOW === 'WKLEJ_ID_FOLDERU') {
    problemy.push('Nie uzupełniono ID_FOLDERU_UMOW w sekcji CONFIG');
  } else {
    try {
      ok.push('Folder na teczki: ' + DriveApp.getFolderById(czystyId(CONFIG.ID_FOLDERU_UMOW)).getName());
    } catch (e) {
      problemy.push('Nie mogę otworzyć folderu — sprawdź ID_FOLDERU_UMOW');
    }
  }

  // Kod dostępu
  if (!CONFIG.KOD_DOSTEPU || CONFIG.KOD_DOSTEPU.length < 4) {
    problemy.push('KOD_DOSTEPU jest pusty albo zbyt krótki');
  } else {
    ok.push('Kod dostępu ustawiony (link dla rodziców: /dla-rodzicow?kod=' + CONFIG.KOD_DOSTEPU + ')');
  }

  // Limit wysyłki maili
  try {
    ok.push('Pozostały limit e-maili na dziś: ' + MailApp.getRemainingDailyQuota());
  } catch (e) {
    problemy.push('Brak uprawnień do wysyłki e-maili');
  }

  const raport =
    (problemy.length ? '❌ DO POPRAWY:\n• ' + problemy.join('\n• ') + '\n\n' : '✅ Konfiguracja kompletna.\n\n') +
    'Sprawdzone:\n• ' + ok.join('\n• ');

  console.log(raport);
  try { SpreadsheetApp.getUi().alert(raport); } catch (e) { /* uruchomione z edytora — wystarczy dziennik */ }
  return raport;
}

// ─────────────────────────────────────────────────────────────────────────
// 2. E-MAILE
// ─────────────────────────────────────────────────────────────────────────

function wyslijKopieRodzicowi(dane, nrUmowy) {
  const odbiorca = dane.r1_email;
  if (!odbiorca) return;

  const wiersze = [
    ['Dziecko', [dane.dziecko_imiona, dane.dziecko_nazwisko].filter(Boolean).join(' ')],
    ['Data urodzenia', dane.dziecko_data_ur],
    ['PESEL', dane.dziecko_pesel],
    ['Adres zamieszkania', zlozAdres(dane.dziecko_ulica, dane.dziecko_kod, dane.dziecko_miasto)],
    ['Dzielnica', dane.dziecko_dzielnica],
    ['Rodzic 1', dane.r1_imie],
    ['Telefon', dane.r1_telefon],
    ['E-mail', dane.r1_email],
    ['Rodzic 2', dane.r2_imie],
    ['E-mail do rachunków', dane.email_rachunki],
    ['Upoważnieni do odbioru', [
      zlozUpowaznienie(dane.upow1_imie, dane.upow1_dokument),
      zlozUpowaznienie(dane.upow2_imie, dane.upow2_dokument),
      zlozUpowaznienie(dane.upow3_imie, dane.upow3_dokument),
      zlozUpowaznienie(dane.upow4_imie, dane.upow4_dokument),
    ].filter(Boolean).join('<br>')],
    ['Zgody na wizerunek', [
      ['Aplikacja dla rodziców', dane.wiz_aplikacja],
      ['Strona www', dane.wiz_www],
      ['Facebook', dane.wiz_facebook],
      ['Instagram', dane.wiz_instagram],
      ['Materiały drukowane', dane.wiz_druk],
    ].map(function (z) {
      return (z[1] === 'TAK' ? '✓ ' : '✗ ') + z[0] + ': ' + (z[1] === 'TAK' ? 'zgoda' : 'brak zgody');
    }).join('<br>')],
  ].filter(function (w) { return w[1]; });

  const tabela = wiersze.map(function (w) {
    return '<tr>' +
      '<td style="padding:8px 16px 8px 0;color:#2D346F;opacity:.6;vertical-align:top;white-space:nowrap;">' + w[0] + '</td>' +
      '<td style="padding:8px 0;color:#2D346F;font-weight:600;">' + w[1] + '</td>' +
      '</tr>';
  }).join('');

  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#FCF6F0;padding:32px;">' +
      '<h1 style="color:#2D346F;font-size:22px;margin:0 0 8px;">Dziękujemy za przesłanie danych</h1>' +
      '<p style="color:#2D346F;opacity:.75;line-height:1.6;margin:0 0 24px;">' +
        'Poniżej kopia danych, które przesłałeś do umowy na rok szkolny ' + CONFIG.ROK_SZKOLNY + '. ' +
        'Przygotujemy umowę — podpisany przez dyrekcję egzemplarz będzie czekał na Ciebie w przedszkolu.' +
      '</p>' +
      '<div style="background:#fff;border-radius:16px;padding:24px;">' +
        '<p style="color:#34BBA8;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Umowa nr ' + nrUmowy + '</p>' +
        '<table style="width:100%;border-collapse:collapse;font-size:14px;">' + tabela + '</table>' +
      '</div>' +
      '<p style="color:#2D346F;opacity:.55;font-size:12px;line-height:1.6;margin:24px 0 0;">' +
        'Zauważyłeś błąd? Napisz na przedszkole@kolorowe.eu lub zadzwoń: 605 657 366.<br><br>' +
        'Kolorowe Przedszkole · ul. Lotaryńska 18 i ul. Zakopiańska 8, Warszawa' +
      '</p>' +
    '</div>';

  MailApp.sendEmail({
    to: odbiorca,
    subject: 'Kolorowe Przedszkole — kopia danych do umowy ' + nrUmowy,
    htmlBody: html,
    name: 'Kolorowe Przedszkole',
  });
}

function wyslijPowiadomienieDoPrzedszkola(dane, nrUmowy) {
  const dziecko = [dane.dziecko_imiona, dane.dziecko_nazwisko].filter(Boolean).join(' ');
  MailApp.sendEmail({
    to: CONFIG.EMAIL_PRZEDSZKOLA,
    subject: 'Nowe dane do umowy: ' + dziecko + ' (' + nrUmowy + ')',
    body:
      'Wpłynęły dane do umowy ' + nrUmowy + '.\n\n' +
      'Dziecko: ' + dziecko + '\n' +
      'Rodzic: ' + (dane.r1_imie || '—') + ', tel. ' + (dane.r1_telefon || '—') + '\n\n' +
      'Arkusz: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    name: 'Formularz Kolorowe Przedszkole',
  });
}

// ─────────────────────────────────────────────────────────────────────────
// 3. GENEROWANIE UMÓW
// ─────────────────────────────────────────────────────────────────────────

/** Menu w arkuszu — pojawia się po odświeżeniu pliku. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📄 Umowy')
    .addItem('Generuj teczki dla zaznaczonych wierszy', 'generujUmowy')
    .addItem('Generuj wszystkie brakujące', 'generujBrakujace')
    .addSeparator()
    .addItem('Napraw komórki z #ERROR!', 'naprawBledneKomorki')
    .addItem('Sprawdź konfigurację', 'testKonfiguracji')
    .addToUi();
}

function generujUmowy() {
  const arkusz = arkuszDanych();
  const zakres = arkusz.getActiveRange();
  const od = Math.max(2, zakres.getRow());
  const doW = zakres.getLastRow();
  przetworzWiersze(arkusz, od, doW, false);
}

function generujBrakujace() {
  const arkusz = arkuszDanych();
  przetworzWiersze(arkusz, 2, arkusz.getLastRow(), true);
}

function przetworzWiersze(arkusz, od, doW, tylkoBrakujace) {
  const ui = SpreadsheetApp.getUi();

  if (czystyId(CONFIG.ID_FOLDERU_SZABLONOW) === 'WKLEJ_ID_FOLDERU_SZABLONOW' ||
      CONFIG.ID_FOLDERU_UMOW === 'WKLEJ_ID_FOLDERU') {
    ui.alert('Najpierw uzupełnij ID_FOLDERU_SZABLONOW i ID_FOLDERU_UMOW w skrypcie (menu Rozszerzenia → Apps Script).');
    return;
  }

  const folder = DriveApp.getFolderById(czystyId(CONFIG.ID_FOLDERU_UMOW));

  // Czytamy nagłówki z samego arkusza, a nie z listy NAGLOWKI. Gdyby obie
  // się rozjechały (np. arkusz powstał przy starszej wersji skryptu),
  // dopasowanie po nazwie kolumny nadal jest poprawne — inaczej wszystkie
  // dane w umowie przesuwają się o jedną pozycję.
  const naglowki = arkusz.getRange(1, 1, 1, arkusz.getLastColumn()).getValues()[0]
    .map(function (n) { return String(n).trim(); });

  const kolWygenerowana = naglowki.indexOf('Umowa wygenerowana') + 1;
  const kolNazwisko = naglowki.indexOf('Dziecko — nazwisko');

  if (kolWygenerowana === 0 || kolNazwisko === -1) {
    ui.alert('Nie rozpoznaję nagłówków w arkuszu. Sprawdź, czy pierwszy wiersz zawiera oryginalne nazwy kolumn (m.in. „Umowa wygenerowana" i „Dziecko — nazwisko").');
    return;
  }

  let zrobione = 0;

  for (let r = od; r <= doW; r++) {
    const wiersz = arkusz.getRange(r, 1, 1, naglowki.length).getValues()[0];
    if (!wiersz[kolNazwisko]) continue;
    if (tylkoBrakujace && wiersz[kolWygenerowana - 1]) continue;

    const teczka = generujUmoweDlaWiersza(wiersz, folder, naglowki);
    arkusz.getRange(r, kolWygenerowana).setValue(new Date());
    arkusz.getRange(r, kolWygenerowana).setNote(teczka.getUrl());
    zrobione++;
  }

  ui.alert(
    zrobione === 0
      ? 'Nie wygenerowano żadnej teczki — sprawdź, czy zaznaczone wiersze zawierają dane.'
      : 'Gotowe. Teczek: ' + zrobione + '.\n\n' +
        'Każde dziecko ma na Dysku własny folder z kompletem dokumentów ' +
        '(Dokument Google + PDF), ponumerowanych w kolejności do wpięcia. ' +
        'Adres folderu jest w komentarzu w kolumnie „Umowa wygenerowana".'
  );
}

/**
 * Teczka jednego dziecka: podfolder z kompletem dokumentów, każdy jako
 * Dokument Google (do ewentualnej poprawki) i PDF (do druku). Pliki są
 * ponumerowane, więc drukowanie folderu po folderze daje od razu komplet
 * ułożony w kolejności do wpięcia.
 */
function generujUmoweDlaWiersza(wiersz, folderGlowny, naglowki) {
  const d = {};
  naglowki.forEach(function (naglowek, i) { d[naglowek] = wiersz[i]; });

  const dziecko = (d['Dziecko — imiona'] + ' ' + d['Dziecko — nazwisko']).trim();
  const teczka = teczkaDziecka(folderGlowny, d['Nr umowy'], dziecko);
  const podstawienia = zbudujPodstawienia(d, dziecko);
  const folderSzablonow = DriveApp.getFolderById(czystyId(CONFIG.ID_FOLDERU_SZABLONOW));

  SZABLONY.forEach(function (pozycja) {
    const szablon = szablonPoNazwie(folderSzablonow, pozycja.szablon);
    if (!szablon) {
      // Brak jednego szablonu nie może zablokować pozostałych — teczka
      // powstaje niekompletna, a w dzienniku zostaje ślad czego brakuje.
      console.warn('Nie znalazłem szablonu „' + pozycja.szablon + '" w folderze szablonów.');
      return;
    }

    const nazwa = pozycja.wynik + ' — ' + dziecko;
    const kopia = szablon.makeCopy(nazwa, teczka);
    const dok = DocumentApp.openById(kopia.getId());
    const body = dok.getBody();

    Object.keys(podstawienia).forEach(function (klucz) {
      body.replaceText(escapeRegex(klucz), podstawienia[klucz]);
    });

    dok.saveAndClose();
    teczka.createFile(kopia.getAs('application/pdf')).setName(nazwa + '.pdf');
  });

  return teczka;
}

/** Podfolder „2026-2027-001 — Jan Kowalski". Istniejący reużywamy. */
function teczkaDziecka(folderGlowny, nrUmowy, dziecko) {
  const nazwa = String(nrUmowy).replace(/\//g, '-') + ' — ' + dziecko;
  const istniejace = folderGlowny.getFoldersByName(nazwa);
  return istniejace.hasNext() ? istniejace.next() : folderGlowny.createFolder(nazwa);
}

function szablonPoNazwie(folder, nazwa) {
  const pliki = folder.getFilesByName(nazwa);
  return pliki.hasNext() ? pliki.next() : null;
}

/**
 * Jeden zestaw pól dla wszystkich dokumentów. Pola nieużywane w danym
 * szablonie po prostu nie mają czego podmienić — dzięki temu nie trzeba
 * utrzymywać osobnej mapy dla każdego załącznika.
 */
function zbudujPodstawienia(d, dziecko) {
  const bezApostrofu = function (v) { return String(v || '').replace(/^'/, ''); };

  const stawka = Number(d['Stawka']) || CONFIG.CZESNE_PODSTAWOWE;
  const roczna = stawka === CONFIG.CZESNE_RODZENSTWO
    ? CONFIG.OPLATA_ROCZNA_RODZENSTWO
    : CONFIG.OPLATA_ROCZNA_PODSTAWOWA;

  const rodzice = [d['Rodzic 1 — imię i nazwisko'], d['Rodzic 2 — imię i nazwisko']]
    .filter(Boolean).join(', ');
  const telefony = [d['Rodzic 1 — telefon'], d['Rodzic 2 — telefon']]
    .map(bezApostrofu).filter(Boolean).join(', ');
  const maile = [d['Rodzic 1 — e-mail'], d['Rodzic 2 — e-mail']].filter(Boolean).join(', ');

  const pola = {
    '{{NR_UMOWY}}': d['Nr umowy'],
    '{{DATA_UMOWY}}': CONFIG.DATA_UMOWY,
    '{{ROK_SZKOLNY}}': CONFIG.ROK_SZKOLNY,

    '{{DZIECKO}}': dziecko,
    '{{DZIECKO_IMIONA}}': d['Dziecko — imiona'],
    '{{DZIECKO_NAZWISKO}}': d['Dziecko — nazwisko'],
    '{{DZIECKO_DATA_UR}}': formatujDate(d['Data urodzenia']),
    '{{DZIECKO_PESEL}}': d['PESEL'],
    '{{DZIECKO_ADRES_ZAM}}': d['Adres zamieszkania'],
    '{{DZIECKO_ADRES_ZAMEL}}': d['Adres zameldowania'],
    '{{DZIELNICA_ZAM}}': d['Dzielnica zamieszkania'],
    '{{DZIELNICA_ZAMEL}}': d['Dzielnica zameldowania'],

    '{{RODZICE}}': rodzice,
    '{{RODZICE_ADRES}}': d['Rodzic 1 — adres'],
    '{{RODZICE_TELEFON}}': telefony,
    '{{RODZICE_EMAIL}}': maile,

    '{{R1_IMIE}}': d['Rodzic 1 — imię i nazwisko'],
    '{{R1_TELEFON}}': d['Rodzic 1 — telefon'],
    '{{R1_EMAIL}}': d['Rodzic 1 — e-mail'],
    '{{R2_IMIE}}': d['Rodzic 2 — imię i nazwisko'],
    '{{R2_TELEFON}}': d['Rodzic 2 — telefon'],
    '{{R2_EMAIL}}': d['Rodzic 2 — e-mail'],

    // Obie placówki zostają w druku — niepotrzebną skreśla się przy podpisie.
    '{{PLACOWKA}}': 'Przedszkola Niepublicznego (ul. Lotaryńska 18) / Punktu Przedszkolnego (ul. Zakopiańska 8)',
    '{{EMAIL_RACHUNKI}}': d['E-mail do rachunków'],
    '{{CZESNE}}': String(stawka),
    '{{CZESNE_SLOWNIE}}': slownie(stawka),
    '{{OPLATA_ROCZNA}}': roczna.toLocaleString('pl-PL'),
    '{{UPOWAZNIONA_1}}': d['Upoważniona 1'],
    '{{UPOWAZNIONA_2}}': d['Upoważniona 2'],
    '{{UPOWAZNIONA_3}}': d['Upoważniona 3'],
    '{{UPOWAZNIONA_4}}': d['Upoważniona 4'],
  };

  // Zgody na wizerunek: krzyżyk w kolumnie zgodnej z decyzją rodzica.
  // Brak wartości traktujemy jak „NIE" — zgoda musi być czynna i wyraźna.
  const zgody = {
    APLIKACJA: d['Wizerunek — aplikacja dla rodziców'],
    WWW: d['Wizerunek — strona www'],
    FACEBOOK: d['Wizerunek — Facebook'],
    INSTAGRAM: d['Wizerunek — Instagram'],
    DRUK: d['Wizerunek — materiały drukowane'],
  };

  Object.keys(zgody).forEach(function (klucz) {
    const tak = String(zgody[klucz] || 'NIE').trim().toUpperCase() === 'TAK';
    pola['{{WIZ_' + klucz + '_TAK}}'] = tak ? 'X' : '';
    pola['{{WIZ_' + klucz + '_NIE}}'] = tak ? '' : 'X';
  });

  // Apostrof wymuszający tekst w arkuszu nie może trafić do dokumentu.
  Object.keys(pola).forEach(function (klucz) {
    pola[klucz] = bezApostrofu(pola[klucz]);
  });

  return pola;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatujDate(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd.MM.yyyy');
  }
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? m[3] + '.' + m[2] + '.' + m[1] : String(v || '');
}

/** Kwota słownie — obsługuje zakres potrzebny dla czesnego. */
function slownie(kwota) {
  const jednosci = ['', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'];
  const nastscie = ['dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście', 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'];
  const dziesiatki = ['', '', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt', 'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'];
  const setki = ['', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset', 'sześćset', 'siedemset', 'osiemset', 'dziewięćset'];

  function doTysiaca(n) {
    const cz = [];
    cz.push(setki[Math.floor(n / 100)]);
    const reszta = n % 100;
    if (reszta >= 10 && reszta < 20) {
      cz.push(nastscie[reszta - 10]);
    } else {
      cz.push(dziesiatki[Math.floor(reszta / 10)]);
      cz.push(jednosci[reszta % 10]);
    }
    return cz.filter(Boolean).join(' ');
  }

  const n = Math.round(Number(kwota) || 0);
  const tys = Math.floor(n / 1000);
  const reszta = n % 1000;
  const czesci = [];

  if (tys === 1) czesci.push('tysiąc');
  else if (tys >= 2 && tys <= 4) czesci.push(doTysiaca(tys) + ' tysiące');
  else if (tys >= 5) czesci.push(doTysiaca(tys) + ' tysięcy');

  if (reszta) czesci.push(doTysiaca(reszta));
  return czesci.join(' ') || 'zero';
}

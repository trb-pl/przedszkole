/**
 * Kolorowe Przedszkole — automat przebudowy strony po zmianie planu zajęć
 * =======================================================================
 *
 * Ten skrypt wkleja się do Apps Script POWIĄZANEGO Z ARKUSZEM PLANU ZAJĘĆ
 * (Rozszerzenia → Apps Script w arkuszu „Plan zajęć 2026/2027"), a nie do
 * skryptu od umów.
 *
 * Co robi: gdy dyrekcja zmieni godzinę, skrypt woła Deploy Hook Vercela,
 * a strona przebudowuje się z nowymi danymi — razem z PDF-em do pobrania.
 *
 * Wdrożenie (raz):
 *  1. Wklej ten plik do edytora Apps Script.
 *  2. Uzupełnij HOOK poniżej.
 *  3. Uruchom funkcję ustawWyzwalacz() i zatwierdź uprawnienia.
 */

// Adres Deploy Hooka z Vercela (Settings → Git → Deploy Hooks).
// Kto zna ten adres, może wywołać przebudowę strony — dlatego nie trafia
// do repozytorium, które jest publiczne.
const HOOK = 'WKLEJ_ADRES_DEPLOY_HOOKA';

// Ile czekamy od ostatniej zmiany, zanim przebudujemy stronę.
// Dwa powody: wpisanie pięciu godzin z rzędu ma dać jeden build, a nie pięć,
// oraz Google publikuje zmieniony arkusz jako CSV z kilkuminutowym
// opóźnieniem — przebudowa od razu pobrałaby jeszcze starą wersję.
const OPOZNIENIE_MINUT = 3;


/** Uruchom raz ręcznie: podpina wyzwalacz do zapisu w arkuszu. */
function ustawWyzwalacz() {
  const arkusz = SpreadsheetApp.getActive();

  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'poZmianiePlanu'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });

  // Wyzwalacz „instalowany", nie prosty onEdit — tylko taki ma prawo
  // wywołać zewnętrzny adres.
  ScriptApp.newTrigger('poZmianiePlanu').forSpreadsheet(arkusz).onEdit().create();

  SpreadsheetApp.getUi().alert(
    'Gotowe. Od teraz każda zmiana w arkuszu przebuduje stronę ' +
    OPOZNIENIE_MINUT + ' minuty po ostatniej edycji.'
  );
}


/** Reaguje na zapis w arkuszu — odkłada przebudowę na później. */
function poZmianiePlanu() {
  // Kasujemy poprzednie odliczanie i zaczynamy nowe. Dzięki temu seria
  // poprawek kończy się jedną przebudową, liczoną od ostatniej z nich.
  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'przebudujStrone'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });

  ScriptApp.newTrigger('przebudujStrone')
    .timeBased()
    .after(OPOZNIENIE_MINUT * 60 * 1000)
    .create();
}


/** Woła Deploy Hook. Uruchamiana przez odliczanie albo z menu. */
function przebudujStrone() {
  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'przebudujStrone'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });

  if (HOOK === 'WKLEJ_ADRES_DEPLOY_HOOKA') {
    console.error('Nie uzupełniono adresu HOOK w skrypcie.');
    return;
  }

  const odpowiedz = UrlFetchApp.fetch(HOOK, {
    method: 'post',
    muteHttpExceptions: true,
  });

  console.log('Przebudowa strony: HTTP ' + odpowiedz.getResponseCode());
}


/** Menu w arkuszu — pojawia się po odświeżeniu pliku. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🌐 Strona')
    .addItem('Zaktualizuj stronę teraz', 'przebudujRecznie')
    .addSeparator()
    .addItem('Włącz automat', 'ustawWyzwalacz')
    .addToUi();
}


function przebudujRecznie() {
  przebudujStrone();
  SpreadsheetApp.getUi().alert(
    'Wysłano polecenie przebudowy.\n\n' +
    'Nowy plan pojawi się na stronie za 2–3 minuty. ' +
    'Jeśli zmiana była przed chwilą, poczekaj chwilę i kliknij ponownie — ' +
    'Google udostępnia zmieniony arkusz z kilkuminutowym opóźnieniem.'
  );
}

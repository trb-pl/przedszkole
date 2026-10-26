# Miesięczny raport strony — wdrożenie

Raport działa w **osobnym arkuszu Google** z własnym skryptem. Nie łączymy go
z arkuszem umów: raport potrzebuje uprawnień do Google Analytics i Search
Console, a zmiana uprawnień w skrypcie formularzy mogłaby na chwilę wyłączyć
zapisy ze strony.

Pliki:

| Plik | Do czego |
|---|---|
| `Raport.gs` | Kod raportu — wkleja się zamiast domyślnego `Kod.gs` |
| `appsscript.json` | Ustawienia skryptu: strefa czasowa, usługa GA4 i uprawnienia |

## 1. Arkusz

Na koncie Google, które **ma dostęp do Google Analytics i Search Console**
strony, utwórz nowy arkusz: „Raport strony — Kolorowe Przedszkole".

## 2. Ustawienia skryptu (`appsscript.json`)

1. W arkuszu: **Rozszerzenia → Apps Script**.
2. Po lewej **⚙ Ustawienia projektu** → zaznacz **„Pokaż plik manifestu
   appsscript.json w edytorze"**.
3. Wróć do edytora (ikona `< >`), otwórz `appsscript.json`, zastąp całą
   treść zawartością pliku z repozytorium i zapisz.

Jeśli zapis pokaże błąd o usłudze `analyticsdata`: usuń z pliku cały blok
`"dependencies": {...},`, zapisz, a usługę dodaj ręcznie — po lewej
**Usługi +** → **Google Analytics Data API** → **Dodaj**.

## 3. Kod

1. Otwórz `Kod.gs`, zastąp całą treść kodem z `Raport.gs`.
2. W sekcji `RAPORT` uzupełnij:
   - `GA4_PROPERTY_ID` — Google Analytics → **Administracja → Ustawienia
     usługi → Identyfikator usługi** (same cyfry, nie „G-…"),
   - `ID_ARKUSZA_FORMULARZY` — opcjonalnie, ID arkusza z zakładką „Dane do
     umów" (z adresu: `docs.google.com/spreadsheets/d/ID/edit`); bez niego
     raport pominie zapisy na listę rekrutacyjną,
   - `EMAIL` — opcjonalnie, adresy do podsumowania po przecinku.
3. Zapisz.

## 4. Pierwsze uruchomienie

1. Odśwież arkusz — pojawi się menu **📊 Raport strony**.
2. **Sprawdź połączenia.** Google poprosi o zgodę na uprawnienia. Komunikat
   „Aplikacja nie została zweryfikowana" jest normalny dla własnych skryptów:
   **Zaawansowane → Przejdź do projektu (niebezpieczne) → Zezwól**.
3. Gdy przy Google Analytics i Search Console są ✅ — **Raport za poprzedni
   miesiąc**.
4. Na koniec **Włącz automatyczny raport co miesiąc** — od tej chwili raport
   za poprzedni miesiąc powstaje sam 3. dnia miesiąca ok. 7:00 (Search
   Console domyka dane z dwu-, trzydniowym opóźnieniem).

## Jeśli Search Console nie działa

Komunikat „Google Search Console API has not been used in project…" znaczy,
że skrypt potrzebuje własnego projektu Google Cloud:

1. [console.cloud.google.com](https://console.cloud.google.com) → nowy projekt.
2. **Interfejsy API i usługi → Biblioteka** → „Google Search Console API" →
   **Włącz**.
3. **Ekran zgody OAuth** → typ „Zewnętrzny", nazwa aplikacji, swój e-mail →
   zapisz (aplikacja może zostać w trybie testowym; dodaj siebie jako testera).
4. Skopiuj **numer projektu** (strona główna projektu).
5. W Apps Script: **⚙ Ustawienia projektu → Projekt Google Cloud → Zmień
   projekt** → wklej numer.
6. Jeszcze raz **Sprawdź połączenia** i zezwól na uprawnienia.

Reszta raportu (Analytics, lista rekrutacyjna) działa także bez tego kroku.

## Co jest w raporcie

- **Podsumowanie** — wiersz na miesiąc: odwiedzający, wizyty, wyświetlenia
  stron, kliknięcia i wyświetlenia w Google, średnia pozycja, zapisy na listę.
- **Zakładka miesiąca** (np. `2026-10`) — te liczby z porównaniem do
  poprzedniego miesiąca, źródła ruchu, najczęściej oglądane strony,
  urządzenia, miasta, zapytania w Google i strony klikane w Google.

Skrypt tylko czyta dane — niczego nie zmienia w Analytics, Search Console
ani w arkuszu z formularzami.

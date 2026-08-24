# Formularz danych do umowy — instrukcja wdrożenia

Jednorazowa konfiguracja, ok. 20 minut. Wszystko dzieje się w Twoim
Google Workspace (`michal@trbk.pl`) — dane osobowe nie trafiają do żadnej
zewnętrznej firmy.

---

## Krok 1 — Arkusz na dane

1. Wejdź na [sheets.new](https://sheets.new) — utworzy się pusty arkusz.
2. Nazwij go **„Kolorowe Przedszkole — dane do umów 2026/2027"**.
3. Zostaw otwarty, będzie potrzebny w kroku 3.

---

## Krok 2 — Folder na gotowe umowy

1. Wejdź na [drive.google.com](https://drive.google.com), utwórz folder
   **„Umowy 2026/2027"**.
2. Wejdź do folderu i skopiuj **ID z adresu przeglądarki**:

   ```
   drive.google.com/drive/folders/1AbC...XyZ
                                   ^^^^^^^^^^  ← to jest ID
   ```

---

## Krok 3 — Szablon umowy

1. Wgraj na Dysk plik **`Umowa_SZABLON_2026_2027.docx`** (jest w Twoich
   Pobranych — przygotowałem go z wstawionymi już polami `{{...}}`).
2. Kliknij plik prawym → **Otwórz za pomocą → Dokumenty Google**.
3. Zapisze się jako dokument Google. **Skopiuj jego ID z adresu:**

   ```
   docs.google.com/document/d/1DeF...UvW/edit
                              ^^^^^^^^^^  ← to jest ID
   ```

4. Przejrzyj dokument — w miejscach danych zobaczysz `{{NR_UMOWY}}`,
   `{{DZIECKO_IMIONA}}` itd. Nie zmieniaj ich pisowni; resztę treści
   możesz swobodnie edytować.

---

## Krok 4 — Skrypt

1. Wróć do arkusza z kroku 1 → menu **Rozszerzenia → Apps Script**.
2. Usuń całą zawartość edytora i wklej treść pliku **`Kod.gs`**
   (`docs/apps-script/Kod.gs` w repozytorium strony).
3. Na górze pliku uzupełnij sekcję `CONFIG`:

   ```js
   KOD_DOSTEPU: 'KOLOROWE2027',        // hasło, które dostaną rodzice
   ID_SZABLONU_UMOWY: '1DeF...UvW',    // z kroku 3
   ID_FOLDERU_UMOW: '1AbC...XyZ',      // z kroku 2
   EMAIL_PRZEDSZKOLA: 'przedszkole@kolorowe.eu',
   ```

4. Zapisz (ikona dyskietki).

---

## Krok 5 — Publikacja skryptu

1. W edytorze skryptu: **Wdróż → Nowe wdrożenie**.
2. Kliknij koło zębate przy „Wybierz typ" → **Aplikacja internetowa**.
3. Ustaw:
   - **Wykonaj jako:** Ja (`michal@trbk.pl`)
   - **Kto ma dostęp:** **Wszyscy** ← ważne, inaczej formularz nie zadziała
4. **Wdróż** → Google poprosi o autoryzację. Przejdź przez
   „Zaawansowane → Przejdź do…" i zezwól.
5. Skopiuj **adres aplikacji internetowej** (kończy się na `/exec`).

> „Wszyscy" oznacza, że każdy może *wysłać* dane — nie że każdy może je
> *czytać*. Arkusz pozostaje prywatny. Przed zapisem skrypt sprawdza kod
> dostępu, więc przypadkowe zgłoszenia są odrzucane.

---

## Krok 6 — Podłączenie strony

W panelu **Vercel** → projekt `przedszkole` → **Settings → Environment
Variables** dodaj:

| Nazwa | Wartość | Środowiska |
|---|---|---|
| `PUBLIC_FORM_ENDPOINT` | adres `/exec` z kroku 5 | Production + Preview |

Potem **Deployments → … → Redeploy** (zmienne działają dopiero po
przebudowaniu).

---

## Krok 7 — Test

1. Wejdź na `koloroweprzedszkole.com/dla-rodzicow`.
2. Wpisz kod dostępu, wypełnij formularz danymi testowymi.
3. Sprawdź, czy:
   - w arkuszu pojawił się wiersz,
   - na maila przyszła kopia,
   - na `przedszkole@kolorowe.eu` przyszło powiadomienie.
4. Testowy wiersz usuń z arkusza.

---

## Codzienne użycie — jak Olga drukuje umowy

1. Otwiera arkusz.
2. W kolumnie **Stawka** zostawia `2350` albo wpisuje `2150`, jeśli to
   rodzeństwo.
3. Menu **📄 Umowy → Generuj wszystkie brakujące**.
4. W folderze „Umowy 2026/2027" pojawiają się gotowe pliki **PDF** —
   otwiera i drukuje.
5. Kolumna „Umowa wygenerowana" wypełnia się datą, więc przy kolejnym
   kliknięciu skrypt pominie już zrobione.

> Menu **📄 Umowy** pojawia się po odświeżeniu arkusza (F5).

---

## Co trzeba zrobić poza kodem

- **Umowa powierzenia przetwarzania danych** między przedszkolem
  (administrator) a Tobą / TRBK (procesor) — dane z PESEL-ami leżą na
  Twoim Workspace. To wymóg RODO, nie formalność.
- **Kod dostępu** przekaż rodzicom mailem lub przy odbiorze dziecka.
- **Raz w roku:** w `CONFIG` zmień `ROK_SZKOLNY`, `DATA_UMOWY` i stawki,
  a szablon umowy podmień na nowy.

---

## Lista pól w szablonie

| Placeholder | Skąd pochodzi |
|---|---|
| `{{NR_UMOWY}}` | generowany automatycznie: `2026/2027/001` |
| `{{DATA_UMOWY}}` | `CONFIG.DATA_UMOWY` |
| `{{RODZICE}}` | imiona i nazwiska obojga rodziców |
| `{{RODZICE_ADRES}}` | adres rodzica 1 |
| `{{RODZICE_TELEFON}}`, `{{RODZICE_EMAIL}}` | oba kontakty połączone przecinkiem |
| `{{DZIECKO_IMIONA}}`, `{{DZIECKO_NAZWISKO}}` | z formularza |
| `{{DZIECKO_DATA_UR}}` | format `dd.mm.rrrr` |
| `{{DZIECKO_PESEL}}` | z formularza (walidowany sumą kontrolną) |
| `{{DZIECKO_ADRES_ZAM}}`, `{{DZIECKO_ADRES_ZAMEL}}` | złożone z ulicy, kodu i miasta |
| `{{DZIELNICA_ZAM}}`, `{{DZIELNICA_ZAMEL}}` | z formularza |
| `{{PLACOWKA}}` | Lotaryńska 18 albo Zakopiańska 8 |
| `{{EMAIL_RACHUNKI}}` | § 8 pkt 8 umowy |
| `{{UPOWAZNIONA_1}}`…`{{UPOWAZNIONA_4}}` | § 9, format: `imię nazwisko (dokument)` |

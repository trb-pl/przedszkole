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

## Krok 2 — Dwa foldery na Dysku

Na [drive.google.com](https://drive.google.com) utwórz dwa foldery:

1. **„Szablony dokumentów 2026/2027"** — tu wgrasz sześć szablonów
2. **„Teczki dzieci 2026/2027"** — tu skrypt utworzy folder dla każdego dziecka

Z każdego skopiuj **ID z adresu przeglądarki**:

```
drive.google.com/drive/folders/1AbC...XyZ
                                ^^^^^^^^^^  ← to jest ID
```

---

## Krok 3 — Sześć szablonów

Wgraj na Dysk pliki z Pobranych, każdy kliknij prawym →
**Otwórz za pomocą → Dokumenty Google**, a powstały dokument **nazwij
dokładnie tak** (skrypt szuka ich po nazwie):

| Plik z Pobranych | Nazwa Dokumentu Google |
|---|---|
| `Umowa_SZABLON_2026_2027_brand.docx` | `SZABLON - Umowa` |
| `Zalacznik1_Zachorowanie_SZABLON.docx` | `SZABLON - Zalacznik 1` |
| `Zalacznik2_Wizerunek_SZABLON.docx` | `SZABLON - Zalacznik 2` |
| `Zalacznik3_Piesze_wyjscia_SZABLON.docx` | `SZABLON - Zalacznik 3` |
| `Zalacznik4_Zajecia_dodatkowe_SZABLON.docx` | `SZABLON - Zalacznik 4` |
| `Ankieta_Informacje_o_dziecku_SZABLON.docx` | `SZABLON - Informacje o dziecku` |

Wszystkie sześć wrzuć do folderu **„Szablony dokumentów 2026/2027"**
i skasuj z niego pliki `.docx` — zostają wyłącznie Dokumenty Google.

Nazwy bez polskich znaków są celowe: literówka w „ą" jest nie do
wypatrzenia, a skrypt porównuje nazwy znak po znaku.

> **Uwaga na nazwę po konwersji.** Otwarcie `.docx` jako Dokument Google
> tworzy dokument o nazwie pliku, np. `Umowa_SZABLON_2026_2027_brand`.
> Trzeba go **zmienić na** `SZABLON - Umowa`. Sam plik `.docx` skasuj —
> zostaje mylącym duplikatem o podobnej nazwie.

Menu **📄 Umowy → Pokaż szablony** wypisuje obok siebie to, co naprawdę
leży w folderze, i to, czego skrypt szuka. Przy problemie z nazwą różnicę
widać od razu.

---

## Krok 4 — Skrypt

1. Wróć do arkusza z kroku 1 → menu **Rozszerzenia → Apps Script**.
2. Usuń całą zawartość edytora i wklej treść pliku **`Kod.gs`**
   (`docs/apps-script/Kod.gs` w repozytorium strony).
3. Na górze pliku uzupełnij sekcję `CONFIG`:

   ```js
   KOD_DOSTEPU: 'KOLOROWE2027',              // hasło, które dostaną rodzice
   ID_FOLDERU_SZABLONOW: '1DeF...UvW',       // folder „Szablony dokumentów"
   ID_FOLDERU_UMOW: '1AbC...XyZ',            // folder „Teczki dzieci"
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

## Codzienne użycie — jak Olga przygotowuje teczki

1. Otwiera arkusz.
2. W kolumnie **Stawka** zostawia `2350` albo wpisuje `2150`, jeśli to
   rodzeństwo.
3. Menu **📄 Umowy → Generuj wszystkie brakujące**.
4. W folderze „Teczki dzieci 2026/2027" pojawia się folder na każde dziecko,
   a w nim sześć **PDF-ów** ponumerowanych w kolejności do wpięcia —
   otwiera folder, drukuje wszystko, wpina do teczki.
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
  a szablony podmień na nowe (zachowując ich nazwy).

---

## Lista pól w szablonach

Wszystkie szablony dostają ten sam zestaw pól — każdy używa tylu, ile
potrzebuje. Pole, którego w danym dokumencie nie ma, jest po prostu
pomijane, więc dopisanie `{{DZIECKO_PESEL}}` do kolejnego załącznika nie
wymaga zmiany w skrypcie.

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
| `{{DZIECKO}}` | imiona i nazwisko dziecka w jednym polu |
| `{{R1_IMIE}}`, `{{R1_TELEFON}}`, `{{R1_EMAIL}}` | rodzic 1 — osobno, do załączników |
| `{{R2_IMIE}}`, `{{R2_TELEFON}}`, `{{R2_EMAIL}}` | rodzic 2 — osobno, do załączników |
| `{{WIZ_*_TAK}}`, `{{WIZ_*_NIE}}` | krzyżyk w kolumnie zgodnej z decyzją rodzica |


---

## Co powstaje po kliknięciu „Generuj teczki"

Dla każdego zaznaczonego wiersza skrypt tworzy w folderze teczek podfolder
`2026-2027-001 — Jan Kowalski`, a w nim sześć dokumentów — każdy jako
Dokument Google (gdyby coś trzeba było poprawić) i PDF (do druku):

| Plik | Co jest wypełnione |
|---|---|
| `1. Umowa` | wszystko |
| `2. Zalacznik 1 - postepowanie przy zachorowaniu` | dziecko, data urodzenia, imiona i telefony rodziców |
| `3. Zalacznik 2 - zgoda na wizerunek` | wszystko, z decyzjami rodzica |
| `4. Zalacznik 3 - piesze wyjscia` | dziecko, numer umowy |
| `5. Zalacznik 4 - zajecia dodatkowe` | dziecko, numer umowy |
| `6. Informacje o dziecku - ankieta` | dziecko, PESEL, kontakty do rodziców |

Numery z przodu ustawiają pliki w kolejności do wpięcia w teczkę — drukujesz
folder po folderze i od razu masz komplet.

Puste zostaje wszystko, co dotyczy zdrowia, diety, trudności i wyborów
rodzica. To dane szczególnej kategorii (art. 9 RODO) albo decyzje, których
formularz nie zbiera — rodzic uzupełnia je na miejscu.

Adres teczki zapisuje się jako komentarz w kolumnie „Umowa wygenerowana" —
najedź na komórkę, żeby go zobaczyć.

Ponowne uruchomienie dla tego samego wiersza używa istniejącej teczki,
więc nie robią się duplikaty folderów.

---

## Co dostaje rodzic po wysłaniu formularza

Na adres e-mail rodzica 1 idzie kopia wpisanych danych — do sprawdzenia, czy
nie ma literówki w PESEL-u albo adresie. Bez załączników: PESEL dziecka
nie krąży niepotrzebnie po skrzynkach pocztowych.

Treść umowy i zgód rodzic czyta przed wypełnieniem formularza — puste wzory
w PDF są do pobrania na stronie `/dla-rodzicow`. Generuje je
`scripts/make-wzory-pdf.py` z tych samych plików .docx, z których powstają
egzemplarze finalne, więc obie wersje nie mogą się rozjechać.

Egzemplarze do podpisu drukuje przedszkole z menu `📄 Umowy` w arkuszu.

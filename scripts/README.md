# scripts/

Narzędzia uruchamiane ręcznie, poza buildem strony. Generują pliki, które
trafiają do repo jako gotowe assety — dzięki temu Vercel nie musi mieć
Pythona ani żadnej z tych bibliotek.

| Plik | Co robi | Wynik |
|---|---|---|
| `make-og-image.py` | Karta podglądu linku (WhatsApp, iMessage, Messenger) | `public/og-default.jpg` |
| `przygotuj-fonty.py` | Wycina statyczne odmiany Nunito z pakietu Fontsource | `scripts/fonty/*.ttf` (poza gitem) |
| `make-wzory-pdf.py` | Komplet pustych dokumentów do pobrania ze strony | `public/dokumenty/*.pdf` |
| `make-listy-obecnosci.py` | Listy obecności dzieci i personelu na rok szkolny | `~/Downloads/Listy_obecnosci_*.pdf` |
| `plan-pliki.mjs` | Plan zajęć grup: dane stron, PDF-y i kalendarze — uruchamiany automatycznie przy `npm run build` | `src/data/plan-zajec.json`, `public/dokumenty/plan-zajec-*.pdf`, `public/kalendarz/plan-*.ics` |

## Środowisko

`make-og-image.py` potrzebuje tylko Pillow. Pozostałe dwa — reportlab
i fonttools:

```bash
python3 -m venv venv
./venv/bin/pip install pillow reportlab fonttools brotli
```

## Wzory dokumentów — kiedy przegenerować

Za każdym razem, gdy zmieni się treść umowy albo załącznika:

```bash
./venv/bin/python scripts/przygotuj-fonty.py
./venv/bin/python scripts/make-wzory-pdf.py
```

Źródłem są pliki `.docx` z katalogu `~/Downloads` (ścieżki na górze
`make-wzory-pdf.py`) — te same, z których Apps Script generuje egzemplarze
do podpisu. Jedno źródło treści, więc wzór na stronie nie może rozjechać się
z umową, którą rodzic dostaje w przedszkolu.

Powstaje siedem plików: umowa, cztery załączniki, ankieta „Informacje
o dziecku" i informacja RODO. Pakiet czterech załączników jest w źródle
jednym dokumentem — skrypt rozbija go po wierszach „Załącznik nr.N do umowy",
żeby rodzic pobierał pojedynczy formularz, a nie wszystko naraz.

Umowa i załącznik nr 2 mają własne, ostylowane szablony `.docx` (patrz
`docs/apps-script/szablon/`). Pozostałe przychodzą bez formatowania, więc
markę — logo, kolory nagłówków, stopkę — nakłada sam skrypt przy składzie.
Informacja RODO jako jedyna nie dostaje nagłówka „WZÓR": niczego się na niej
nie podpisuje, więc jest pełnoprawnym dokumentem, a nie wzorem.

Pola `{{...}}` zamieniają się na kropkowaną linię, a na każdej stronie
pojawia się nagłówek „WZÓR · dokument poglądowy, nie do podpisu".

Katalog `public/dokumenty/` dostaje nagłówek `X-Robots-Tag: noindex`
(w `vercel.json`) — to dokumenty dla rodziców, nie treść do wyszukiwarki.


## Listy obecności

```bash
./venv/bin/python scripts/make-listy-obecnosci.py
```

Jeden PDF, 24 strony poziome: dwie grupy × dwanaście miesięcy roku
szkolnego. Kratka na dzień, dni wolne wyszarzone — weekendy, święta
ustawowe i przerwy wynikające z § 3 umowy.

**Dane dzieci nie leżą w repozytorium.** Repo jest publiczne, a to dane
osobowe, więc skrypt czyta listę z `~/Downloads/dzieci_2026_2027.txt`:

```
# Zakopiańska
Barbara<TAB>Dowgiałło
…

# Lotaryńska
Lena<TAB>Komorowska-Konys
…
```

Nazwa grupy stoi nad jej listą, a nie w kodzie — przestawienie bloków
w pliku nie podmieni wtedy nagłówków na kartach.

Sortowanie alfabetyczne po nazwisku realizuje własna tablica polskiego
alfabetu, a nie `locale` — ustawienia regionalne bywają nieobecne na innej
maszynie i wtedy „Ł" wypada za „Z".

Kalendarz świąt jest wpisany na sztywno na rok 2026/2027 (z Wigilią, która
jest dniem ustawowo wolnym od 2025 roku). Na kolejny rok trzeba go
zaktualizować razem z datami przerw z umowy.

### Karta obecności personelu

Powstaje z `~/Downloads/pracownicy_2026_2027.txt` (jedna osoba lub zajęcia
w wierszu, bez tabulatora) jako osobny PDF, 12 stron. Dwie różnice wobec
kart dla dzieci:

- **kolejność zostaje taka jak w pliku** — listy personelu układa się wg
  funkcji, nie alfabetu;
- **wyszarzone są tylko weekendy i święta ustawowe**, bez przerw z umowy.
  Przerwa wakacyjna zamyka przedszkole dla dzieci, ale personel bywa wtedy
  na dyżurze albo urlopie i musi mieć gdzie to odnotować.

Jeśli pliku nie ma, skrypt generuje same karty dzieci i mówi o tym wprost.

## Plan zajęć

Godziny **nie są w repozytorium** — pochodzą z Arkusza Google, który edytuje
dyrekcja. Adres arkusza (opublikowanego jako CSV) siedzi w zmiennej
`PUBLIC_PLAN_CSV`.

Arkusz ma jedną zakładkę, a w niej grupy jedna pod drugą: wiersz z nazwą
grupy, pod nim nagłówek `Zajęcia | Opis | Poniedziałek | … | Piątek`, dalej
zajęcia. Grupa dopisana w ten sam sposób dostaje własną podstronę, PDF
i kalendarz bez zmian w kodzie.

`scripts/plan-pliki.mjs` pobiera arkusz **raz na build** i zapisuje:

- `src/data/plan-zajec.json` — migawkę, z której budują się `/plan-zajec`
  i `/plan-zajec/<grupa>`,
- `public/dokumenty/plan-zajec-<grupa>.pdf` — wydruk,
- `public/kalendarz/plan-<grupa>.ics` — kalendarz do subskrypcji.

Jedno pobranie, bo Google publikuje zmiany z opóźnieniem — dwa pobrania
w odstępie sekund potrafią zwrócić różne wersje i strona rozjechałaby się
z PDF-em. Parser (`src/data/plan-zajec.mjs`) ujednolica zapis godzin
(`10:45-11:15` → `10.45–11.15`) i ostrzega w logach o nakładających się
zajęciach.

Gdy arkusz jest niedostępny, zostaje ostatnia migawka zapisana w repo —
awaria Google nie wywala budowania ani nie pokazuje rodzicom pustej tabeli.
W logach builda widać, które źródło zadziałało. Lokalny `npm run build`
odświeża migawkę — warto ją commitować, żeby plan B był aktualny.

Kalendarz to wydarzenia cotygodniowe od 1 września do 31 sierpnia
z wyłączonymi świętami i przerwami z umowy. Daty są
w `src/data/kalendarz-szkolny.mjs` i powtarzają te z
`make-listy-obecnosci.py` — na nowy rok szkolny trzeba zmienić oba pliki.
Kto subskrybuje kalendarz (Google, iPhone), dostaje zmiany planu sam,
z opóźnieniem do doby.

PDF powstaje w Node (pdfkit), nie w Pythonie, bo musi wykonać się na Vercelu
przy każdym wdrożeniu. Fonty Nunito leżą w `scripts/fonty/` i są w repo —
bez nich build na Vercelu nie miałby czym złożyć wydruku.

Przebudowę po edycji arkusza wyzwala Apps Script wpięty w ten arkusz —
`docs/apps-script/plan/Kod.gs`. Czeka trzy minuty od ostatniej zmiany, więc
seria poprawek kończy się jednym buildem, a Google zdąży opublikować nową
wersję CSV (robi to z kilkuminutowym opóźnieniem).

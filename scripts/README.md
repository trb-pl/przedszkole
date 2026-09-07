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

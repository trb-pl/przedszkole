# scripts/

Narzędzia uruchamiane ręcznie, poza buildem strony. Generują pliki, które
trafiają do repo jako gotowe assety — dzięki temu Vercel nie musi mieć
Pythona ani żadnej z tych bibliotek.

| Plik | Co robi | Wynik |
|---|---|---|
| `make-og-image.py` | Karta podglądu linku (WhatsApp, iMessage, Messenger) | `public/og-default.jpg` |
| `przygotuj-fonty.py` | Wycina statyczne odmiany Nunito z pakietu Fontsource | `scripts/fonty/*.ttf` (poza gitem) |
| `make-wzory-pdf.py` | Komplet pustych dokumentów do pobrania ze strony | `public/dokumenty/*.pdf` |

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

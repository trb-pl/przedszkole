# Szablon umowy — jak powstał i jak go odtworzyć

Pliki w tym katalogu służą do wygenerowania szablonu umowy z pól `{{...}}`
i markami wizualnymi. Normalnie nie są potrzebne — szablon istnieje już
jako Dokument Google na Dysku. Przydadzą się, gdy w przyszłości zmieni się
treść umowy i trzeba będzie zbudować szablon od nowa.

## Pliki

| Plik | Do czego |
|---|---|
| `make_template.py` | Wstawia pola `{{...}}` w miejsce kropek w oryginalnej umowie |
| `style_template.py` | Nakłada markę: logo, font Nunito, kolory, kursywa na polach |
| `make_zalacznik2.py` | Buduje Załącznik nr 2 (zgoda na wizerunek) na bazie szablonu umowy |
| `make_szablony.py` | Buduje załączniki 1, 3, 4 i ankietę — marka + pola `{{...}}` |
| `make_powierzenie.py` | Umowa powierzenia danych: przedszkole → TRBK (do podpisu, bez pól) |
| `extract.py` | Wypisuje treść pliku .docx — do sprawdzenia wyniku |
| `logo.png` | Logo przycięte i przeskalowane (1000×247), gotowe do osadzenia |

## Kolejność

```bash
# 1. Pola {{...}} w miejsce kropek
python3 make_template.py            # → Umowa_SZABLON_2026_2027.docx

# 2. Marka: logo, fonty, kolory, kursywa
python3 style_template.py           # → Umowa_SZABLON_2026_2027_brand.docx

# 3. Załącznik nr 2 — dziedziczy logo, fonty i stopkę po szablonie umowy
python3 make_zalacznik2.py          # → Zalacznik2_Wizerunek_SZABLON.docx

# 3b. Załączniki 1, 3, 4 i ankieta — z oryginalnych formularzy przedszkola
python3 make_szablony.py            # → cztery pliki *_SZABLON.docx

# 4. Sprawdzenie
python3 extract.py Umowa_SZABLON_2026_2027_brand.docx
```

`make_template.py` czyta oryginał z `~/Downloads/` — ścieżkę zmienia się
na górze pliku.

## Zastosowana stylistyka

- **Font:** Nunito (dostępny w Dokumentach Google, wizualnie bliski
  markowemu Filson Pro)
- **Tytuł umowy:** granat `#2D346F`, 18 pt, pogrubienie
- **Nagłówki §:** turkus `#34BBA8`, 14 pt, pogrubienie
- **Pola `{{...}}`:** kursywa + granat + pogrubienie — dane z formularza
  odróżniają się w druku od treści umowy
- **Logo:** wyśrodkowane na górze, szerokość ok. 5 cm

## Po wygenerowaniu

1. Wgraj `.docx` na Dysk
2. Otwórz przez **Otwórz za pomocą → Dokumenty Google**
3. Skopiuj ID nowego dokumentu do `CONFIG.ID_SZABLONU_UMOWY` w `Kod.gs`
   (a dla załącznika — do `CONFIG.ID_SZABLONU_ZALACZNIKA`)
4. Wdróż nową wersję skryptu

## Załącznik nr 2 — zgoda na wizerunek

Osobny dokument, drukowany razem z umową. Pola `{{WIZ_*_TAK}}` /
`{{WIZ_*_NIE}}` to komórki tabeli, w które skrypt wstawia `X` zgodnie
z tym, co rodzic zaznaczył w formularzu na stronie. Rodzic tylko podpisuje —
nie zaznacza zgód po raz drugi, więc nie ma rozjazdu między wersją online
a papierem.

Jeśli `ID_SZABLONU_ZALACZNIKA` zostanie puste, załącznik po prostu nie jest
generowany, a umowa powstaje normalnie.

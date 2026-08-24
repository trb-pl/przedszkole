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
| `extract.py` | Wypisuje treść pliku .docx — do sprawdzenia wyniku |
| `logo.png` | Logo przycięte i przeskalowane (1000×247), gotowe do osadzenia |

## Kolejność

```bash
# 1. Pola {{...}} w miejsce kropek
python3 make_template.py            # → Umowa_SZABLON_2026_2027.docx

# 2. Marka: logo, fonty, kolory, kursywa
python3 style_template.py           # → Umowa_SZABLON_2026_2027_brand.docx

# 3. Sprawdzenie
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
4. Wdróż nową wersję skryptu

# Rubryka audytu — instrukcja wykonania

> Ten plik to "mózg" lekkiego skilla. Claude wykonuje te kroki SAM, czytając
> repo (grep/view/find), bez ciężkich skryptów — poza `nap_consistency.py`,
> który jest jedynym skryptem (NAP ręcznie robi się źle).

## Jak Claude prowadzi audyt

Dla każdego obszaru: (1) zbierz dowód z repo, (2) orzeknij z etykietą pewności,
(3) powiąż z celem (leady do września), (4) zaproponuj fix jako diff.

Etykiety pewności — OBOWIĄZKOWE przy każdym findingu:
- `[Potwierdzone]` — widać wprost w kodzie/danych (np. placeholder w pliku).
- `[Prawdopodobne]` — silna przesłanka, brak 100% dowodu (np. canonical na
  domenę, która może nie być podłączona).
- `[Hipoteza]` — wymaga weryfikacji człowieka lub danych spoza repo (np. czy
  zgłoszenia z formularza docierają; czy są opinie do dodania do schema).

Nigdy nie podawaj liczby (wyniku, %), której nie da się wyprowadzić z zebranych
dowodów. Lepiej napisać "nie zmierzono" niż zmyślić.

## Obszary i jak je sprawdzić (kolejność = waga pod leady)

### 1. Konwersja (waga 30%) — najszybsza droga do leadów
Sprawdź w repo:
- Formularz: `grep -rn "web3forms\|access_key\|action=\|fetch(" src/components/`
  — czy jest endpoint, obsługa sukcesu i błędu. KOD to nie wszystko: zawsze dodaj
  `[Hipoteza]` "sprawdź realne dostarczenie maila — to żyje poza repo".
- CTA: czy strona główna i strony lokalizacji mają wyraźne wezwanie ("Zapisz
  dziecko", "Umów wizytę") nad linią załamania. `grep -rn "rekrutacj\|zapisz\|umów" src/components/widgets/`
- Telefon klikalny: `grep -rn 'href="tel:' src/` — na mobile to lead jednym tapem.
- Ścieżka: ile kliknięć od wejścia do zostawienia kontaktu? Im mniej, tym lepiej.

### 2. Local SEO (waga 30%)
- Uruchom: `python3 scripts/nap_consistency.py <repo>` (lub z `--nap nap.json`).
- Strony lokalizacji: czy każda placówka ma osobną podstronę z własnym adresem,
  mapą (`hasMap`/iframe), godzinami. `find src/pages/lokalizacje -type f`
- Link do Google Business Profile / mapy: `grep -rn "google.com/maps\|goo.gl/maps" src/`
- `[Hipoteza]` zawsze: czy GBP jest zweryfikowany i spójny z NAP na stronie
  (to dane spoza repo — zapytaj użytkownika).

### 3. Astro tech (waga 20%)
- Canonical/domena: porównaj `site.site` w `src/config.yaml` z URL-ami w schema
  i z realnym live. Rozjazd = `[Prawdopodobne]` ryzyko (Google indeksuje zły URL).
- robots/indexowanie: `grep -nA2 "robots:" src/config.yaml` — czy `index: true`.
- sitemap: czy `@astrojs/sitemap` jest w `astro.config.*`.
- Meta: czy każda strona ma unikalny `title` i `description`.
  `grep -rn "title:\|description:" src/pages/`
- CWV: NIE da się zmierzyć z repo. Zaproponuj pomiar na żywym URL przez
  PageSpeed Insights (link) i oznacz `[Hipoteza] niezmierzone`.

### 4. GEO / cytowalność w AI (waga 10%)
- FAQ schema: `find src -name "SchemaFAQ*"` — czy strona ma sekcję FAQ z realnymi
  pytaniami rodzica (cena, godziny, wiek, rekrutacja). LLM cytuje konkretne Q&A.
- Czy treść odpowiada wprost na pytania ("Ile kosztuje?", "Od którego roku?")
  zdaniami, które da się zacytować — a nie marketingowym laniem wody.

### 5. Content pod rodzica (waga 10%)
- Czy są odpowiedzi na: cena/czesne, godziny, wiek dzieci, rekrutacja, jadłospis,
  kadra, lokalizacja+dojazd. `grep -rni "czesne\|cena\|godzin\|rekrutacj\|jadłospis" src/`
- Czy treść pochodzi z `content/CONTENT.md` (single source of truth), nie zmyślona.

## Scoring (chain-of-thought, NIE zgadywanie)
Dla każdego obszaru policz: ile pozycji checklisty spełnionych / ile sprawdzanych.
Wynik obszaru = (spełnione / wszystkie) × waga. Suma = wynik ogólny (0–100).
ZAWSZE pokaż rozliczenie (które pozycje spełnione, które nie) — bez tego liczba
jest bezwartościowa. Wynik to środek do celu, nie cel.

## Zakaz rozszerzania zakresu (dla przedszkola)
NIE: programmatic/masowe podstrony, outreach/cold mail, entity SEO/Wikidata,
hreflang. To spam albo przerost formy dla jednej placówki. Jeśli skill trafi do
innego klienta (wielolokalizacyjny), te reguły można poluzować — ale świadomie.

---
name: seo-audit-przedszkole
description: >
  Audyt SEO/GEO strony Kolorowe Przedszkole (Astro + AstroWind), nastawiony na
  realny cel: leady i rekrutacja. Uruchom, gdy Michał prosi o audyt SEO,
  sprawdzenie widoczności, analizę pod kątem zapytań od rodziców, kontrolę
  schema/NAP/Core Web Vitals, ocenę cytowalności w AI (GEO), albo pyta "co
  poprawić na stronie żeby przyszło więcej zapytań". Frazy: "zrób audyt",
  "sprawdź SEO", "dlaczego nie ma ruchu", "popraw widoczność". NIE używaj do
  pisania nowych podstron (add-page), stylowania (styling) ani debugowania kodu.
---

# Audyt SEO/GEO — Kolorowe Przedszkole (wersja lekka)

Jesteś konsultantem SEO/GEO pracującym pod jeden cel biznesowy, nie pod abstrakcyjny
wynik punktowy. Doprowadź stronę do stanu, w którym realnie generuje zapytania
od rodziców.

To jest LEKKI skill: jeden skrypt (`scripts/nap_consistency.py`, bo NAP ręcznie
robi się źle), reszta to audyt, który wykonujesz SAM czytając repo (grep/find/
view) wg `reference/rubryka-audytu.md`. Trzymaj konwencję `.agents/skills/`:
zwięzła instrukcja Markdown, polski w rozmowie, angielski w kodzie/commitach.

## CEL BIZNESOWY (steruje każdą decyzją)
- Twardy cel: 10 leadów + 2 konwersje / mies. do września 2026.
- Sezon: rekrutacja 2026/2027 rozstrzyga się latem (czerwiec–sierpień).
- Strona jest młoda → ruch organiczny przyjdzie raczej na kolejny sezon. Dlatego
  priorytet: kanały działające OD RAZU (Google Business Profile, konwersja
  istniejącego ruchu, spójny NAP). Techniczne SEO/GEO = fundament na potem.
- To NIE generyczny audyt 360. Wagi przechylone w stronę leadów (patrz rubryka).

## KONTEKST (fakty z CLAUDE.md — nie zgaduj)
- Klient: Kolorowe Przedszkole, Warszawa, Saska Kępa, od 1991. Właścicielka: Olga Trębicka.
- NAP (single source of truth):
  - Nazwa: `Kolorowe Przedszkole`
  - Placówki: `Lotaryńska 18, 03-974 Warszawa` + `Zakopiańska 8, 03-934 Warszawa` (OBA kody poprawne)
  - Telefon: `+48 605 657 366` | Email: `przedszkole@kolorowe.eu`
- Stack: Astro 6 + AstroWind + Tailwind v4; SEO: astro-seo, sitemap, JSON-LD.
- Schema już istnieje: `src/components/seo/SchemaOrg.astro` (typ `ChildCare`),
  `SchemaFAQ.astro`, `SchemaBreadcrumbs.astro`.
- Formularz: `src/components/ContactForm.astro` → Web3Forms (cel maila żyje w
  panelu Web3Forms, NIE w repo — zawsze oznacz to jako rzecz do weryfikacji).
- Domena docelowa: `koloroweprzedszkole.com` (sprawdź czy podłączona vs config/live).
- Treść = `content/CONTENT.md`. Nie wymyślaj treści; odwołuj się do tego pliku.

## ZASADY (twarde)
1. Język: rozmowa + raport po polsku; kod/komentarze/commity po angielsku.
2. Najpierw mierz, potem orzekaj. Zero ocen "z głowy" — najpierw dowód z repo.
3. Etykieta pewności przy KAŻDYM findingu: [Potwierdzone]/[Prawdopodobne]/[Hipoteza].
   Nigdy liczby bez pokrycia w danych.
4. Fixy proponujesz jako diff + uzasadnienie + 1 zdanie "co to da dla leadów".
   Michał zatwierdza i commituje sam. NIGDY nie pushuj, nie zakładaj kont, nie wysyłaj maili.
5. Non-programmer friendly: tłumacz "co" i "po co", nie tylko "jak".
6. Zakaz rozszerzania zakresu dla przedszkola: bez programmatic, outreach,
   entity SEO/Wikidata, hreflang.

## PRZEBIEG
1. Ustal tryb: pełny audyt (wszystkie obszary) czy punktowy (np. tylko konwersja).
2. Zbierz dane: uruchom `scripts/nap_consistency.py`, resztę sprawdź wg
   `reference/rubryka-audytu.md` (grep/find/view na repo).
3. Orzeknij z etykietami pewności, policz wynik wg rubryki (z rozliczeniem).
4. Raport Markdown PL: streszczenie dla właścicielki (bez żargonu) → tabela fixów
   wg priorytetu (Impact × Effort) → sekcje per obszar → diffy do zatwierdzenia.
   Zapisz jako `docs/audyt-seo-RRRR-MM-DD.md`. HTML tylko na wyraźną prośbę.

## NAJWAŻNIEJSZE PRZYPOMNIENIE
Najszybszy lead dla lokalnego przedszkola to NIE organic z młodej domeny — to
Google Business Profile + sprawnie działający formularz. Jeśli musisz wybrać, na
czym skupić uwagę użytkownika latem: GBP i dostarczalność formularza, nie ranking.

# CLAUDE.md — Kolorowe Przedszkole

## O mnie (użytkowniku)
- Imię: Michał
- Nie jestem programistą — uczę się Astro/Tailwind/Git od podstaw
- Mówię po polsku, terminy techniczne mogą być po angielsku
- Pracuję na Macu, używam Claude Code w aplikacji Claude Desktop

## Projekt
- Nazwa: Kolorowe Przedszkole (rodzinne przedszkole, Saska Kępa, Warszawa, od 1991)
- Założycielka: Olga Trębicka
- Stack: Astro 6 + Tailwind CSS v4 (template: AstroWind)
- Hosting: Vercel (auto-deploy z main branch)
- Repo: github.com/trb-pl/przedszkole
- Live URL: https://przedszkole-one.vercel.app
- Docelowa domena: koloroweprzedszkole.com (podłączymy w Dniu 5)
- Obecna strona (treści do przeniesienia 1:1): https://koloroweprzedszkole.com

## Design system (FINALNY — nie zmieniaj)
Kolory:
- Kremowy #FCF6F0 — tło główne
- Granatowy #2D346F — nagłówki, tekst
- Turkusowy #34BBA8 — accent, CTA Olgi
- Koralowy #F2795D — warm accent
- Żółty #F5C41F — CTA główne, hover
- Zielony #415D43 — sekcja "Z naturą"

Font: Filson Pro (Adobe Typekit, projekt ID: sni5mcg)
- Link embed: https://use.typekit.net/sni5mcg.css
- font-family: 'filson-pro'
- Polskie znaki: działają (zweryfikowane wcześniej w Webflow)

## Wymagania kluczowe
- Każda sekcja onepage: MIN-H-SCREEN (Tailwind: min-h-screen), normalny scroll
- Animacje: MINIMUM (Astro View Transitions + Tailwind fade-in, BEZ GSAP/Lenis)
- Struktura: hybryda — onepage (Hero + Olga + 4 wartości + 2 lokalizacje + opinie + kontakt) + podstrony /blog, /blog/[slug], /rekrutacja
- Blog: built-in MDX z tagami, kategorią "Aktualności", RSS, sitemap
- SEO: schema.org LocalBusiness + Preschool + EducationalOrganization, astro-seo, sitemap automatyczny

## Treści (1:1 z obecnej strony)
- Hero: "między domem a szkołą od 1991 roku"
- Olga: "Dzień dobry, Wiem że wybór przedszkola..." (list osobisty)
- 4 wartości: Z SERCEM DO DZIECKA / JAK W DOMU / W ŚWIECIE WIEDZY / W ZGODZIE Z NATURĄ
- Lokalizacje: Lotaryńska 18 (1991, dla najmłodszych) + Zakopiańska 8 (1200m² ogród, SI, psycholog)
- Opinie: 4 testimoniale rodziców
- Kontakt: Lotaryńska 18, 03-974 Warszawa, tel +48 605 657 366, mail przedszkole@kolorowe.eu

## Plan migracji (5 dni)
- DZIEŃ 1 [DZIŚ — UKOŃCZONY ✅]: Fork repo, Deploy na Vercel, Instalacja Claude Code lokalnie
- DZIEŃ 2: Design system + Hero
- DZIEŃ 3: Sekcje narracyjne (Olga + 4 wartości)
- DZIEŃ 4: Lokalizacje + opinie + kontakt + blog
- DZIEŃ 5: SEO + GEO + podłączenie domeny

## Jak ze mną pracujesz (OBOWIĄZKOWE zasady)

1. **Jeden krok na raz.** Jedno polecenie, czekasz aż potwierdzę "ok / zrobione" zanim przejdziesz dalej. NIE wyprzedzaj.

2. **Tłumacz DLACZEGO.** Każda decyzja kodowa musi mieć jednozdaniowe uzasadnienie po polsku. Nie zakładaj że rozumiem patterns.

3. **Pokazuj diffy zanim zapiszesz.** Pracujemy z "Accept edits" — chcę widzieć co zmieniasz, zanim zatwierdzę.

4. **NIE rób refaktoringu poza zadaniem.** Jeśli proszę "zmień kolor Hero", nie przerabiaj 5 innych komponentów "przy okazji".

5. **Zachowaj strukturę AstroWind.** Komponenty zostają w src/components/widgets, treść w src/pages/index.astro lub osobnym data file. Nie wymyślaj nowej architektury.

6. **Po polsku.** Komentarze w kodzie zostawiaj po angielsku (standard), ale rozmowa ze mną po polsku.

7. **Gdy nie wiesz — pytaj.** Nie zgaduj. Nie wymyślaj. Lepiej zapytaj 1 pytanie niż zrobić źle.

8. **Pracujemy iteracyjnie z deployem.** Po każdej znaczącej zmianie: `git add . && git commit -m "..." && git push` — Vercel automatycznie zdeployuje, ja zobaczę efekt na żywej stronie.

9. **NIE używaj sudo.** Wszystkie globalne npm są w ~/.npm-global (skonfigurowane).

10. **Status check przed startem każdej sesji.** Gdy zaczynamy nową rozmowę, ZAWSZE najpierw przeczytaj ten plik (CLAUDE.md) i powiedz mi: "Jesteśmy w Dniu X. Status: [krótkie]. Co dziś robimy?"

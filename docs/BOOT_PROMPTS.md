# BOOT PROMPTS — Claude Code

> **Do czego to służy:** Krótki prompt wklejany na start każdej sesji w Claude Code (Claude Desktop → tryb Code → wybrany folder).
> Zmusza Claude'a do diagnozy PRZED akcją. Trzyma się zasady #1 z CLAUDE.md.

---

## 🔧 TEMPLATE UNIWERSALNY

Wklej i podmień `[N]`, `[ETAP]`, `[CEL]`, `[SEKCJA]`:

```
Sesja [N]. Etap [ETAP]. Cel: [CEL].

Przeczytaj w kolejności:
1. CLAUDE.md (root projektu) — w całości
2. content/CONTENT.md — sekcja [SEKCJA]
3. Ostatnie 3 commity: git log -3 --oneline

Następnie odpowiedz mi po polsku:

A) STATUS: gdzie skończyliśmy w poprzedniej sesji (1-2 zdania)
B) PLAN na dziś: 3-5 kroków z dokumentacji
C) PIERWSZA DECYZJA: co konkretnie robimy najpierw + co musisz wiedzieć ode mnie zanim zaczniesz

NIE pisz kodu. NIE rób edytów. Czekaj na moje "ok dalej".
```

---

## 🚀 BOOT — SESJA 2 (gotowy do wklejenia)

> Wklej dokładnie to w Claude Code na początku Sesji 2:

```
Sesja 2. Etap 2B-finish + 2C. Cel: dokończyć Hero (CTA + video mobile) i przejść do nawigacji.

Przeczytaj w kolejności:
1. CLAUDE.md (root projektu) — w całości
2. content/CONTENT.md — sekcje 1 (Hero) i 10 (Meta/SEO)
3. Ostatnie 5 commitów: git log -5 --oneline
4. Aktualny stan src/components/widgets/HeroKolorowe.astro

Z dokumentacji Sesji 1 wiesz że:
- CTA Hero ma być przebudowany (outlined button, kremowy border, hover teal)
- Video mobile (.mp4 ~600KB-1.5MB, bez audio, autoplay+muted+loop+playsinline) trzeba podłączyć po desktop image
- Plik video nazwie się hero-mobile.mp4 i wyląduje w src/assets/videos/ (lub public/videos/)
- .claude/ folder do .gitignore

Odpowiedz mi po polsku:

A) STATUS: stan Hero po Sesji 1 (1-2 zdania)
B) PLAN: 4-6 kroków na dziś, w kolejności
C) PIERWSZA DECYZJA: czy zaczynamy od CTA fix czy od .gitignore + video? Co musisz wiedzieć?

NIE pisz kodu. NIE rób edytów. Czekaj na "ok dalej".
```

---

## 🎯 BOOT — SESJA 3, 4, 5... (do skopiowania i edycji)

### Sesja 3 — Nawigacja

```
Sesja 3. Etap 2C-finish. Cel: nawigacja - logo Kolorowe Przedszkole, menu z 7 anchorami, mobile menu.

Przeczytaj:
1. CLAUDE.md
2. content/CONTENT.md sekcje 1-10 (przeglądnij wszystkie anchory)
3. src/navigation.ts (AstroWind config nawigacji)
4. src/components/widgets/Header.astro

Menu items (final):
- O nas (#olga)
- Kadra (#kadra)
- Wartości (#wartosci)
- Lokalizacje (dropdown: Lotaryńska, Zakopiańska)
- Opinie (#opinie)
- Blog (/blog)
- Kontakt (#kontakt)
CTA: Zadzwoń tel:605657366

Odpowiedz A) STATUS B) PLAN C) PIERWSZA DECYZJA. Bez kodu.
```

### Sesja 4 — Sekcja Olga

```
Sesja 4. Etap 3A. Cel: sekcja Olga.

Przeczytaj:
1. CLAUDE.md
2. content/CONTENT.md SEKCJA 2 — Olga (cały tekst gotowy, NIE wymyślaj)
3. AstroWind Content widget (src/components/widgets/Content.astro)

Asset OlgaT.jpg jeszcze niedostarczony - użyj placeholder do czasu otrzymania.

Odpowiedz A) STATUS B) PLAN C) PIERWSZA DECYZJA. Bez kodu.
```

### Sesja 5 — Sekcja Kadra

```
Sesja 5. Etap 3B. Cel: sekcja Kadra.

Przeczytaj:
1. CLAUDE.md
2. content/CONTENT.md SEKCJA 3 — Kadra
3. Wzorować layout na sekcji Olga (z Sesji 4) — zachować spójność

Odpowiedz A) STATUS B) PLAN C) PIERWSZA DECYZJA. Bez kodu.
```

### Sesja 6 — Wartości

```
Sesja 6. Etap 3C. Cel: 4 bloki wartości (Z sercem / Jak w domu / Wiedza / Natura).

Przeczytaj:
1. CLAUDE.md (sekcja 5 - paleta kolorów)
2. content/CONTENT.md SEKCJA 4 — Wartości (4 podsekcje, kolory tła zaproponowane)

DECYZJA do podjęcia w sesji: czy 4 bloki full-bleed pod sobą (każdy min-h-screen) czy grid 2x2?

Odpowiedz A) STATUS B) PLAN C) PIERWSZA DECYZJA. Bez kodu.
```

### Sesja 7 — Lokalizacje

```
Sesja 7. Etap 4A. Cel: Lotaryńska 18 + Zakopiańska 8 (dwie sekcje, mirror layout).

Przeczytaj:
1. CLAUDE.md
2. content/CONTENT.md SEKCJE 5 i 6

Pattern: jeśli Lotaryńska to image-left/text-right, Zakopiańska to image-right/text-left.
Assety (lotarynska.jpg, zakopianska.jpg) jeszcze niedostarczone — placeholder.

Odpowiedz A) STATUS B) PLAN C) PIERWSZA DECYZJA. Bez kodu.
```

### Sesja 8 — Opinie

```
Sesja 8. Etap 4B. Cel: 4 testimoniale.

Przeczytaj:
1. CLAUDE.md
2. content/CONTENT.md SEKCJA 7 — Opinie (4 cytaty, autorzy, gwiazdki)
3. AstroWind testimonial widget (src/components/widgets/Testimonials.astro)

DECYZJA: grid 2x2 vs slider/carousel? Default: grid (zgodnie z zasadą "minimum animacji").

Odpowiedz A) STATUS B) PLAN C) PIERWSZA DECYZJA. Bez kodu.
```

### Sesja 9 — Kontakt

```
Sesja 9. Etap 4C. Cel: sekcja Kontakt.

Przeczytaj:
1. CLAUDE.md
2. content/CONTENT.md SEKCJA 8 — Kontakt

DECYZJE: 
- Embed Google Maps (iframe) czy statyczna mapka SVG?
- Formularz kontaktowy czy tylko mailto+tel CTA? (Default: mailto + tel, prościej, bez backendu)

Odpowiedz A) STATUS B) PLAN C) PIERWSZA DECYZJA. Bez kodu.
```

### Sesja 10 — Blog

```
Sesja 10. Etap 5A. Cel: blog (struktura, 1 placeholder post).

Przeczytaj:
1. CLAUDE.md
2. content/CONTENT.md SEKCJA 9 — Blog
3. AstroWind blog: src/pages/blog/, src/data/post/

Tasks:
- Wyczyść sample posty AstroWind
- Stwórz 1 placeholder post "Witamy na blogu" (treść w CONTENT.md)
- Sprawdź RSS feed, sitemap blog

Odpowiedz A) STATUS B) PLAN C) PIERWSZA DECYZJA. Bez kodu.
```

### Sesja 11 — SEO/GEO

```
Sesja 11. Etap 5B. Cel: SEO/GEO komplet.

Przeczytaj:
1. CLAUDE.md
2. content/CONTENT.md SEKCJA 10 — Meta/SEO (meta tags + Schema.org JSON-LD)
3. src/layouts/Layout.astro (gdzie wstawić meta + JSON-LD)

Tasks:
- Meta tags (title, description, og:*, twitter:*)
- og:image 1200x630 (do wygenerowania - AI lub Canva)
- Schema.org JSON-LD (Preschool + LocalBusiness, 2 lokalizacje)
- @astrojs/sitemap
- robots.txt

Odpowiedz A) STATUS B) PLAN C) PIERWSZA DECYZJA. Bez kodu.
```

### Sesja 12 — Launch

```
Sesja 12. Etap 5C. Cel: domena + cleanup + launch.

Przeczytaj:
1. CLAUDE.md (sekcja 12 - dług techniczny)
2. Aktualne ustawienia DNS koloroweprzedszkole.com (Michał sprawdzi przed sesją)

Tasks:
- Vercel → Domains → dodaj koloroweprzedszkole.com
- DNS: CNAME @ → cname.vercel-dns.com (Michał robi u rejestratora)
- Lighthouse audit (cel: Perf 90+, SEO 100, A11y 90+, BP 95+)
- Naprawa lint warnings (2/3 → 3/3)
- Final check polskich znaków
- Test mobile (real device)

Odpowiedz A) STATUS B) PLAN C) PIERWSZA DECYZJA. Bez kodu.
```

---

## 📌 NA KONIEC KAŻDEJ SESJI

Wklej:

```
Kończymy sesję. Wygeneruj dokumentację:

1. Utwórz plik: docs/sessions/SESJA-[N]-[YYYY-MM-DD].md
2. Struktura: Cel, Wykonane (z hashami commitów), Niedokończone, Lekcje, TODO na następną sesję
3. Wzoruj się na docs/sessions/SESJA-01-2026-05-14.md
4. Commit i push: "docs: session [N] summary"
```

---

**Wersja:** 1.0 (15.05.2026)

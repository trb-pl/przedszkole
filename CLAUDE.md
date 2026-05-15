# CLAUDE.md — Kolorowe Przedszkole (v2)

> **Brief projektu dla Claude Code.** Czytaj na start każdej sesji. Aktualizowany 15.05.2026.

---

## 1. PROFIL UŻYTKOWNIKA

- **Imię:** Michał
- **Profil:** freelance web developer, non-programmer, uczy się Astro/CLI
- **System:** macOS (Apple Silicon), Terminal/zsh, VS Code
- **Język rozmowy:** **polski**
- **Język kodu / komentarzy / commitów:** **angielski**
- **Workflow narzędziowy:** aplikacja Claude Desktop → tryb Code (graficzny interfejs Claude Code, nie terminal)

---

## 2. PROJEKT

- **Klient:** Kolorowe Przedszkole, Warszawa, Saska Kępa, od 1991
- **Właścicielka:** Olga Trębicka
- **Lokalizacje:** Lotaryńska 18 (03-974) + Zakopiańska 8
- **Telefon:** +48 605 657 366
- **Email:** przedszkole@kolorowe.eu
- **Repo:** `github.com/trb-pl/przedszkole` (Public, SSH `git@github.com:trb-pl/przedszkole.git`)
- **Live:** `przedszkole-one.vercel.app`
- **Live (no-cache):** `przedszkole-git-main-trbk-s-projects.vercel.app`
- **Domena docelowa:** `koloroweprzedszkole.com` (podłączenie w Sesji 12)
- **Lokalnie:** `/Users/michal/Projekty/przedszkole`

---

## 3. STACK

| Warstwa            | Technologia                                                       |
| ------------------ | ----------------------------------------------------------------- |
| Framework          | Astro 6                                                           |
| Template bazowy    | AstroWind (free, MIT)                                             |
| Styling            | Tailwind CSS v4 (CSS-first `@theme` w `tailwind.css`)             |
| Hosting            | Vercel (Hobby, free) — team: `TRBK's projects`                    |
| Repo               | GitHub (SSH)                                                      |
| Fonty              | Adobe Typekit (project `sni5mcg`) — Filson Pro + Filson Soft      |
| Blog               | Built-in MDX z AstroWind                                          |
| Animacje           | View Transitions + Tailwind transitions (BEZ GSAP/Lenis)          |
| SEO                | astro-seo, sitemap, schema.org JSON-LD                            |

---

## 4. ŚWIADOME DECYZJE PROJEKTOWE (NIE ROZWAŻAĆ PONOWNIE)

- ❌ **NIE WordPress / Webflow / Framer** — zdecydowano migrację na Astro (powody: szybkość, SEO, kontrola)
- ❌ **NIE Lovable** — Lovable pcha React do `.astro`, nieoptymalne
- ❌ **NIE GSAP / Lenis** — animacje minimalne, statyczna strona contentowa
- ❌ **NIE snap scroll / 100vh strict** — wybrano `min-h-screen` + normalny scroll
- ❌ **NIE custom Hero AstroWind** — własny `HeroKolorowe.astro`
- ❌ **NIE Tailwind config JS** — Tailwind v4 = CSS-first `@theme`
- ✅ **Onepage hybryda** — strona główna jako single page z anchorami, + osobne `/blog` i `/blog/[slug]` (od Sesji 10)

---

## 5. PALETA KOLORÓW (FINALNA)

| Nazwa     | HEX       | Tailwind class   | Zastosowanie                                  |
| --------- | --------- | ---------------- | --------------------------------------------- |
| Kremowy   | `#FCF6F0` | `brand-cream`    | Tło główne, tekst na ciemnym                  |
| Granatowy | `#2D346F` | `brand-navy`     | Nagłówki, tekst body                          |
| Turkusowy | `#34BBA8` | `brand-teal`     | Sekcja "W świecie wiedzy", hover Hero CTA     |
| Koralowy  | `#F2795D` | `brand-coral`    | Sekcja "Z sercem do dziecka"                  |
| Żółty     | `#F5C41F` | `brand-yellow`   | Sekcja "Jak w domu", możliwe CTA              |
| Zielony   | `#415D43` | `brand-forest`   | Sekcja "W zgodzie z naturą"                   |

Tokeny w `src/assets/styles/tailwind.css` w bloku `@theme`.

---

## 6. STRUKTURA SEKCJI STRONY (mapping)

| Sekcja | Anchor          | Plik                                              | Status     |
| ------ | --------------- | ------------------------------------------------- | ---------- |
| Hero   | `#hero` (start) | `src/components/widgets/HeroKolorowe.astro`       | 🔶 w toku  |
| Olga   | `#olga`         | `src/components/widgets/SekcjaOlga.astro`         | ❌ TODO    |
| Kadra  | `#kadra`        | `src/components/widgets/SekcjaKadra.astro`        | ❌ TODO    |
| Wartości | `#wartosci`   | `src/components/widgets/SekcjaWartosci.astro`     | ❌ TODO    |
| Lotaryńska | `#lotarynska` | `src/components/widgets/SekcjaLotarynska.astro` | ❌ TODO    |
| Zakopiańska | `#zakopianska` | `src/components/widgets/SekcjaZakopianska.astro` | ❌ TODO  |
| Opinie | `#opinie`       | `src/components/widgets/SekcjaOpinie.astro`       | ❌ TODO    |
| Kontakt | `#kontakt`     | `src/components/widgets/SekcjaKontakt.astro`      | ❌ TODO    |
| Blog list | `/blog`       | `src/pages/blog/index.astro`                      | ❌ TODO    |
| Blog post | `/blog/[slug]` | `src/pages/blog/[...slug].astro`                 | ❌ TODO    |

Strona główna `src/pages/index.astro` importuje wszystkie sekcje w kolejności.

---

## 7. CONTENT — SINGLE SOURCE OF TRUTH

> **WAŻNE:** Cała treść strony jest w pliku **`content/CONTENT.md`** (w repo) oraz w Knowledge Base projektu na claude.ai.
>
> **Zasady:**
> - **KOPIUJ teksty 1:1 z CONTENT.md** do komponentów `.astro`. NIE parafrazuj, NIE skracaj, NIE wymyślaj.
> - Jeśli widzisz w body tekst po polsku — to jest finalny, zatwierdzony tekst.
> - Jeśli czegoś nie ma w CONTENT.md — STOP i zapytaj Michała.
> - Wszystkie poprawki vs oryginał są oznaczone `[POPRAWKA]` w CONTENT.md i już zatwierdzone.

---

## 8. 10 ZASAD WSPÓŁPRACY (NIE NEGOCJOWALNE)

1. **Jeden krok na raz.** Jedno polecenie, czekaj na potwierdzenie (screenshot / "ok" / "dalej").
2. **Tłumacz DLACZEGO.** Każda decyzja kodowa = jedno zdanie uzasadnienia po polsku.
3. **Pokazuj diffy zanim zapiszesz.** Tryb "Accept edits" — chcę widzieć zmiany.
4. **NIE rób refaktoringu poza zadaniem.** "Zmień kolor Hero" ≠ przerabiaj 5 innych komponentów.
5. **Zachowaj strukturę AstroWind.** Komponenty w `src/components/widgets/`, treść w `src/pages/index.astro`.
6. **Po polsku w rozmowie. Po angielsku w kodzie i commitach.**
7. **Gdy nie wiesz — pytaj.** Lepiej 1 pytanie niż zrobić źle.
8. **Pracujemy iteracyjnie z deployem.** `git add . && git commit -m "..." && git push` po każdej znaczącej zmianie.
9. **NIE używaj `sudo`.** Globalne npm w `~/.npm-global` (skonfigurowane).
10. **Status check na start.** Każdą sesję zaczynaj od: "Status: gdzie skończyliśmy. Plan: 3-5 kroków. Pierwsza decyzja: ...".

---

## 9. ASSET WORKFLOW (LEKCJA Z SESJI 1)

> **Pattern asset → git:** Każdy nowy plik (zdjęcie, SVG, video, MP4, PDF) musi być **osobno** dodany do gita PRZED commitem.

**Złoty workflow przy dodawaniu nowego assetu:**

```bash
# 1. Wrzuć plik fizycznie do folderu
cp ~/Downloads/zdjecie.jpg src/assets/images/

# 2. Sprawdź czy git widzi nowy plik
git status

# 3. Dodaj wszystko (assety + edytowane pliki) razem
git add src/assets/images/zdjecie.jpg src/components/widgets/...

# 4. Commit + push
git commit -m "feat(olga): add Olga portrait image"
git push origin main
```

**NIGDY:** `git commit -am ...` na pierwszym commit'cie z nowym plikiem (nie wciąga untracked).

**Sprawdzenie po deployu:** otwórz Vercel → Deployments → najnowszy → Status `Ready`. Jeśli `Error` — sprawdź logi pod kątem `failed to resolve import` (= brakujący plik w gicie).

---

## 10. PLAN ETAPÓW (mapa sesji)

| Sesja | Etap        | Zakres                                                          |
| ----- | ----------- | --------------------------------------------------------------- |
| 1 ✅  | 1 + 2A + 2B | Setup, design system, Hero (90%)                                |
| 2 🔶  | 2B-finish + 2C | CTA Hero + video mobile + nawigacja                          |
| 3     | 2C-finish   | Nawigacja, mobile menu, logo                                    |
| 4     | 3A          | Sekcja Olga                                                     |
| 5     | 3B          | Sekcja Kadra                                                    |
| 6     | 3C          | Wartości (4 bloki kolorowe)                                     |
| 7     | 4A          | Lokalizacje (Lotaryńska + Zakopiańska)                          |
| 8     | 4B          | Opinie                                                          |
| 9     | 4C          | Kontakt                                                         |
| 10    | 5A          | Blog (struktura + 1 placeholder post)                           |
| 11    | 5B          | SEO/GEO, Schema.org, sitemap, OG image                          |
| 12    | 5C          | Domena, Lighthouse, cleanup, launch                             |

---

## 11. MODEL DEFAULT

- **Claude Code:** Sonnet 4.6 · Medium (default, 90% zadań)
- **Eskalacja do Opus 4.7:** złożone refaktoringi wieloplikowe, audyt SEO, debug Vite/Astro buildów
- **Rozmowa strategiczna (claude.ai):** Opus 4.7 (Meta-Mentor project)

---

## 12. TODO TECHNICZNE (DŁUG)

- [ ] `.claude/` folder → dodać do `.gitignore`
- [ ] Lint warnings GitHub Actions (`2/3`) — Biome/Prettier formatting, rozwiązać po Sesji 12
- [ ] Sprzątanie nieużywanych AstroWind widgetów po wymianie sekcji
- [ ] Archiwizacja zgód RODO (rodzice + Olga) jako PDF w Drive klienta — link w komentarzu CLAUDE.md

---

**Ostatnia aktualizacja:** 15.05.2026 (Sesja 2 — start)

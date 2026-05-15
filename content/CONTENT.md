# CONTENT.md — Kolorowe Przedszkole

> **Single source of truth dla treści strony.**
> Claude Code: KOPIUJ z tego pliku do komponentów `.astro`. NIE wymyślaj tekstów. NIE parafrazuj. Tylko 1:1.
> Źródło: koloroweprzedszkole.com (fetch 14.05.2026) + drobne poprawki typograficzne i literówki (oznaczone `[POPRAWKA]`).

---

## SPIS SEKCJI

1. [Hero](#sekcja-1--hero)
2. [Olga](#sekcja-2--olga-olga)
3. [Kadra](#sekcja-3--kadra-kadra)
4. [Wartości](#sekcja-4--wartości-wartosci)
5. [Lotaryńska 18](#sekcja-5--lotaryńska-18-lotarynska)
6. [Zakopiańska 8](#sekcja-6--zakopiańska-8-zakopianska)
7. [Opinie](#sekcja-7--opinie-opinie)
8. [Kontakt](#sekcja-8--kontakt-kontakt)
9. [Blog (struktura)](#sekcja-9--blog-struktura)
10. [Meta / SEO](#sekcja-10--meta--seo)

---

## SEKCJA 1 — HERO

**Anchor:** `#hero` (lub start strony — nie wymagany)
**Plik:** `src/components/widgets/HeroKolorowe.astro` (już istnieje, Etap 2B)

### Elementy

| Element        | Treść                                                              |
| -------------- | ------------------------------------------------------------------ |
| SVG wordmark   | `kolorowe.svg` (inline, `?raw`)                                    |
| H1             | `PRZEDSZKOLE`                                                      |
| Tagline        | `między domem a szkołą od 1991 roku`                               |
| Sub-tagline    | `od 1991 · Saska Kępa · Warszawa`                                  |
| CTA            | `POZNAJ NAS` → `#olga`                                             |
| Background DT  | `hero-koloroweprzedszkole.jpg`                                     |
| Background MOB | `hero-mobile.mp4` (autoplay, muted, loop, playsinline)             |

> **Uwaga:** oryginalna strona ma "Poznaj nas" → `#section1`. Mapujemy `#section1` → `#olga` (nasza nowa konwencja anchor names).

---

## SEKCJA 2 — OLGA (`#olga`)

**Plik:** `src/components/widgets/SekcjaOlga.astro` (do utworzenia w Sesji 4)
**Layout:** Content widget z AstroWind — split 40/60 (zdjęcie Olgi po lewej, tekst po prawej) lub odwrotnie.
**Asset:** `OlgaT.jpg` (do zdobycia od klientki — TODO)

### H1

```
Dzień dobry,
```

### Body

```
Wiem, że wybór przedszkola to niełatwa decyzja.
W 1991 roku ja również szukałam wyjątkowego miejsca dla mojego dziecka. Postanowiłam je stworzyć sama, od tego czasu każdego roku, razem z mężem i córką, otwieramy drzwi naszego domu dla wielu rodzin.

Serdecznie Zapraszam,
Olga Trębicka
```

> **Uwaga renderowania:** `Serdecznie Zapraszam,` i `Olga Trębicka` powinny być w osobnym akapicie (signature block, kursywa lub Filson Soft).

### CTA

```html
<a href="tel:605657366">Zadzwoń</a>
```

---

## SEKCJA 3 — KADRA (`#kadra`)

**Plik:** `src/components/widgets/SekcjaKadra.astro` (Sesja 5)
**Layout:** Full-width content lub Content widget. Opcjonalnie: zdjęcia kadry jako grid w dolnej części sekcji (TODO assets).

### H1

```
Siła pokoleń,
```

### Body

```
Dobór kadry to jedno z najważniejszych zadań w prowadzeniu przedszkola.
Od początku wiedziałam, że to ludzie tworzą atmosferę miejsca – ich podejście, obecność, sposób, w jaki słuchają dzieci i są obok nich na co dzień.

Wielu z nas pracuje tu od lat. Dzięki tej ciągłości dzieci czują się bezpiecznie, znają swoje rytuały i tych samych, życzliwych dorosłych, którzy są z nimi każdego dnia.

To **wspólna misja trwająca od pokoleń**.
```

> **[POPRAWKA TYPOGRAFICZNA]:** dodano półpauzę `–` po "atmosferę miejsca" (oryginał: zwykła spacja, brak interpunkcji — odczytuje się jak literówka).

### CTA

```html
<a href="tel:605657366">ZADZWOŃ</a>
```

> Oryginał ma CAPS — zachowujemy.

---

## SEKCJA 4 — WARTOŚCI (`#wartosci`)

**Plik:** `src/components/widgets/SekcjaWartosci.astro` (Sesja 6)
**Layout:** 4 bloki full-bleed jeden pod drugim (każdy `min-h-screen` lub `min-h-[80vh]`), każdy w innym kolorze tła. Decyzja design w Sesji 6.

### Mapping kolorów (PROPOZYCJA — do zatwierdzenia w Sesji 6)

| # | Wartość | Tło | Tekst |
| - | ------- | --- | ----- |
| 1 | Z SERCEM DO DZIECKA | `bg-brand-coral` (#F2795D) | `text-brand-cream` |
| 2 | JAK W DOMU | `bg-brand-yellow` (#F5C41F) | `text-brand-navy` |
| 3 | W ŚWIECIE WIEDZY | `bg-brand-teal` (#34BBA8) | `text-brand-cream` |
| 4 | W ZGODZIE Z NATURĄ | `bg-brand-forest` (#415D43) | `text-brand-cream` |

### 4.1 Z SERCEM DO DZIECKA

**H2:** `Z SERCEM DO DZIECKA`

**Body:**

```
Uczymy nazywać i wyrażać emocje, szanując indywidualność każdego malucha. Wspieramy samodzielność i odpowiedzialność poprzez podejmowanie decyzji adekwatnych do wieku. Nasz zespół pedagogów stale się rozwija, by mądrze towarzyszyć dzieciom i rodzicom w zmieniającym się świecie.
```

### 4.2 JAK W DOMU

**H2:** `JAK W DOMU`

**Body:**

```
Tworzymy kameralne grupy, dopasowane do tempa rozwoju i potrzeb dzieci. Dbamy o przestrzeń na swobodną zabawę i odpoczynek, ceniąc wartość nudy i spontaniczności. Nasze przedszkole działa w sercu Saskiej Kępy, a rodzinne ciepło i bezpieczeństwo budujemy razem z dziećmi i ich bliskimi.
```

### 4.3 W ŚWIECIE WIEDZY

**H2:** `W ŚWIECIE WIEDZY`

**Body:**

```
Inspirujemy się metodami Montessori, Steinera, Korczaka i Pikler, tworząc nowoczesne podejście do pracy z dziećmi. Rozwijamy kreatywność przez sztukę – malowanie, śpiew, taniec oraz wizyty w teatrze i na koncertach. Języki obce (angielski i niemiecki) towarzyszą dzieciom codziennie w naturalny sposób. Realizujemy podstawę programową, wspierając indywidualne talenty bez uśredniania tempa rozwoju.
```

> **[POPRAWKA TYPOGRAFICZNA]:** `sztukę malowanie` → `sztukę – malowanie` (półpauza, oryginał: brak interpunkcji).

### 4.4 W ZGODZIE Z NATURĄ

**H2:** `W ZGODZIE Z NATURĄ`

**Body:**

```
Dbamy o ogródek warzywny i wspólnie gotujemy z jego plonów. Jemy zdrowo i lokalnie, a wszystkie posiłki przygotowujemy na miejscu z ekologicznych produktów. Spędzamy dużo czasu na świeżym powietrzu, bawiąc się wodą, chodząc boso po trawie i wspinając się na drzewa, niezależnie od pogody. Dbamy też o sprawność fizyczną – jeździmy na basen, gramy w piłkę, ćwiczymy gimnastykę i korzystamy z naszej sali do integracji sensorycznej.
```

> **[POPRAWKA TYPOGRAFICZNA]:** `sprawność fizyczną ? jeździmy` → `sprawność fizyczną – jeździmy` (oryginał: znak zapytania, ewidentny błąd kodowania).

---

## SEKCJA 5 — LOTARYŃSKA 18 (`#lotarynska`)

**Plik:** `src/components/widgets/SekcjaLotarynska.astro` (Sesja 7)
**Layout:** Content split (zdjęcie + tekst) lub full-bleed z overlay. Decyzja w Sesji 7.
**Asset:** zdjęcie Lotaryńska 18 (TODO)

### H1

```
Lotaryńska 18
```

### Subhead

```
Prawdziwie domowe przedszkole.
```

### Body

```
Rodzinny dom Cioci Oli i wujka Tomka, to tu w 1991 roku powstało Kolorowe Przedszkole. Ciepło domowego ogniska sprawia, że najmłodsze dzieci czują się tu bardzo bezpiecznie i komfortowo.
```

### CTA

```html
<a href="tel:605657366">Zadzwoń</a>
```

---

## SEKCJA 6 — ZAKOPIAŃSKA 8 (`#zakopianska`)

**Plik:** `src/components/widgets/SekcjaZakopianska.astro` (Sesja 7)
**Layout:** mirror sekcji Lotaryńska (zachowanie symetrii: jeśli Lotaryńska to image-left, Zakopiańska to image-right).
**Asset:** zdjęcie Zakopiańska 8 (TODO)

### H1

```
Zakopiańska 8
```

### Subhead

```
Zaczarowany ogród.
```

### Body

```
Willa w sercu Saskiej Kępy z gigantycznym ogrodem to istny raj dla starszej grupy. Do dyspozycji dzieci ponad 1200m² placu zabaw, przestronne i widne sale, sala do zajęć Integracji Sensorycznej (SI), oraz gabinet psychologiczno-logopedyczny.
```

> **[POPRAWKA TYPOGRAFICZNA]:** `1200m2` → `1200m²` (symbol kwadratu), `psychologiczno- logopedyczny` → `psychologiczno-logopedyczny` (usunięta nadmiarowa spacja).

### CTA

```html
<a href="tel:605657366">Zadzwoń</a>
```

---

## SEKCJA 7 — OPINIE (`#opinie`)

**Plik:** `src/components/widgets/SekcjaOpinie.astro` (Sesja 8)
**Layout:** 4 cardy w grid (2x2 desktop, 1x4 mobile) lub testimonial carousel. Decyzja w Sesji 8.

### 7.1 Paulina (mama Zosi)

**Rating:** ★★★★★

**Treść:**

```
Za co kocham przedszkole? Za wszystkich nauczycieli i pracowników, zabawy na powietrzu przy każdej pogodzie, odpowiedni balans pomiędzy zabawą a nauką, za kreatywne prace plastyczne które dziecko każdego dnia przynosi do domu, oraz za wzruszające i wspaniałe uroczystości na Boże Narodzenie, oraz Zakończenie Roku.
```

**Autor:** `Paulina` ← **[POPRAWKA LITERÓWKI]** (oryginał: `Pulina` — najprawdopodobniej błąd; do potwierdzenia z klientką w Sesji 12 przed launchem)
**Podpis:** `Mama Zosi`

> **[POPRAWKA TYPOGRAFICZNA]:** `pracowniko<>w` → `pracowników` (oryginał: brak polskich znaków lokalnie). Usunięto cudzysłowy zewnętrzne — w komponencie testimonial powinny być wizualne (CSS).

### 7.2 Gosia (mama Kasi)

**Rating:** ★★★★★

**Treść:**

```
Jestem zachwycona poziomem opieki w Kolorowym Przedszkolu. Nauczyciele tworzą ciepłą, bezpieczną przestrzeń, w której dzieci mogą eksplorować świat. Program edukacyjny jest doskonale zbalansowany, łącząc naukę z zabawą. Moja córka codziennie wraca do domu pełna nowych doświadczeń i z uśmiechem na twarzy.
```

**Autor:** `Gosia`
**Podpis:** `Mama Kasi`

### 7.3 Michał (tata Antka)

**Rating:** ★★★★★

**Treść:**

```
Wybór Kolorowego Przedszkola to najlepsza decyzja, jaką podjęliśmy dla naszego syna. Bogactwo zajęć artystycznych, sportowych i językowych zachwyca nas każdego dnia. Szczególnie cenimy sobie regularną komunikację z wychowawcami oraz czyste, przestronne i inspirujące otoczenie, które sprzyja harmonijnemu rozwojowi dzieci.
```

**Autor:** `Michał`
**Podpis:** `Tata Antka`

### 7.4 Marzena (mama Asi)

**Rating:** ★★★★★

**Treść:**

```
Kolorowe Przedszkole wyróżnia się nowoczesnym podejściem do edukacji wczesnoszkolnej. Doceniam szczególnie małe grupy, które pozwalają na indywidualne traktowanie każdego dziecka. Nauczyciele są wyjątkowo cierpliwi i kreatywni, a różnorodność zajęć dodatkowych sprawia, że dzieci z radością uczestniczą w codziennych aktywnościach.
```

**Autor:** `Marzena`
**Podpis:** `Mama Asi`

---

## SEKCJA 8 — KONTAKT (`#kontakt`)

**Plik:** `src/components/widgets/SekcjaKontakt.astro` (Sesja 9)
**Layout:** Dwie kolumny — adres/dane + mapka Google Maps (embed) LUB formularz kontaktowy. Decyzja w Sesji 9.

### Dane

```
Kolorowe Przedszkole
ul. Lotaryńska 18
03-974 Warszawa

+48 605-657-366
przedszkole@kolorowe.eu
```

### CTA

```html
<a href="tel:605657366">Zadzwoń</a>
<a href="mailto:przedszkole@kolorowe.eu">Napisz</a>
```

> Drugi CTA `Napisz` to dodatek vs oryginał (oryginał: tylko Zadzwoń). Decyzja design w Sesji 9.

---

## SEKCJA 9 — BLOG (struktura)

**Pliki (Sesja 10):**
- `src/pages/blog/index.astro` — lista postów
- `src/pages/blog/[...slug].astro` — pojedynczy post
- `src/content/post/.gitkeep` — pusty folder na MDX posty (AstroWind już ma `src/data/post/`)
- 1 placeholder post: `src/data/post/witamy-na-blogu.md`

### Placeholder post (Sesja 10)

```yaml
---
publishDate: 2026-05-20T00:00:00Z
title: Witamy na naszym blogu
excerpt: Wkrótce znajdziesz tu artykuły o życiu Kolorowego Przedszkola, wydarzeniach, projektach dzieci i naszej codzienności.
image: ~/assets/images/hero-koloroweprzedszkole.jpg
category: Aktualności
tags:
  - aktualnosci
metadata:
  canonical: https://koloroweprzedszkole.com/blog/witamy
---

# Witamy na naszym blogu

Wkrótce znajdziesz tutaj artykuły, fotorelacje i ważne informacje.
```

> Treść bloga (właściwe posty) — **NIE w MVP**. Klientka dostarczy później.

---

## SEKCJA 10 — META / SEO

**Plik:** `src/layouts/Layout.astro` + `astro.config.ts`

### Meta tags (oryginał + ulepszenia)

| Tag                | Wartość                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `<title>`          | `Kolorowe Przedszkole \| Warszawa Saska Kępa \| od 1991`                                                 |
| `meta description` | `Rodzinne przedszkole na Saskiej Kępie w Warszawie. Domowa atmosfera dla dzieci 2,5–6 lat. Od 1991 roku. Dwie lokalizacje. Zapisz dziecko już dziś!` |
| `og:locale`        | `pl_PL` ← **[POPRAWKA]** (oryginał ma błędne `en_US`)                                                    |
| `og:title`         | jak `<title>`                                                                                            |
| `og:description`   | jak `meta description`                                                                                   |
| `og:image`         | `/og-image.jpg` (1200×630, do wygenerowania w Sesji 11)                                                  |
| `og:url`           | `https://koloroweprzedszkole.com/`                                                                       |
| `og:type`          | `website`                                                                                                |
| `twitter:card`     | `summary_large_image`                                                                                    |
| `lang`             | `pl`                                                                                                     |

### Schema.org (Sesja 11)

JSON-LD w `<head>`:

```json
{
  "@context": "https://schema.org",
  "@type": ["Preschool", "EducationalOrganization", "LocalBusiness"],
  "name": "Kolorowe Przedszkole",
  "url": "https://koloroweprzedszkole.com",
  "logo": "https://koloroweprzedszkole.com/logo.png",
  "telephone": "+48-605-657-366",
  "email": "przedszkole@kolorowe.eu",
  "foundingDate": "1991",
  "address": [
    {
      "@type": "PostalAddress",
      "streetAddress": "Lotaryńska 18",
      "addressLocality": "Warszawa",
      "postalCode": "03-974",
      "addressCountry": "PL"
    },
    {
      "@type": "PostalAddress",
      "streetAddress": "Zakopiańska 8",
      "addressLocality": "Warszawa",
      "addressCountry": "PL"
    }
  ],
  "areaServed": {
    "@type": "Place",
    "name": "Saska Kępa, Warszawa"
  }
}
```

---

## LISTA POPRAWEK vs ORYGINAŁ (zatwierdzonych)

1. ✅ `Pulina` → `Paulina` (testimonial #1, sekcja 7.1)
2. ✅ `?` → `–` (sekcja 4.4 Z naturą, "sprawność fizyczną – jeździmy")
3. ✅ `sztukę malowanie` → `sztukę – malowanie` (sekcja 4.3 Wiedza)
4. ✅ `miejsca ich` → `miejsca – ich` (sekcja 3 Kadra)
5. ✅ `1200m2` → `1200m²` (sekcja 6 Zakopiańska)
6. ✅ `psychologiczno- logopedyczny` → `psychologiczno-logopedyczny` (sekcja 6)
7. ✅ `og:locale en_US` → `pl_PL` (meta)

---

## TODO ASSETS (do zdobycia od klientki)

- [ ] `OlgaT.jpg` — portret Olgi Trębickiej (sekcja 2)
- [ ] Zdjęcie zespołu / kadry (sekcja 3, opcjonalne)
- [ ] `lotarynska.jpg` — zdjęcie budynku Lotaryńska 18 (sekcja 5)
- [ ] `zakopianska.jpg` — zdjęcie budynku/ogrodu Zakopiańska 8 (sekcja 6)
- [ ] `hero-mobile.mp4` — skompresowany video Hero mobile (Sesja 2, blok HandBrake)
- [ ] `og-image.jpg` — 1200×630 Open Graph image (Sesja 11)

---

**Wersja:** 1.0 (15.05.2026)
**Zmiany:** Update tego pliku = update CONTENT.md w repo + Knowledge Base claude.ai (oba miejsca).

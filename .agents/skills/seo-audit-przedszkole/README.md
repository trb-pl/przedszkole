# Skill: seo-audit-przedszkole

Lekki audyt SEO/GEO strony Kolorowe Przedszkole (Astro + AstroWind),
nastawiony na realny cel: leady i rekrutacja — nie abstrakcyjny wynik punktowy.

## Co to robi
Claude czyta Twoje repo i sprawdza 5 obszarów (konwersja, local SEO, technika
Astro, GEO/cytowalność w AI, treść pod rodzica), wystawia findingi z etykietą
pewności ([Potwierdzone]/[Prawdopodobne]/[Hipoteza]) i proponuje konkretne
poprawki w plikach .astro jako diffy — które zatwierdzasz i commitujesz SAM.

## Instalacja (Claude Code / tryb Code w aplikacji)
1. Skopiuj folder `seo-audit-przedszkole/` do skilli swojego projektu.
   W tym repo skille żyją w `.agents/skills/` — możesz wrzucić tam, albo do
   `~/.claude/skills/` jeśli chcesz mieć globalnie.
2. Zrestartuj sesję Claude Code.
3. Napisz np.: "zrób audyt SEO strony przedszkola" — skill sam się uruchomi.

## Jak uruchomić sam skrypt NAP (opcjonalnie, ręcznie)
W terminalu, w katalogu repo:

    python3 .agents/skills/seo-audit-przedszkole/scripts/nap_consistency.py . \
        --nap .agents/skills/seo-audit-przedszkole/scripts/nap.json

(Sprawdza, czy nazwa/telefon/email/kody pocztowe są spójne w całym repo.)

## Pod innego klienta
Skrypt NAP jest uniwersalny — podmień `nap.json` na dane innego klienta i
działa. Reguły "zakaz programmatic/outreach" w rubryce są pod jedną placówkę;
dla klienta wielolokalizacyjnego możesz je świadomie poluzować.

## Czego skill NIE robi
Nie pushuje do gita. Nie zakłada kont (GBP, Search Console). Nie wysyła maili.
Nie generuje masowych podstron. Nie podaje liczb bez pokrycia w danych.

# -*- coding: utf-8 -*-
"""Plan zajęć jako PDF do pobrania ze strony (public/dokumenty/).

Godziny czyta z src/data/plan-zajec.ts — tego samego pliku, który zasila
podstronę /plan-zajec. Jedno źródło, więc wydruk na lodówce nie może
pokazywać innej godziny niż strona.

Uruchamianie:
    ./venv/bin/python scripts/make-plan-zajec-pdf.py
"""

import os
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as canvas_mod

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTY = os.path.join(ROOT, 'scripts/fonty')
LOGO = os.path.join(ROOT, 'docs/apps-script/szablon/logo.png')
ZRODLO = os.path.join(ROOT, 'src/data/plan-zajec.ts')
WYNIK = os.path.join(ROOT, 'public/dokumenty/plan-zajec-2026-2027.pdf')

GRANAT = colors.HexColor('#2D346F')
TURKUS = colors.HexColor('#34BBA8')
LINIA = colors.HexColor('#D5D7E3')
PASEK = colors.HexColor('#F7F5F2')
KAFEL = colors.HexColor('#E4F5F1')   # tło godziny — turkus rozjaśniony
SZARY = colors.HexColor('#8B8FA8')

for wariant in ('Regular', 'Bold', 'Italic'):
    pdfmetrics.registerFont(TTFont('Nunito-' + wariant, os.path.join(FONTY, 'Nunito-%s.ttf' % wariant)))


def wczytaj_plan():
    """Wyciąga dane z pliku TypeScript.

    Parser zamiast importu: plik jest źródłem dla Astro i nie ma powodu,
    żeby duplikować go w JSON tylko dla tego skryptu. Struktura jest na
    tyle prosta i stabilna, że wystarczy wyrażenie regularne.
    """
    tekst = open(ZRODLO, encoding='utf-8').read()

    rok = re.search(r"ROK_SZKOLNY = '([^']+)'", tekst).group(1)
    dni = re.findall(r"'([a-ząćęłńóśźż]+)'", re.search(r'export const DNI = \[(.*?)\]', tekst, re.S).group(1))

    # Bloki dzielimy po wcięciu zamykającym wpis, a nie po „{ nazwa:" —
    # komentarz nad polem `nazwa` odciął kiedyś cały wiersz od PDF-a, i to
    # bez żadnego błędu, bo parser po prostu go nie dopasował.
    plan = []
    ciało = re.search(r'export const PLAN: Zajecia\[\] = \[(.*)\n\];', tekst, re.S).group(1)
    for blok in re.split(r'\n  \},', ciało):
        if 'nazwa:' not in blok:
            continue
        nazwa = re.search(r"nazwa: '([^']+)'", blok).group(1)
        opis = re.search(r"opis: '([^']+)'", blok)
        terminy = dict(re.findall(r"(\w+): '([^']+)'",
                                  re.search(r'terminy: \{(.*?)\}', blok, re.S).group(1)))
        plan.append({'nazwa': nazwa, 'opis': opis.group(1) if opis else None, 'terminy': terminy})

    # Liczba wpisów musi zgadzać się z liczbą pól `nazwa` w pliku źródłowym.
    # Bez tego cicha zmiana formatowania danych znów zjadłaby wiersz.
    oczekiwane = len(re.findall(r'^    nazwa:', tekst, re.M))
    if len(plan) != oczekiwane:
        raise SystemExit('Odczytano %d zajęć, a w pliku jest %d — sprawdź parser.'
                         % (len(plan), oczekiwane))

    return rok, dni, plan


def rysuj(c, rok, dni, plan):
    szer, wys = landscape(A4)
    margines = 15 * mm

    z_planem = [z for z in plan if z['terminy']]
    bez_terminu = [z for z in plan if not z['terminy']]

    # ── Nagłówek ────────────────────────────────────────────────────────
    if os.path.exists(LOGO):
        c.drawImage(LOGO, margines, wys - 20 * mm, width=38 * mm,
                    height=38 * mm * 247 / 1000, mask='auto')

    c.setFont('Nunito-Bold', 17)
    c.setFillColor(GRANAT)
    c.drawCentredString(szer / 2, wys - 16 * mm, 'PLAN ZAJĘĆ')

    c.setFont('Nunito-Bold', 11)
    c.setFillColor(TURKUS)
    c.drawCentredString(szer / 2, wys - 22 * mm, 'rok szkolny ' + rok)

    # ── Wymiary tabeli ──────────────────────────────────────────────────
    gora = wys - 32 * mm
    kol_nazwy = 62 * mm
    szer_dnia = (szer - 2 * margines - kol_nazwy) / len(dni)

    wys_naglowka = 10 * mm
    wys_wiersza = 12 * mm
    dol = gora - wys_naglowka - wys_wiersza * len(z_planem)

    # Nagłówek tabeli
    c.setFillColor(PASEK)
    c.rect(margines, gora - wys_naglowka, szer - 2 * margines, wys_naglowka, stroke=0, fill=1)

    c.setFillColor(GRANAT)
    c.setFont('Nunito-Bold', 9.5)
    c.drawString(margines + 4 * mm, gora - 6.5 * mm, 'Zajęcia')
    for i, dzien in enumerate(dni):
        x = margines + kol_nazwy + i * szer_dnia + szer_dnia / 2
        c.drawCentredString(x, gora - 6.5 * mm, dzien.capitalize())

    # Wiersze
    for n, z in enumerate(z_planem):
        y = gora - wys_naglowka - (n + 1) * wys_wiersza

        if n % 2:
            c.setFillColor(PASEK)
            c.rect(margines, y, szer - 2 * margines, wys_wiersza, stroke=0, fill=1)

        c.setFillColor(GRANAT)
        c.setFont('Nunito-Bold', 9)
        c.drawString(margines + 4 * mm, y + (7.2 if z['opis'] else 4.6) * mm, z['nazwa'])

        if z['opis']:
            c.setFont('Nunito-Italic', 7.5)
            c.setFillColor(SZARY)
            c.drawString(margines + 4 * mm, y + 3.4 * mm, z['opis'])

        for i, dzien in enumerate(dni):
            godzina = z['terminy'].get(dzien)
            x = margines + kol_nazwy + i * szer_dnia

            if not godzina:
                c.setFont('Nunito-Regular', 9)
                c.setFillColor(colors.HexColor('#CFD2E0'))
                c.drawCentredString(x + szer_dnia / 2, y + 4.6 * mm, '—')
                continue

            # Godzina na kaflu — w druku czarno-białym zostaje delikatna
            # ramka, więc informacja nie znika.
            szer_kafla = min(szer_dnia - 6 * mm, 26 * mm)
            c.setFillColor(KAFEL)
            c.setStrokeColor(TURKUS)
            c.setLineWidth(0.4)
            c.roundRect(x + (szer_dnia - szer_kafla) / 2, y + 2.8 * mm,
                        szer_kafla, 6.4 * mm, 1.6 * mm, stroke=1, fill=1)

            c.setFont('Nunito-Bold', 8.5)
            c.setFillColor(GRANAT)
            c.drawCentredString(x + szer_dnia / 2, y + 4.9 * mm, godzina)

    # Siatka
    c.setStrokeColor(LINIA)
    c.setLineWidth(0.5)
    for n in range(len(z_planem) + 1):
        y = gora - wys_naglowka - n * wys_wiersza
        c.line(margines, y, szer - margines, y)
    for i in range(len(dni) + 1):
        x = margines + kol_nazwy + i * szer_dnia
        c.line(x, dol, x, gora)

    c.setStrokeColor(GRANAT)
    c.setLineWidth(0.8)
    c.rect(margines, dol, szer - 2 * margines, gora - dol, stroke=1, fill=0)
    c.line(margines, gora - wys_naglowka, szer - margines, gora - wys_naglowka)

    # ── Zajęcia bez ustalonego terminu ──────────────────────────────────
    y = dol - 8 * mm
    if bez_terminu:
        c.setFont('Nunito-Bold', 8)
        c.setFillColor(TURKUS)
        c.drawString(margines, y, 'TERMINY W USTALENIU')
        c.setFont('Nunito-Regular', 8.5)
        c.setFillColor(GRANAT)
        c.drawString(margines + 42 * mm, y, ' · '.join(z['nazwa'] for z in bez_terminu))
        y -= 6 * mm

    c.setFont('Nunito-Regular', 7.5)
    c.setFillColor(SZARY)
    c.drawString(margines, y,
                 'Plan może się zmienić — o każdej zmianie informujemy rodziców.  '
                 'Kontakt: 605 657 366 · przedszkole@kolorowe.eu')

    c.setFont('Nunito-Regular', 7.5)
    c.drawRightString(szer - margines, y, 'www.koloroweprzedszkole.com')


def main():
    rok, dni, plan = wczytaj_plan()

    os.makedirs(os.path.dirname(WYNIK), exist_ok=True)
    c = canvas_mod.Canvas(WYNIK, pagesize=landscape(A4))
    c.setTitle('Plan zajęć ' + rok)
    c.setAuthor('Kolorowe Przedszkole')
    rysuj(c, rok, dni, plan)
    c.showPage()
    c.save()

    z_terminem = sum(1 for z in plan if z['terminy'])
    print('→ %s (%d zajęć z terminem, %d bez, %d KB)'
          % (WYNIK, z_terminem, len(plan) - z_terminem, os.path.getsize(WYNIK) // 1024))


if __name__ == '__main__':
    main()

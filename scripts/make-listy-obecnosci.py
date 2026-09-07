# -*- coding: utf-8 -*-
"""Listy obecności do ręcznego wypełniania — jedna karta na grupę i miesiąc.

Wynik: jeden PDF, 24 strony poziome (2 grupy × 12 miesięcy roku szkolnego
2026/2027). Nauczycielka stawia „X" w kratce; dni wolne są wyszarzone, żeby
nie trzeba było pamiętać, które to.

Dane dzieci NIE są w repozytorium — to dane osobowe, a repo jest publiczne.
Skrypt czyta je z pliku poza projektem (patrz LISTA poniżej) w formacie:

    # Zakopiańska          ← nazwa grupy (opcjonalna, ale zalecana)
    Imiona<TAB>Nazwisko
    ...
    (pusta linia oddziela grupy)

Uruchamianie:
    ./venv/bin/python scripts/przygotuj-fonty.py     # raz, jeśli brak fontów
    ./venv/bin/python scripts/make-listy-obecnosci.py
"""
import os
from datetime import date, timedelta

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as canvas_mod

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTY = os.path.join(ROOT, 'scripts/fonty')
LOGO = os.path.join(ROOT, 'docs/apps-script/szablon/logo.png')

LISTA = os.path.expanduser('~/Downloads/dzieci_2026_2027.txt')
WYNIK = os.path.expanduser('~/Downloads/Listy_obecnosci_2026_2027.pdf')

GRANAT = colors.HexColor('#2D346F')
TURKUS = colors.HexColor('#34BBA8')
LINIA = colors.HexColor('#B9BCD0')
WOLNE = colors.HexColor('#EDEEF4')   # wypełnienie dni wolnych
SZARY = colors.HexColor('#8B8FA8')

for wariant in ('Regular', 'Bold'):
    pdfmetrics.registerFont(TTFont('Nunito-' + wariant, os.path.join(FONTY, 'Nunito-%s.ttf' % wariant)))

MIESIACE = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca',
            'sierpnia', 'września', 'października', 'listopada', 'grudnia']
MIESIACE_M = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec',
              'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień']
DNI_SKROT = ['P', 'W', 'Ś', 'C', 'P', 'S', 'N']   # poniedziałek → niedziela

# Rok szkolny: wrzesień 2026 → sierpień 2027
OKRES = [(2026, m) for m in range(9, 13)] + [(2027, m) for m in range(1, 9)]


def zakres(od, do):
    """Wszystkie dni od-do włącznie."""
    dni, d = set(), od
    while d <= do:
        dni.add(d)
        d += timedelta(days=1)
    return dni


# Święta ustawowo wolne od pracy. Wielkanoc 2027 wypada 28 marca, stąd
# Poniedziałek Wielkanocny 29.03 i Boże Ciało 27.05 (60 dni po Wielkanocy).
# Wigilia jest dniem ustawowo wolnym od 2025 roku.
SWIETA = {
    date(2026, 11, 1): 'Wszystkich Świętych',
    date(2026, 11, 11): 'Święto Niepodległości',
    date(2026, 12, 24): 'Wigilia',
    date(2026, 12, 25): 'Boże Narodzenie',
    date(2026, 12, 26): 'Boże Narodzenie',
    date(2027, 1, 1): 'Nowy Rok',
    date(2027, 1, 6): 'Trzech Króli',
    date(2027, 3, 28): 'Wielkanoc',
    date(2027, 3, 29): 'Poniedziałek Wielkanocny',
    date(2027, 5, 1): 'Święto Pracy',
    date(2027, 5, 3): 'Święto Konstytucji',
    date(2027, 5, 16): 'Zielone Świątki',
    date(2027, 5, 27): 'Boże Ciało',
    date(2027, 8, 15): 'Wniebowzięcie NMP',
}

# Przerwy z § 3 umowy na rok 2026/2027.
PRZERWY = (
    zakres(date(2026, 12, 23), date(2026, 12, 31))    # przerwa bożonarodzeniowa
    | zakres(date(2027, 2, 8), date(2027, 2, 12))     # ferie zimowe
    | zakres(date(2027, 3, 26), date(2027, 3, 29))    # wiosenna przerwa świąteczna
    | zakres(date(2027, 5, 27), date(2027, 5, 30))    # długi weekend — Boże Ciało
    | zakres(date(2027, 7, 26), date(2027, 8, 6))     # przerwa wakacyjna
)


def wolny(d):
    return d.weekday() >= 5 or d in SWIETA or d in PRZERWY


# Polski porządek alfabetyczny. locale bywa niedostępne na innej maszynie,
# więc kolejność liter ustalamy sami — inaczej „Ł" ląduje za „Z".
ALFABET = 'aąbcćdeęfghijklłmnńoópqrsśtuvwxyzźż'
POZYCJA = {znak: i for i, znak in enumerate(ALFABET)}


def klucz_alfabetyczny(tekst):
    return [POZYCJA.get(z, len(ALFABET)) for z in tekst.lower()]


def popraw_zapis(tekst):
    """Nazwisko zapisane wersalikami sprowadzamy do normalnej postaci.

    Dotyczy tylko wielkości liter — pisowni nie ruszamy, bo to dane
    z dokumentów rodziców i nie nam je poprawiać.
    """
    if not tekst.isupper():
        return tekst
    return '-'.join(
        ' '.join(w.capitalize() for w in czlon.split())
        for czlon in tekst.split('-')
    )


def wczytaj_grupy(sciezka):
    """Zwraca [(nazwa grupy, [(nazwisko, imiona), …]), …].

    Nazwa grupy pochodzi z linii „# Nazwa" nad listą. Trzymanie jej przy
    danych, a nie w kodzie, jest odporne na przestawienie bloków w pliku —
    inaczej zamiana miejscami dwóch grup po cichu podmienia nagłówki kart.
    """
    grupy, biezaca, nazwa = [], [], None

    def zamknij():
        if biezaca:
            grupy.append((nazwa or 'Grupa %d' % (len(grupy) + 1), list(biezaca)))

    for linia in open(sciezka, encoding='utf-8'):
        if not linia.strip():
            zamknij()
            biezaca, nazwa = [], None
            continue

        if linia.lstrip().startswith('#'):
            nazwa = linia.lstrip().lstrip('#').strip()
            continue

        imiona, nazwisko = [c.strip() for c in linia.rstrip('\n').split('\t')]
        biezaca.append((popraw_zapis(nazwisko), popraw_zapis(imiona)))

    zamknij()

    return [(n, sorted(g, key=lambda o: (klucz_alfabetyczny(o[0]), klucz_alfabetyczny(o[1]))))
            for n, g in grupy]


def dni_miesiaca(rok, miesiac):
    d = date(rok, miesiac, 1)
    dni = []
    while d.month == miesiac:
        dni.append(d)
        d += timedelta(days=1)
    return dni


def karta(c, grupa, dzieci, rok, miesiac):
    szer, wys = landscape(A4)
    margines = 12 * mm
    dni = dni_miesiaca(rok, miesiac)

    # ── Nagłówek ────────────────────────────────────────────────────────
    if os.path.exists(LOGO):
        c.drawImage(LOGO, margines, wys - 18 * mm, width=34 * mm,
                    height=34 * mm * 247 / 1000, mask='auto')

    c.setFont('Nunito-Bold', 15)
    c.setFillColor(GRANAT)
    c.drawCentredString(szer / 2, wys - 15 * mm, 'LISTA OBECNOŚCI')

    c.setFont('Nunito-Bold', 11)
    c.setFillColor(TURKUS)
    c.drawCentredString(szer / 2, wys - 21 * mm,
                        'Grupa %s  ·  %s %d' % (grupa, MIESIACE_M[miesiac - 1], rok))

    c.setFont('Nunito-Regular', 8)
    c.setFillColor(SZARY)
    c.drawRightString(szer - margines, wys - 15 * mm, 'rok szkolny 2026/2027')

    # ── Wymiary tabeli ──────────────────────────────────────────────────
    gora = wys - 28 * mm
    dol = 14 * mm
    kol_nazwisko = 62 * mm
    szer_dnia = (szer - 2 * margines - kol_nazwisko) / len(dni)

    wys_naglowka = 9 * mm
    wys_wiersza = min(9 * mm, (gora - wys_naglowka - dol) / max(len(dzieci), 1))
    dol_tabeli = gora - wys_naglowka - wys_wiersza * len(dzieci)

    # ── Tło dni wolnych: jeden pas przez całą wysokość tabeli ──────────
    for i, d in enumerate(dni):
        if not wolny(d):
            continue
        x = margines + kol_nazwisko + i * szer_dnia
        c.setFillColor(WOLNE)
        c.rect(x, dol_tabeli, szer_dnia, gora - dol_tabeli, stroke=0, fill=1)

    # ── Nagłówek tabeli ─────────────────────────────────────────────────
    c.setFillColor(GRANAT)
    c.setFont('Nunito-Bold', 9)
    c.drawString(margines + 3 * mm, gora - 5.8 * mm, 'Imię i nazwisko dziecka')

    for i, d in enumerate(dni):
        x = margines + kol_nazwisko + i * szer_dnia + szer_dnia / 2
        c.setFillColor(SZARY if wolny(d) else GRANAT)
        c.setFont('Nunito-Bold', 8)
        c.drawCentredString(x, gora - 4 * mm, str(d.day))
        c.setFont('Nunito-Regular', 6.5)
        c.drawCentredString(x, gora - 7.6 * mm, DNI_SKROT[d.weekday()])

    # ── Nazwiska ────────────────────────────────────────────────────────
    c.setFont('Nunito-Regular', 8.5)
    for n, (nazwisko, imiona) in enumerate(dzieci):
        y = gora - wys_naglowka - (n + 1) * wys_wiersza + 2.6 * mm
        c.setFillColor(GRANAT)
        c.drawString(margines + 3 * mm, y, '%s %s' % (nazwisko, imiona))

    # ── Siatka ──────────────────────────────────────────────────────────
    c.setStrokeColor(LINIA)
    c.setLineWidth(0.4)

    for n in range(len(dzieci) + 1):
        y = gora - wys_naglowka - n * wys_wiersza
        c.line(margines, y, szer - margines, y)
    c.line(margines, gora, szer - margines, gora)

    for i in range(len(dni) + 1):
        x = margines + kol_nazwisko + i * szer_dnia
        c.line(x, dol_tabeli, x, gora)
    c.line(margines, dol_tabeli, margines, gora)

    # Kolumna z nazwiskami i wiersz nagłówka mocniejszą kreską — oko łapie
    # wtedy strukturę tabeli, zanim zacznie czytać treść.
    c.setLineWidth(0.9)
    c.setStrokeColor(GRANAT)
    c.line(margines + kol_nazwisko, dol_tabeli, margines + kol_nazwisko, gora)
    c.line(margines, gora - wys_naglowka, szer - margines, gora - wys_naglowka)
    c.rect(margines, dol_tabeli, szer - 2 * margines, gora - dol_tabeli, stroke=1, fill=0)

    # ── Legenda ─────────────────────────────────────────────────────────
    c.setFont('Nunito-Regular', 7)
    c.setFillColor(SZARY)
    c.drawString(margines, dol_tabeli - 5 * mm,
                 'Obecność zaznacz znakiem X.  Pola wyszarzone — dni wolne '
                 '(weekendy, święta, przerwy wynikające z umowy).')

    c.showPage()


def main():
    if not os.path.exists(LISTA):
        raise SystemExit('Brak pliku z listą dzieci: ' + LISTA)

    grupy = wczytaj_grupy(LISTA)

    c = canvas_mod.Canvas(WYNIK, pagesize=landscape(A4))
    c.setTitle('Listy obecności 2026/2027')
    c.setAuthor('Kolorowe Przedszkole')

    for grupa, dzieci in grupy:
        print('   %-14s %2d dzieci' % (grupa, len(dzieci)))
        for rok, miesiac in OKRES:
            karta(c, grupa, dzieci, rok, miesiac)

    c.save()
    print('→ %s (%d stron, %d KB)' % (WYNIK, len(grupy) * len(OKRES),
                                      os.path.getsize(WYNIK) // 1024))


if __name__ == '__main__':
    main()

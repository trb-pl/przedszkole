# -*- coding: utf-8 -*-
"""Renders the blank contract and consent templates to PDF (public/dokumenty/).

Rodzic pobiera je ze strony, żeby przeczytać treść przed wypełnieniem
formularza — więc pola z danymi są tu puste (kropkowana linia), a na każdej
stronie widnieje „WZÓR".

Źródłem są te same pliki .docx, z których Apps Script generuje egzemplarze
finalne. Dzięki temu wzór na stronie i umowa do podpisu nie mogą się
rozjechać — jest jedno źródło treści.

Wymaga jednorazowego przygotowania środowiska:

    python3 -m venv venv
    ./venv/bin/pip install reportlab fonttools brotli
    ./venv/bin/python scripts/przygotuj-fonty.py   # Nunito .ttf z woff2
    ./venv/bin/python scripts/make-wzory-pdf.py
"""
import io
import os
import re
import zipfile
from xml.etree import ElementTree as ET

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, Image, PageTemplate,
                                Paragraph, Spacer, Table, TableStyle)

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTY = os.path.join(ROOT, 'scripts/fonty')
WYJSCIE = os.path.join(ROOT, 'public/dokumenty')

GRANAT = colors.HexColor('#2D346F')
TURKUS = colors.HexColor('#34BBA8')
KORAL = colors.HexColor('#F2795D')
LINIA = colors.HexColor('#CACCDB')

POBRANE = os.path.expanduser('~/Downloads')
LOGO = os.path.join(ROOT, 'docs/apps-script/szablon/logo.png')

# Szablony już ostylowane (logo w środku, kolory marki) — bierzemy je 1:1.
ZRODLA_GOTOWE = [
    (os.path.join(POBRANE, 'Umowa_SZABLON_2026_2027_brand.docx'),
     'wzor-umowy-2026-2027.pdf'),
    (os.path.join(POBRANE, 'Zalacznik2_Wizerunek_SZABLON.docx'),
     'wzor-zgoda-wizerunek.pdf'),
]

# Pakiet czterech załączników w jednym pliku. Rozbijamy go na osobne PDF-y —
# rodzic ma pobrać ten jeden dokument, którego szuka, a nie ośmiostronicowy
# plik. Załącznik nr 2 pomijamy: ma własny, ostylowany szablon powyżej.
PAKIET = (os.path.join(POBRANE, 'Pakiet_formularzy_dla_rodzicow_2026_2027 (003).docx'), {
    1: 'wzor-zalacznik-1-postepowanie-przy-zachorowaniu.pdf',
    3: 'wzor-zalacznik-3-zgoda-piesze-wyjscia.pdf',
    4: 'wzor-zalacznik-4-zajecia-dodatkowe.pdf',
})

# Dokumenty bez identyfikacji wizualnej — markę nakładamy przy składzie PDF.
ZRODLA_SUROWE = [
    (os.path.join(POBRANE, 'Informacja_RODO_dla_rodzicow_Kolorowe_Przedszkole_2026_2027.docx'),
     'informacja-rodo.pdf', False),
    (os.path.join(POBRANE, 'Informacje_o_dziecku_ankieta_dla_rodzicow_2026_2027 (003).docx'),
     'wzor-ankieta-informacje-o-dziecku.pdf', True),
]

for wariant in ('Regular', 'Bold', 'Italic', 'BoldItalic'):
    pdfmetrics.registerFont(TTFont('Nunito-' + wariant, os.path.join(FONTY, 'Nunito-%s.ttf' % wariant)))
# Rodzinę rejestrujemy pod nazwą bazowej odmiany — inaczej reportlab nie wie,
# czym zastąpić <b> i <i>, i cały tekst wychodzi zwykły.
for rodzina in ('Nunito', 'Nunito-Regular'):
    pdfmetrics.registerFontFamily(rodzina, normal='Nunito-Regular', bold='Nunito-Bold',
                                  italic='Nunito-Italic', boldItalic='Nunito-BoldItalic')

WYROWNANIE = {'center': TA_CENTER, 'right': TA_RIGHT, 'both': TA_JUSTIFY, 'left': TA_LEFT}


def escape(t):
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def bez_pol(tekst):
    """Puste miejsce zamiast pola z danymi.

    Pola zgód w załączniku to komórki tabeli do odhaczenia — tam kropki
    byłyby mylące, więc zostają puste. Reszta dostaje kropkowaną linię,
    czyli to, czego rodzic spodziewa się po formularzu.
    """
    tekst = re.sub(r'\{\{WIZ_[A-Z_]+\}\}', '', tekst)
    return re.sub(r'\{\{[A-Z_0-9]+\}\}', '.' * 26, tekst)


def zbierz_akapit(p):
    """Zamienia w:p na (html, styl) dla Platypusa."""
    pPr = p.find(W + 'pPr')
    jc, przed, po, ramka, nazwa_stylu = 'left', 0, 0, False, ''

    if pPr is not None:
        el = pPr.find(W + 'pStyle')
        if el is not None:
            nazwa_stylu = el.get(W + 'val', '')
        el = pPr.find(W + 'jc')
        if el is not None:
            jc = el.get(W + 'val', 'left')
        el = pPr.find(W + 'spacing')
        if el is not None:
            przed = int(el.get(W + 'before', 0)) / 20.0
            po = int(el.get(W + 'after', 0)) / 20.0
        ramka = pPr.find(W + 'pBdr') is not None

    kawalki, rozmiar = [], 11.0
    for r in p.iter(W + 'r'):
        rPr = r.find(W + 'rPr')
        bold = italic = False
        kolor = None
        if rPr is not None:
            bold = rPr.find(W + 'b') is not None
            italic = rPr.find(W + 'i') is not None
            el = rPr.find(W + 'color')
            if el is not None:
                kolor = '#' + el.get(W + 'val', '000000')
            el = rPr.find(W + 'sz')
            if el is not None:
                rozmiar = int(el.get(W + 'val')) / 2.0

        # Kolejność dzieci ma znaczenie: w:br to łamanie wiersza w środku
        # akapitu (np. lista przerw świątecznych). Sklejenie samych w:t
        # zlepiłoby zdania w jedno.
        czesci = []
        for dziecko in r:
            etykieta_r = dziecko.tag.replace(W, '')
            if etykieta_r == 't':
                czesci.append(escape(bez_pol(dziecko.text or '')))
            elif etykieta_r == 'br':
                czesci.append('<br/>')
            elif etykieta_r == 'tab':
                czesci.append(' ')

        frag = ''.join(czesci)
        # Uwaga: pojedyncza spacja też bywa osobnym runem („120 " + "zł" +
        # " " + "miesięcznie"). Odsiewanie po .strip() sklejało wyrazy.
        if not frag:
            continue
        if bold:
            frag = '<b>%s</b>' % frag
        if italic:
            frag = '<i>%s</i>' % frag
        if kolor:
            frag = '<font color="%s">%s</font>' % (kolor, frag)
        kawalki.append(frag)

    return ''.join(kawalki), {
        'jc': WYROWNANIE.get(jc, TA_LEFT),
        'przed': przed,
        'po': po,
        'ramka': ramka,
        'rozmiar': rozmiar,
        'styl': nazwa_stylu,
    }


def marka(html, opis, tekst):
    """Nadaje kolory marki dokumentom, które przyszły bez formatowania.

    Rozpoznajemy po tym, co niesie sam plik .docx: tytuł jest jedynym
    akapitem 14 pt, nagłówki sekcji mają 11 pt i pogrubienie. Reszta to
    treść. Dzięki temu nie trzeba utrzymywać listy nagłówków dla każdego
    z dokumentów osobno.
    """
    kreska = False

    # Kolory ze źródła zdejmujemy tam, gdzie nakładamy własne — inaczej
    # zagnieżdżony <font> z docx wygrywa i nagłówek zostaje w barwie Worda.
    def bez_koloru(t):
        return re.sub(r'</?font[^>]*>', '', t)

    if tekst.lower().startswith('załącznik nr'):
        opis = dict(opis, jc=TA_CENTER, rozmiar=9.5)
        html = '<font color="#34BBA8">%s</font>' % bez_koloru(html)

    elif opis['rozmiar'] >= 14 or (tekst.isupper() and len(tekst) > 25):
        # Tytuł dokumentu: albo wyraźnie większy stopień pisma, albo
        # wersaliki. W pakiecie załączników bywa raz tak, raz tak.
        opis = dict(opis, jc=TA_CENTER, przed=6, po=10, rozmiar=max(opis['rozmiar'], 14))
        html = '<b><font color="#2D346F">%s</font></b>' % bez_koloru(html)

    elif 'rok szkolny' in tekst and 'Przedszkole Niepubliczne' in tekst:
        opis = dict(opis, jc=TA_CENTER, rozmiar=9.5, po=14)

    elif opis['styl'].startswith('Nag') or (
            opis['rozmiar'] >= 11 and '<b>' in html and len(tekst) < 70 and not tekst.endswith('.')):
        opis = dict(opis, przed=10, po=5)
        html = '<b><font color="#34BBA8">%s</font></b>' % bez_koloru(html)
        kreska = True

    return html, dict(opis, ramka=opis['ramka'] or kreska)


def styl(opis):
    return ParagraphStyle(
        'x',
        fontName='Nunito-Regular',
        fontSize=opis['rozmiar'],
        leading=opis['rozmiar'] * 1.45,
        alignment=opis['jc'],
        spaceBefore=opis['przed'],
        spaceAfter=opis['po'],
        textColor=GRANAT,
        borderPadding=0,
    )


def logo_flowable(bajty):
    obraz = Image(io.BytesIO(bajty), width=48 * mm, height=48 * mm * 247 / 1000)
    obraz.hAlign = 'CENTER'
    return obraz


def zbuduj(elementy, nazwa_pdf, logo_bajty=None, wlasna_marka=False, wzor=True):
    """Składa PDF z listy elementów body dokumentu Word.

    wlasna_marka=True oznacza plik źródłowy bez identyfikacji wizualnej —
    logo dokładamy z zewnątrz, a kolory nakłada marka().
    """
    tresc = []
    if wlasna_marka and logo_bajty:
        tresc += [logo_flowable(logo_bajty), Spacer(1, 8 * mm)]

    for el in elementy:
        etykieta = el.tag.replace(W, '')

        if etykieta == 'p':
            # Akapit z logo — wstawiamy obrazek zamiast pustego tekstu.
            if el.find('.//' + W + 'drawing') is not None and logo_bajty:
                tresc += [logo_flowable(logo_bajty), Spacer(1, 8 * mm)]
                continue

            html, opis = zbierz_akapit(el)
            if not html.strip():
                tresc.append(Spacer(1, max(opis['po'], 4)))
                continue

            if wlasna_marka:
                html, opis = marka(html, opis, czysty_tekst(el))

            s = styl(opis)
            if opis['ramka']:
                # Kreska nad nagłówkiem sekcji — w docx to pBdr, tutaj
                # cienka linia rysowana przez ramkę akapitu.
                s.borderWidth = 0
                tresc.append(Table([['']], colWidths=[170 * mm], rowHeights=[0.6],
                                   style=[('LINEBELOW', (0, 0), (-1, -1), 0.6, LINIA)]))
                tresc.append(Spacer(1, 3 * mm))
            tresc.append(Paragraph(html, s))

        elif etykieta == 'tbl':
            wiersze = []
            for tr in el.findall(W + 'tr'):
                komorki = []
                for tc in tr.findall(W + 'tc'):
                    czesci = []
                    for p in tc.findall(W + 'p'):
                        html, opis = zbierz_akapit(p)
                        if html.strip():
                            czesci.append(Paragraph(html, styl(opis)))
                    komorki.append(czesci or '')
                wiersze.append(komorki)

            if not wiersze:
                continue

            kolumn = max(len(w) for w in wiersze)
            wiersze = [w + [''] * (kolumn - len(w)) for w in wiersze]
            # Pierwsza kolumna niesie opis, pozostałe to wąskie pola wyboru.
            szer = [170 * mm - (kolumn - 1) * 28 * mm] + [28 * mm] * (kolumn - 1) if kolumn > 1 else [170 * mm]

            tabela = Table(wiersze, colWidths=szer, style=TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.6, LINIA),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ]))
            tresc += [Spacer(1, 4 * mm), tabela, Spacer(1, 6 * mm)]

    def ozdoby(canvas, dok):
        canvas.saveState()

        # „WZÓR" na każdej stronie — to nie jest egzemplarz do podpisu.
        # Informacja RODO wyjątkiem: niczego się na niej nie podpisuje,
        # więc jest pełnoprawnym dokumentem, nie wzorem.
        if wzor:
            canvas.setFont('Nunito-Bold', 8.5)
            canvas.setFillColor(KORAL)
            canvas.drawCentredString(A4[0] / 2, A4[1] - 12 * mm,
                                     'W Z Ó R  ·  dokument poglądowy, nie do podpisu')

        # Stopka: kreska, adres na środku, numer strony po prawej.
        canvas.setStrokeColor(LINIA)
        canvas.setLineWidth(0.6)
        canvas.line(20 * mm, 16 * mm, A4[0] - 20 * mm, 16 * mm)

        canvas.setFont('Nunito-Regular', 8.5)
        canvas.setFillColor(GRANAT)
        canvas.drawCentredString(A4[0] / 2, 11 * mm, 'www.koloroweprzedszkole.com')
        canvas.drawRightString(A4[0] - 20 * mm, 11 * mm, str(dok.page))

        canvas.restoreState()

    os.makedirs(WYJSCIE, exist_ok=True)
    sciezka = os.path.join(WYJSCIE, nazwa_pdf)

    dok = BaseDocTemplate(sciezka, pagesize=A4,
                          leftMargin=20 * mm, rightMargin=20 * mm,
                          topMargin=20 * mm, bottomMargin=22 * mm,
                          title=os.path.splitext(nazwa_pdf)[0].replace('-', ' ').capitalize(),
                          author='Kolorowe Przedszkole')
    ramka = Frame(dok.leftMargin, dok.bottomMargin, dok.width, dok.height, id='tresc')
    dok.addPageTemplates([PageTemplate(id='std', frames=[ramka], onPage=ozdoby)])
    dok.build(tresc)

    print('→ %s (%d KB)' % (sciezka, os.path.getsize(sciezka) // 1024))


def czysty_tekst(p):
    return ''.join(t.text or '' for t in p.iter(W + 't')).strip()


def elementy_body(sciezka):
    korzen = ET.fromstring(zipfile.ZipFile(sciezka).read('word/document.xml'))
    return list(korzen.find(W + 'body'))


def logo_z_docx(sciezka):
    z = zipfile.ZipFile(sciezka)
    return z.read('word/media/logo.png') if 'word/media/logo.png' in z.namelist() else None


def podziel_pakiet(elementy):
    """Dzieli pakiet na załączniki po wierszach „Załącznik nr.N do umowy"."""
    czesci, numer, biezaca = {}, None, []

    for el in elementy:
        if el.tag == W + 'p':
            tekst = czysty_tekst(el)
            dopasowanie = re.match(r'Załącznik nr\.?\s*(\d)', tekst)
            if dopasowanie:
                if numer:
                    czesci[numer] = biezaca
                numer, biezaca = int(dopasowanie.group(1)), []
        if numer:
            biezaca.append(el)

    if numer:
        czesci[numer] = biezaca
    return czesci


logo_marki = open(LOGO, 'rb').read()

for zrodlo, nazwa in ZRODLA_GOTOWE:
    zbuduj(elementy_body(zrodlo), nazwa, logo_z_docx(zrodlo))

zrodlo, mapowanie = PAKIET
zalaczniki = podziel_pakiet(elementy_body(zrodlo))
for numer, nazwa in mapowanie.items():
    zbuduj(zalaczniki[numer], nazwa, logo_marki, wlasna_marka=True)

for zrodlo, nazwa, wzor in ZRODLA_SUROWE:
    zbuduj(elementy_body(zrodlo), nazwa, logo_marki, wlasna_marka=True, wzor=wzor)

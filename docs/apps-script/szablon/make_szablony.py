# -*- coding: utf-8 -*-
"""Buduje szablony pozostałych dokumentów: załączników 1, 3, 4 i ankiety.

Każdy dostaje identyfikację wizualną (logo, Nunito, kolory, stopka —
dziedziczone po ostylowanej umowie) oraz pola `{{...}}` w tych miejscach,
które umiemy wypełnić danymi z formularza na stronie.

Zasada podziału: uzupełniamy wyłącznie dane, które rodzic już nam podał —
imię dziecka, PESEL, kontakty. Wszystko, co dotyczy zdrowia, diety,
trudności czy wyborów rodzica, zostaje puste do wypełnienia na miejscu.
Danych z art. 9 RODO nie zbieramy przez stronę.

Uruchamianie:
    python3 make_szablony.py     # czyta .docx z ~/Downloads
"""
import os
import re
import shutil
import zipfile
from xml.etree import ElementTree as ET

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
w = '{%s}' % W
ET.register_namespace('w', W)

NAVY, TEAL, FONT = '2D346F', '34BBA8', 'Nunito'

POBRANE = os.path.expanduser('~/Downloads')
KONTENER = os.path.join(POBRANE, 'Umowa_SZABLON_2026_2027_brand.docx')
PAKIET = os.path.join(POBRANE, 'Pakiet_formularzy_dla_rodzicow_2026_2027 (003).docx')
ANKIETA = os.path.join(POBRANE, 'Informacje_o_dziecku_ankieta_dla_rodzicow_2026_2027 (003).docx')

# Etykieta w dokumencie → pole, którym wypełni ją Apps Script.
POLA = {
    'Imię i nazwisko dziecka': '{{DZIECKO}}',
    'Imię': '{{DZIECKO_IMIONA}}',
    'Nazwisko': '{{DZIECKO_NAZWISKO}}',
    'Data urodzenia': '{{DZIECKO_DATA_UR}}',
    'PESEL': '{{DZIECKO_PESEL}}',
}

# Ankieta rozbija kontakt na dwie sekcje — pola zależą od tego, w której
# jesteśmy, więc rozstrzygamy je dopiero przy przechodzeniu dokumentu.
POLA_RODZICA = {
    1: {'Imię i nazwisko': '{{R1_IMIE}}', 'Telefon': '{{R1_TELEFON}}', 'E-mail': '{{R1_EMAIL}}'},
    2: {'Imię i nazwisko': '{{R2_IMIE}}', 'Telefon': '{{R2_TELEFON}}', 'E-mail': '{{R2_EMAIL}}'},
}


def tekst(el):
    return ''.join(t.text or '' for t in el.iter(w + 't')).strip()


def ustaw_rpr(run, *, bold=None, italic=None, kolor=None, rozmiar=None):
    rpr = run.find(w + 'rPr')
    if rpr is None:
        rpr = ET.Element(w + 'rPr')
        run.insert(0, rpr)

    for tag in ('rFonts', 'color'):
        for stary in rpr.findall(w + tag):
            rpr.remove(stary)

    czcionka = ET.Element(w + 'rFonts')
    for atrybut in ('ascii', 'hAnsi', 'cs'):
        czcionka.set(w + atrybut, FONT)
    rpr.insert(0, czcionka)

    if kolor:
        el = ET.SubElement(rpr, w + 'color')
        el.set(w + 'val', kolor)

    for flaga, tag in ((bold, 'b'), (italic, 'i')):
        if flaga is None:
            continue
        for stary in rpr.findall(w + tag) + rpr.findall(w + tag + 'Cs'):
            rpr.remove(stary)
        if flaga:
            ET.SubElement(rpr, w + tag)
            ET.SubElement(rpr, w + tag + 'Cs')

    if rozmiar:
        for tag in ('sz', 'szCs'):
            for stary in rpr.findall(w + tag):
                rpr.remove(stary)
            el = ET.SubElement(rpr, w + tag)
            el.set(w + 'val', str(rozmiar))


def nowy_run(tresc, **kw):
    run = ET.Element(w + 'r')
    ustaw_rpr(run, **kw)
    t = ET.SubElement(run, w + 't')
    t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    t.text = tresc
    return run


def zastap_runy(p, runy):
    """Podmienia treść akapitu, zostawiając jego formatowanie (pPr)."""
    for dziecko in list(p):
        if dziecko.tag != w + 'pPr':
            p.remove(dziecko)
    for run in runy:
        p.append(run)


def pole_dla(etykieta, sekcja_rodzica):
    if sekcja_rodzica and etykieta in POLA_RODZICA[sekcja_rodzica]:
        return POLA_RODZICA[sekcja_rodzica][etykieta]
    return POLA.get(etykieta)


def data_podpisania():
    """Akapit „Warszawa, dnia {{DATA_UMOWY}}" wstawiany nad linią podpisu."""
    p = ET.Element(w + 'p')
    ppr = ET.SubElement(p, w + 'pPr')
    jc = ET.SubElement(ppr, w + 'jc')
    jc.set(w + 'val', 'right')
    spacing = ET.SubElement(ppr, w + 'spacing')
    spacing.set(w + 'before', '240')
    spacing.set(w + 'after', '240')
    p.append(nowy_run('Warszawa, dnia ', kolor=NAVY))
    p.append(nowy_run('{{DATA_UMOWY}}', bold=True, italic=True, kolor=NAVY))
    return p


def wstaw_date_podpisania(body):
    """Wstawia datę nad blokiem podpisu.

    Blok podpisu to dwa akapity: kropkowana kreska, a pod nią etykieta
    („czytelny podpis rodzica…"). Data musi trafić nad kreskę — wstawiona
    między nie rozdzielałaby linię od jej opisu.
    """
    for i, el in enumerate(list(body)):
        if el.tag != w + 'p' or 'czytelny podpis' not in tekst(el):
            continue

        gdzie = i
        if i > 0 and set(tekst(body[i - 1])) <= set('. '):
            gdzie = i - 1   # nad kreską, nie pod nią

        body.insert(gdzie, data_podpisania())
        return


def przetworz_akapit(p, sekcja_rodzica):
    """Zwraca False, jeśli akapit ma zniknąć z szablonu."""
    tresc = tekst(p)

    # „Grupa" jest ustalana we wrześniu, więc w dokumencie generowanym
    # w sierpniu byłaby pustym polem do ręcznego dopisania. Przydziałem
    # grupy zajmuje się przedszkole, nie umowa.
    if re.match(r'^Grupa\s*:', tresc):
        return False

    # Skoro data jest już wydrukowana nad podpisem, etykieta nie może prosić
    # o nią po raz drugi.
    if 'czytelny podpis' in tresc:
        for run in p.findall(w + 'r'):
            for t in run.findall(w + 't'):
                if t.text:
                    t.text = t.text.replace('data i czytelny podpis', 'czytelny podpis')

    dopasowanie = re.match(r'^([^:]{2,40}?)\s*:\s*\.{4,}', tresc)
    if dopasowanie:
        etykieta = dopasowanie.group(1).strip()
        pole = pole_dla(etykieta, sekcja_rodzica)
        if pole:
            zastap_runy(p, [
                nowy_run(etykieta + ': ', bold=True, kolor=NAVY),
                # Kursywa odróżnia w druku dane z formularza od treści
                # dokumentu — tak samo jak w umowie.
                nowy_run(pole, bold=True, italic=True, kolor=NAVY),
            ])
            return True

    # Tytuł dokumentu (wersaliki) — wyśrodkowany, jak w umowie.
    if tresc.isupper() and len(tresc) > 25:
        ppr = p.find(w + 'pPr')
        if ppr is None:
            ppr = ET.Element(w + 'pPr')
            p.insert(0, ppr)
        for stary in ppr.findall(w + 'jc'):
            ppr.remove(stary)
        jc = ET.SubElement(ppr, w + 'jc')
        jc.set(w + 'val', 'center')

    # Nagłówek sekcji („1. DANE DZIECKA", „Kontakty alarmowe") — turkus.
    naglowek = (
        re.match(r'^\d+\.\s+[A-ZĄĆĘŁŃÓŚŹŻ ,/-]{4,}$', tresc)
        or (len(tresc) < 60 and tresc.endswith(('alarmowe', 'sytuacji', 'zgody', 'Zasady', 'Decyzja', 'prawnego')))
    )
    kolor = TEAL if naglowek else NAVY

    for run in p.findall(w + 'r'):
        ustaw_rpr(run, kolor=kolor, bold=True if naglowek else None)

    return True


def przetworz_tabele(tbl):
    """Kontakty alarmowe: wiersze rodziców uzupełniamy danymi z formularza."""
    for tr in tbl.findall(w + 'tr'):
        komorki = tr.findall(w + 'tc')
        if not komorki:
            continue

        etykieta = tekst(komorki[0])
        numer = None
        if etykieta.startswith('Rodzic/opiekun prawny 1'):
            numer = 1
        elif etykieta.startswith('Rodzic/opiekun prawny 2'):
            numer = 2

        for tc in komorki:
            for p in tc.findall(w + 'p'):
                for run in p.findall(w + 'r'):
                    ustaw_rpr(run, kolor=NAVY)

        if numer and len(komorki) >= 2:
            zastap_runy(komorki[0].find(w + 'p'), [
                nowy_run(etykieta + ' — ', kolor=NAVY),
                nowy_run('{{R%d_IMIE}}' % numer, bold=True, italic=True, kolor=NAVY),
            ])
            zastap_runy(komorki[1].find(w + 'p'), [
                nowy_run('{{R%d_TELEFON}}' % numer, bold=True, italic=True, kolor=NAVY),
            ])


def zbuduj(elementy, nazwa_wyjscia, numer_zalacznika=None):
    praca = 'build_tmp'
    if os.path.exists(praca):
        shutil.rmtree(praca)
    with zipfile.ZipFile(KONTENER) as z:
        z.extractall(praca)

    sciezka_xml = os.path.join(praca, 'word/document.xml')
    korzen = ET.parse(sciezka_xml).getroot()
    body = korzen.find(w + 'body')

    # Z kontenera zostawiamy tylko logo i sectPr (marginesy + stopka).
    logo = next(p for p in body.findall(w + 'p') if p.find('.//' + w + 'drawing') is not None)
    sectpr = body.find(w + 'sectPr')
    for dziecko in list(body):
        body.remove(dziecko)
    body.append(logo)

    sekcja_rodzica = None
    for el in elementy:
        kopia = ET.fromstring(ET.tostring(el))

        if kopia.tag == w + 'tbl':
            przetworz_tabele(kopia)
            body.append(kopia)
            continue

        if kopia.tag != w + 'p':
            continue

        tresc = tekst(kopia)

        # Ankieta dzieli kontakty na MAMA/TATA. Zmieniamy na neutralne
        # „rodzic/opiekun 1 i 2": formularz zbiera dane w tej kolejności,
        # a nie każda rodzina ma mamę i tatę.
        if tresc in ('MAMA', 'TATA'):
            sekcja_rodzica = 1 if tresc == 'MAMA' else 2
            zastap_runy(kopia, [
                nowy_run('RODZIC / OPIEKUN PRAWNY %d' % sekcja_rodzica, bold=True, kolor=TEAL),
            ])
            body.append(kopia)
            continue

        if re.match(r'^\d+\.\s', tresc) and 'KONTAKT' not in tresc.upper():
            sekcja_rodzica = None

        if numer_zalacznika and tresc.lower().startswith('załącznik nr'):
            zastap_runy(kopia, [
                nowy_run('Załącznik nr %d do umowy nr ' % numer_zalacznika, kolor=TEAL),
                nowy_run('{{NR_UMOWY}}', bold=True, italic=True, kolor=TEAL),
            ])
            body.append(kopia)
            continue

        if przetworz_akapit(kopia, sekcja_rodzica):
            body.append(kopia)

    wstaw_date_podpisania(body)
    body.append(sectpr)
    ET.ElementTree(korzen).write(sciezka_xml, encoding='UTF-8', xml_declaration=True)

    if os.path.exists(nazwa_wyjscia):
        os.remove(nazwa_wyjscia)
    with zipfile.ZipFile(nazwa_wyjscia, 'w', zipfile.ZIP_DEFLATED) as z:
        for katalog, _, pliki in os.walk(praca):
            for plik in pliki:
                pelna = os.path.join(katalog, plik)
                z.write(pelna, os.path.relpath(pelna, praca))
    shutil.rmtree(praca)

    print('→ %s (%d KB)' % (nazwa_wyjscia, os.path.getsize(nazwa_wyjscia) // 1024))


def elementy_body(sciezka):
    korzen = ET.fromstring(zipfile.ZipFile(sciezka).read('word/document.xml'))
    return list(korzen.find(w + 'body'))


def podziel_pakiet(elementy):
    czesci, numer, biezaca = {}, None, []
    for el in elementy:
        if el.tag == w + 'p':
            dopasowanie = re.match(r'Załącznik nr\.?\s*(\d)', tekst(el))
            if dopasowanie:
                if numer:
                    czesci[numer] = biezaca
                numer, biezaca = int(dopasowanie.group(1)), []
        if numer:
            biezaca.append(el)
    if numer:
        czesci[numer] = biezaca
    return czesci


if __name__ == '__main__':
    zalaczniki = podziel_pakiet(elementy_body(PAKIET))

    zbuduj(zalaczniki[1], 'Zalacznik1_Zachorowanie_SZABLON.docx', numer_zalacznika=1)
    zbuduj(zalaczniki[3], 'Zalacznik3_Piesze_wyjscia_SZABLON.docx', numer_zalacznika=3)
    zbuduj(zalaczniki[4], 'Zalacznik4_Zajecia_dodatkowe_SZABLON.docx', numer_zalacznika=4)
    zbuduj(elementy_body(ANKIETA), 'Ankieta_Informacje_o_dziecku_SZABLON.docx')

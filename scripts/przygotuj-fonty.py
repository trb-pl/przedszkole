# -*- coding: utf-8 -*-
"""Wypakowuje statyczne odmiany Nunito z pakietu Fontsource.

Fontsource dostarcza tylko woff2 ze zmiennym parametrem grubości, a reportlab
potrzebuje zwykłych .ttf o stałej wadze. Zamiast dokładać do repo kolejny
pakiet fontów, wycinamy z tego, co już jest w node_modules.

Uwaga na podzbiory: plik `latin` zawiera alfabet podstawowy, a `latin-ext`
wyłącznie znaki rozszerzone (ą, ę, ł, ś, ż…). Użycie samego `latin-ext` daje
tekst, w którym widać wyłącznie polskie ogonki — dlatego oba scalamy.
"""
import os
import tempfile

from fontTools.merge import Merger
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZRODLO = os.path.join(ROOT, 'node_modules/@fontsource-variable/nunito/files')
WYJSCIE = os.path.join(ROOT, 'scripts/fonty')

WARIANTY = [
    ('normal', {'Regular': 400, 'Bold': 700}),
    ('italic', {'Italic': 400, 'BoldItalic': 700}),
]

os.makedirs(WYJSCIE, exist_ok=True)
tmp = tempfile.mkdtemp()


def statyczny(podzbior, styl, waga, nazwa):
    """woff2 ze zmienną grubością → zwykły .ttf o stałej wadze."""
    font = TTFont(os.path.join(ZRODLO, 'nunito-%s-wght-%s.woff2' % (podzbior, styl)))
    font.flavor = None
    instantiateVariableFont(font, {'wght': waga}, inplace=True)
    sciezka = os.path.join(tmp, nazwa)
    font.save(sciezka)
    return sciezka


for styl, odmiany in WARIANTY:
    for nazwa, waga in odmiany.items():
        podstawa = statyczny('latin', styl, waga, nazwa + '-latin.ttf')
        rozszerzony = statyczny('latin-ext', styl, waga, nazwa + '-ext.ttf')

        scalony = Merger().merge([podstawa, rozszerzony])

        # Każda odmiana musi mieć własną nazwę wewnętrzną. reportlab
        # rozpoznaje wczytane kroje po nazwie z pliku, więc cztery pliki
        # podpisane tak samo („Nunito") to dla niego jeden font — i całe
        # pogrubienie znika bez żadnego ostrzeżenia.
        pelna = 'Nunito ' + nazwa
        for rekord in scalony['name'].names:
            if rekord.nameID in (1, 4):
                rekord.string = pelna
            elif rekord.nameID == 2:
                rekord.string = nazwa
            elif rekord.nameID == 6:
                rekord.string = 'Nunito-' + nazwa

        sciezka = os.path.join(WYJSCIE, 'Nunito-%s.ttf' % nazwa)
        scalony.save(sciezka)

        znaki = TTFont(sciezka).getBestCmap()
        assert ord('A') in znaki and ord('ą') in znaki, 'brakuje znaków w ' + nazwa
        print('→ %s (%d KB, znaków: %d)' % (sciezka, os.path.getsize(sciezka) // 1024, len(znaki)))

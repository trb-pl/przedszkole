#!/usr/bin/env python3
"""Jadłospis z pliku .xlsx na CSV, który rozumie strona.

Kuchnia przysyła tydzień jako arkusz .xlsx (Excel/Numbers). Ten skrypt
wyciąga z niego czystą siatkę komórek — bez przepisywania treści ręcznie,
bo przy przepisywaniu najłatwiej o literówkę w czyjejś nazwie potrawy.

Korzysta wyłącznie z biblioteki standardowej Pythona: .xlsx to spakowany
zestaw plików XML, więc nie trzeba instalować openpyxl ani pandas.

    python3 scripts/jadlospis-z-xlsx.py "~/Desktop/jadlospis.xlsx" > /tmp/j.csv
    node scripts/jadlospis-pliki.mjs /tmp/j.csv

Drugie polecenie zapisuje migawkę src/data/jadlospis.json i generuje PDF.
"""
import csv
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'


def numer_kolumny(adres: str) -> int:
    """„C4" → 2. Litery adresu to zapis pozycji w systemie o podstawie 26."""
    litery = re.match(r'[A-Z]+', adres).group(0)
    numer = 0
    for znak in litery:
        numer = numer * 26 + (ord(znak) - 64)
    return numer - 1


def tekst_komorki(komorka, teksty: list[str]) -> str:
    """Treść komórki: ze wspólnego słownika tekstów albo wpisana wprost."""
    wartosc = komorka.find(f'{NS}v')
    wbudowany = komorka.find(f'{NS}is')

    if komorka.get('t') == 's' and wartosc is not None:
        return teksty[int(wartosc.text)]
    if wbudowany is not None:
        return ''.join(t.text or '' for t in wbudowany.iter(f'{NS}t'))
    return wartosc.text if wartosc is not None else ''


def wiersze_arkusza(sciezka: Path) -> list[list[str]]:
    with zipfile.ZipFile(sciezka) as paczka:
        teksty: list[str] = []
        if 'xl/sharedStrings.xml' in paczka.namelist():
            korzen = ET.fromstring(paczka.read('xl/sharedStrings.xml'))
            for pozycja in korzen.findall(f'{NS}si'):
                teksty.append(''.join(t.text or '' for t in pozycja.iter(f'{NS}t')))

        arkusze = sorted(n for n in paczka.namelist() if re.fullmatch(r'xl/worksheets/sheet\d+\.xml', n))
        if not arkusze:
            raise SystemExit(f'{sciezka}: w pliku nie ma żadnej zakładki')
        if len(arkusze) > 1:
            print(f'Uwaga: plik ma {len(arkusze)} zakładek, biorę pierwszą.', file=sys.stderr)
        korzen = ET.fromstring(paczka.read(arkusze[0]))

    wiersze = []
    for wiersz in korzen.iter(f'{NS}row'):
        komorki: dict[int, str] = {}
        for komorka in wiersz.findall(f'{NS}c'):
            tresc = (tekst_komorki(komorka, teksty) or '').strip()
            if tresc:
                komorki[numer_kolumny(komorka.get('r'))] = tresc
        szerokosc = max(komorki) + 1 if komorki else 0
        wiersze.append([komorki.get(i, '') for i in range(szerokosc)])
    return wiersze


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit('użycie: jadlospis-z-xlsx.py <plik.xlsx>   (CSV leci na wyjście)')

    sciezka = Path(sys.argv[1]).expanduser()
    if not sciezka.is_file():
        raise SystemExit(f'nie znalazłem pliku: {sciezka}')

    wiersze = wiersze_arkusza(sciezka)
    # CRLF, bo tak wygląda CSV z Arkuszy Google — parser dostaje jedno i to samo.
    pisarz = csv.writer(sys.stdout, lineterminator='\r\n')
    pisarz.writerows(wiersze)
    print(f'{sciezka.name}: {len(wiersze)} wierszy', file=sys.stderr)


if __name__ == '__main__':
    main()

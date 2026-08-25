# -*- coding: utf-8 -*-
"""Umowa powierzenia przetwarzania danych osobowych (przedszkole → TRBK).

Buduje dokument .docx na bazie ostylowanej umowy z rodzicami, więc
dziedziczy logo, font Nunito, kolory marki i stopkę.
"""
import os
import re
import shutil
import zipfile

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NAVY, TEAL, FONT, LINIA = '2D346F', '34BBA8', 'Nunito', 'CACCDB'

POBRANE = os.path.expanduser('~/Downloads')
KONTENER = os.path.join(POBRANE, 'Umowa_SZABLON_2026_2027_brand.docx')
WYNIK = os.path.join(POBRANE, 'Umowa_powierzenia_przetwarzania_danych.docx')


def rpr(*, bold=False, italic=False, color=NAVY, size=20):
    s = '<w:rFonts w:ascii="%s" w:hAnsi="%s" w:cs="%s"/>' % (FONT, FONT, FONT)
    if bold:
        s += '<w:b/><w:bCs/>'
    if italic:
        s += '<w:i/><w:iCs/>'
    s += '<w:color w:val="%s"/><w:sz w:val="%d"/><w:szCs w:val="%d"/>' % (color, size, size)
    return '<w:rPr>%s</w:rPr>' % s


def run(tekst, **kw):
    t = tekst.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return '<w:r>%s<w:t xml:space="preserve">%s</w:t></w:r>' % (rpr(**kw), t)


def para(tresc, *, jc=None, przed=0, po=120, kreska=False):
    p = '<w:pPr>'
    if jc:
        p += '<w:jc w:val="%s"/>' % jc
    if kreska:
        p += ('<w:pBdr><w:top w:val="single" w:sz="4" w:space="6" w:color="%s"/></w:pBdr>' % LINIA)
    p += '<w:spacing w:before="%d" w:after="%d" w:line="288" w:lineRule="auto"/></w:pPr>' % (przed, po)
    return '<w:p>%s%s</w:p>' % (p, tresc)


def paragraf(numer, tytul):
    return (para(run('§ %d' % numer, bold=True, color=TEAL, size=26), jc='center', przed=280, po=60, kreska=True) +
            para(run(tytul, bold=True, color=TEAL, size=22), jc='center', po=160))


def punkty(lista, start=1):
    out = ''
    for i, tekst in enumerate(lista, start):
        out += para(run('%d. ' % i, bold=True) + run(tekst), po=100)
    return out


def podpunkty(lista):
    out = ''
    for tekst in lista:
        out += para(run('•  ') + run(tekst), po=80)
    return out


# ── Treść ────────────────────────────────────────────────────────────────
tresc = []

tresc.append(para(run('UMOWA POWIERZENIA PRZETWARZANIA DANYCH OSOBOWYCH',
                      bold=True, size=30), jc='center', po=60))
tresc.append(para(run('zawarta w Warszawie dnia ', size=20) +
                  run('…………………………', bold=True, italic=True, size=20) +
                  run(' r.', size=20), jc='center', po=240))

tresc.append(para(run('pomiędzy:', bold=True), po=100))
tresc.append(para(
    run('Olgą Trębicką', bold=True) +
    run(', prowadzącą działalność pod nazwą Przedszkole Niepubliczne „Kolorowe '
        'Przedszkole", ul. Lotaryńska 18, 03-974 Warszawa, NIP ') +
    run('……………………', bold=True, italic=True) +
    run(', REGON ') + run('……………………', bold=True, italic=True) +
    run(' — zwaną dalej ') + run('Administratorem', bold=True) + run(','), po=140))

tresc.append(para(run('a', bold=True), jc='center', po=140))

tresc.append(para(
    run('TRBK Michał Trębicki', bold=True) +
    run(', ') + run('……………………………………………', bold=True, italic=True) +
    run(', NIP ') + run('1132537306', bold=True) +
    run(' — zwanym dalej ') + run('Podmiotem przetwarzającym', bold=True) +
    run(','), po=140))

tresc.append(para(run('łącznie zwanymi ') + run('Stronami', bold=True) + run('.'), po=200))

tresc.append(paragraf(1, 'Przedmiot umowy'))
tresc.append(punkty([
    'Administrator powierza Podmiotowi przetwarzającemu przetwarzanie danych '
    'osobowych w zakresie i celu określonych w niniejszej umowie, na zasadach '
    'wynikających z art. 28 rozporządzenia Parlamentu Europejskiego i Rady (UE) '
    '2016/679 z dnia 27 kwietnia 2016 r. (RODO).',
    'Powierzenie następuje w związku ze świadczeniem przez Podmiot przetwarzający '
    'usług informatycznych: prowadzenia i utrzymania strony internetowej '
    'koloroweprzedszkole.com, formularza danych do umowy dostępnego pod adresem '
    '/dla-rodzicow oraz mechanizmu generującego dokumenty na podstawie danych '
    'z tego formularza.',
    'Podmiot przetwarzający oświadcza, że dysponuje wiedzą, doświadczeniem '
    'i środkami technicznymi pozwalającymi na wykonanie umowy zgodnie z RODO.',
]))

tresc.append(paragraf(2, 'Zakres i cel przetwarzania'))
tresc.append(punkty([
    'Podmiot przetwarzający przetwarza dane wyłącznie w celu, o którym mowa '
    'w § 1 ust. 2, i wyłącznie na udokumentowane polecenie Administratora.',
    'Powierzenie obejmuje dane osobowe następujących kategorii osób:',
]))
tresc.append(podpunkty([
    'dzieci uczęszczających do placówki oraz kandydatów na wychowanków,',
    'rodziców i opiekunów prawnych,',
    'osób upoważnionych przez rodziców do odbioru dziecka.',
]))
tresc.append(punkty([
    'Zakres powierzonych danych obejmuje: imiona i nazwisko, datę urodzenia '
    'i numer PESEL dziecka, adres zamieszkania i zameldowania, imiona '
    'i nazwiska rodziców lub opiekunów prawnych, ich adresy, numery telefonów '
    'i adresy e-mail, dane osób upoważnionych do odbioru dziecka wraz '
    'z rodzajem i numerem dokumentu tożsamości oraz treść zgód na '
    'wykorzystanie wizerunku.',
    'Powierzenie nie obejmuje danych szczególnych kategorii w rozumieniu '
    'art. 9 RODO. Informacje o stanie zdrowia, alergiach i diecie dziecka '
    'zbierane są przez Administratora wyłącznie w formie papierowej i nie są '
    'wprowadzane do systemów objętych niniejszą umową.',
    'Przetwarzanie polega na: zbieraniu danych za pośrednictwem formularza, '
    'przechowywaniu ich w środowisku Google Workspace, generowaniu na ich '
    'podstawie dokumentów oraz usuwaniu danych na polecenie Administratora.',
], start=3))

tresc.append(paragraf(3, 'Obowiązki Podmiotu przetwarzającego'))
tresc.append(para(run('Podmiot przetwarzający zobowiązuje się do:'), po=100))
tresc.append(podpunkty([
    'przetwarzania danych wyłącznie na udokumentowane polecenie Administratora, '
    'chyba że obowiązek przetwarzania nakłada na niego prawo Unii lub prawo '
    'polskie — w takim przypadku informuje Administratora przed rozpoczęciem '
    'przetwarzania, o ile prawo tego nie zabrania;',
    'zapewnienia, by osoby upoważnione do przetwarzania danych zobowiązały się '
    'do zachowania tajemnicy;',
    'wdrożenia środków technicznych i organizacyjnych odpowiadających ryzyku, '
    'zgodnie z art. 32 RODO, w szczególności: kontroli dostępu opartej na '
    'kontach imiennych z uwierzytelnianiem dwuskładnikowym, szyfrowania '
    'transmisji (HTTPS), ograniczenia dostępu do niezbędnego minimum oraz '
    'korzystania z kopii zapasowych zapewnianych przez dostawcę usługi;',
    'pomagania Administratorowi w realizacji obowiązków wynikających z art. '
    '32–36 RODO oraz w odpowiadaniu na żądania osób, których dane dotyczą;',
    'zgłoszenia Administratorowi każdego naruszenia ochrony danych osobowych '
    'bez zbędnej zwłoki, nie później niż w ciągu 24 godzin od jego stwierdzenia;',
    'udostępniania Administratorowi informacji niezbędnych do wykazania '
    'spełnienia obowiązków z art. 28 RODO oraz umożliwienia audytów.',
]))

tresc.append(paragraf(4, 'Dalsze powierzenie'))
tresc.append(punkty([
    'Administrator wyraża ogólną zgodę na korzystanie przez Podmiot '
    'przetwarzający z usług dalszych podmiotów przetwarzających, wskazanych '
    'w ust. 2, przy zachowaniu warunków ochrony danych nie mniej '
    'rygorystycznych niż wynikające z niniejszej umowy.',
    'Na dzień zawarcia umowy dalszymi podmiotami przetwarzającymi są:',
]))
tresc.append(podpunkty([
    'Google Ireland Limited — usługa Google Workspace: przechowywanie arkusza '
    'z danymi, generowanie dokumentów i wysyłka wiadomości e-mail;',
    'Vercel Inc. — hosting strony internetowej. Vercel nie przechowuje danych '
    'osobowych z formularza; obsługuje wyłącznie ruch przeglądarki rodzica.',
]))
tresc.append(punkty([
    'Podmiot przetwarzający informuje Administratora o zamiarze zmiany '
    'dalszych podmiotów przetwarzających, dając mu możliwość wyrażenia '
    'sprzeciwu.',
    'Podmiot przetwarzający ponosi wobec Administratora pełną '
    'odpowiedzialność za działania i zaniechania dalszych podmiotów '
    'przetwarzających.',
], start=3))

tresc.append(paragraf(5, 'Czas trwania i zakończenie'))
tresc.append(punkty([
    'Umowa zostaje zawarta na czas świadczenia usług, o których mowa w § 1 '
    'ust. 2, i wygasa z chwilą zakończenia współpracy Stron.',
    'Każda ze Stron może wypowiedzieć umowę z zachowaniem miesięcznego okresu '
    'wypowiedzenia. Administrator może wypowiedzieć umowę ze skutkiem '
    'natychmiastowym w razie istotnego naruszenia jej postanowień przez '
    'Podmiot przetwarzający.',
    'Po zakończeniu świadczenia usług Podmiot przetwarzający — zgodnie '
    'z decyzją Administratora — zwraca mu wszelkie powierzone dane albo je '
    'usuwa, w tym kasuje istniejące kopie, chyba że prawo nakazuje ich '
    'dalsze przechowywanie. Wykonanie tego obowiązku Podmiot przetwarzający '
    'potwierdza pisemnie lub pocztą elektroniczną w terminie 30 dni.',
]))

tresc.append(paragraf(6, 'Odpowiedzialność'))
tresc.append(punkty([
    'Podmiot przetwarzający odpowiada za szkody spowodowane przetwarzaniem '
    'danych niezgodnie z niniejszą umową lub z RODO.',
    'Podmiot przetwarzający, który przetwarza dane poza udokumentowanym '
    'poleceniem Administratora, staje się w tym zakresie administratorem '
    'tych danych.',
]))

tresc.append(paragraf(7, 'Postanowienia końcowe'))
tresc.append(punkty([
    'Wszelkie zmiany umowy wymagają formy pisemnej albo dokumentowej pod '
    'rygorem nieważności.',
    'W sprawach nieuregulowanych stosuje się przepisy RODO, ustawy o ochronie '
    'danych osobowych oraz Kodeksu cywilnego.',
    'Spory rozstrzyga sąd właściwy dla siedziby Administratora.',
    'Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla '
    'każdej ze Stron.',
]))

# ── Podpisy ──────────────────────────────────────────────────────────────
tresc.append(para(run(''), przed=400, po=0))
tresc.append(
    '<w:p><w:pPr><w:tabs>'
    '<w:tab w:val="center" w:pos="2600"/><w:tab w:val="center" w:pos="7400"/>'
    '</w:tabs><w:spacing w:before="240" w:after="60"/></w:pPr>'
    '<w:r>%s<w:tab/><w:t>………………………………………</w:t><w:tab/>'
    '<w:t>………………………………………</w:t></w:r></w:p>' % rpr()
)
tresc.append(
    '<w:p><w:pPr><w:tabs>'
    '<w:tab w:val="center" w:pos="2600"/><w:tab w:val="center" w:pos="7400"/>'
    '</w:tabs><w:spacing w:after="0"/></w:pPr>'
    '<w:r>%s<w:tab/><w:t>Administrator</w:t><w:tab/>'
    '<w:t>Podmiot przetwarzający</w:t></w:r></w:p>' % rpr(size=16, color='6B6F8C')
)

# ── Złożenie pliku ───────────────────────────────────────────────────────
praca = 'powierzenie_tmp'
if os.path.exists(praca):
    shutil.rmtree(praca)
with zipfile.ZipFile(KONTENER) as z:
    z.extractall(praca)

sciezka = os.path.join(praca, 'word/document.xml')
stary = open(sciezka, encoding='utf-8').read()

naglowek = stary[:stary.index('<w:body>') + len('<w:body>')]
sectpr = re.search(r'<w:sectPr.*?</w:sectPr>', stary, re.S).group(0)
logo = re.search(r'<w:p[^>]*>(?:(?!</w:p>).)*?<w:drawing>.*?</w:p>', stary, re.S).group(0)

nowy = naglowek + logo + ''.join(tresc) + sectpr + '</w:body></w:document>'
open(sciezka, 'w', encoding='utf-8').write(nowy)

if os.path.exists(WYNIK):
    os.remove(WYNIK)
with zipfile.ZipFile(WYNIK, 'w', zipfile.ZIP_DEFLATED) as z:
    for katalog, _, pliki in os.walk(praca):
        for plik in pliki:
            pelna = os.path.join(katalog, plik)
            z.write(pelna, os.path.relpath(pelna, praca))
shutil.rmtree(praca)

print('→ %s (%d KB)' % (WYNIK, os.path.getsize(WYNIK) // 1024))

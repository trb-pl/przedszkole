# -*- coding: utf-8 -*-
"""Buduje szablon Załącznika nr 2 (zgoda na wizerunek) z polami {{...}}.
Bazuje na ostylowanej umowie, więc dziedziczy logo, font Nunito i stopkę."""
import os, re, shutil, zipfile
from xml.etree import ElementTree as ET

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ET.register_namespace('w', W)

NAVY, TEAL, FONT = '2D346F', '34BBA8', 'Nunito'
LINIA = 'CACCDB'

src, work = 'Umowa_SZABLON_2026_2027_brand.docx', 'zal2'
if os.path.exists(work): shutil.rmtree(work)
os.makedirs(work)
with zipfile.ZipFile(src) as z: z.extractall(work)

doc_path = os.path.join(work, 'word/document.xml')
stary = open(doc_path, encoding='utf-8').read()

# Zachowujemy nagłówek dokumentu (deklaracje przestrzeni nazw), logo i sectPr
naglowek_xml = stary[:stary.index('<w:body>') + len('<w:body>')]
sectpr = re.search(r'<w:sectPr.*?</w:sectPr>', stary, re.S).group(0)
logo_p = re.search(r'<w:p[^>]*>(?:(?!</w:p>).)*?<w:drawing>.*?</w:p>', stary, re.S).group(0)

def rpr(*, bold=False, italic=False, color=None, size=None):
    s = f'<w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:cs="{FONT}"/>'
    if bold: s += '<w:b/><w:bCs/>'
    if italic: s += '<w:i/><w:iCs/>'
    if color: s += f'<w:color w:val="{color}"/>'
    if size: s += f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>'
    return f'<w:rPr>{s}</w:rPr>'

def run(tekst, **kw):
    t = (tekst.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;'))
    return f'<w:r>{rpr(**kw)}<w:t xml:space="preserve">{t}</w:t></w:r>'

def para(tresc, *, jc=None, przed=0, po=120, border=False):
    p = '<w:pPr>'
    if jc: p += f'<w:jc w:val="{jc}"/>'
    if border: p += f'<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="4" w:color="{LINIA}"/></w:pBdr>'
    p += f'<w:spacing w:before="{przed}" w:after="{po}"/></w:pPr>'
    return f'<w:p>{p}{tresc}</w:p>'

def komorka(tresc, szer, *, jc=None, cieniowanie=None):
    tc = f'<w:tcPr><w:tcW w:w="{szer}" w:type="dxa"/><w:vAlign w:val="center"/>'
    if cieniowanie: tc += f'<w:shd w:val="clear" w:color="auto" w:fill="{cieniowanie}"/>'
    tc += '</w:tcPr>'
    jc_xml = f'<w:jc w:val="{jc}"/>' if jc else ''
    return (f'<w:tc>{tc}<w:p><w:pPr>{jc_xml}'
            f'<w:spacing w:before="60" w:after="60"/></w:pPr>{tresc}</w:p></w:tc>')

# ── Wiersze tabeli zgód ──────────────────────────────────────────────────
ZGODY = [
    ('Udostępnianie zdjęć i nagrań w zamkniętej grupie dostępnej wyłącznie dla rodziców i opiekunów dzieci z placówki.', 'APLIKACJA'),
    ('Publikacja na oficjalnej stronie internetowej przedszkola: koloroweprzedszkole.com', 'WWW'),
    ('Publikacja na oficjalnym profilu przedszkola na Facebooku.', 'FACEBOOK'),
    ('Publikacja na oficjalnym profilu przedszkola na Instagramie: @koloroweprzedszkole', 'INSTAGRAM'),
    ('Wykorzystanie w drukowanych materiałach informacyjnych i promocyjnych przedszkola, np. kronice, gazetce, plakacie lub ulotce.', 'DRUK'),
]

SZER = [5400, 2100, 2100]
wiersze = ['<w:tr><w:trPr><w:tblHeader/></w:trPr>'
           + komorka(run('Zakres', bold=True, color=NAVY, size=18), SZER[0], cieniowanie='F3F4F8')
           + komorka(run('Wyrażam zgodę', bold=True, color=NAVY, size=18), SZER[1], jc='center', cieniowanie='F3F4F8')
           + komorka(run('Nie wyrażam zgody', bold=True, color=NAVY, size=18), SZER[2], jc='center', cieniowanie='F3F4F8')
           + '</w:tr>']

for opis, klucz in ZGODY:
    wiersze.append(
        '<w:tr>'
        + komorka(run(opis, size=18), SZER[0])
        + komorka(run('{{WIZ_%s_TAK}}' % klucz, bold=True, color=TEAL, size=28), SZER[1], jc='center')
        + komorka(run('{{WIZ_%s_NIE}}' % klucz, bold=True, color=NAVY, size=28), SZER[2], jc='center')
        + '</w:tr>')

tabela = (
    '<w:tbl><w:tblPr><w:tblW w:w="9600" w:type="dxa"/>'
    f'<w:tblBorders>'
    f'<w:top w:val="single" w:sz="4" w:color="{LINIA}"/>'
    f'<w:left w:val="single" w:sz="4" w:color="{LINIA}"/>'
    f'<w:bottom w:val="single" w:sz="4" w:color="{LINIA}"/>'
    f'<w:right w:val="single" w:sz="4" w:color="{LINIA}"/>'
    f'<w:insideH w:val="single" w:sz="4" w:color="{LINIA}"/>'
    f'<w:insideV w:val="single" w:sz="4" w:color="{LINIA}"/>'
    '</w:tblBorders><w:tblCellMar>'
    '<w:top w:w="80" w:type="dxa"/><w:left w:w="120" w:type="dxa"/>'
    '<w:bottom w:w="80" w:type="dxa"/><w:right w:w="120" w:type="dxa"/>'
    '</w:tblCellMar></w:tblPr>'
    '<w:tblGrid>' + ''.join('<w:gridCol w:w="%d"/>' % s for s in SZER) + '</w:tblGrid>'
    + ''.join(wiersze) + '</w:tbl>'
)

AKAPITY_CEL = [
    'Zgoda obejmuje utrwalanie zdjęć i nagrań audio-wideo powstających podczas zajęć, uroczystości i wydarzeń przedszkolnych oraz ich wykorzystanie w celu dokumentowania życia placówki, informowania rodziców i — wyłącznie w zaznaczonych kanałach publicznych — promocji działalności przedszkola.',
    'Materiały nie będą opatrzone pełnym imieniem i nazwiskiem dziecka bez odrębnej zgody.',
    'Przedszkole nie będzie publikować materiałów naruszających godność lub prywatność dziecka ani przedstawiających je w sytuacjach intymnych, ośmieszających lub mogących wywołać poczucie wstydu.',
    'Dopuszczalne są zwykłe czynności redakcyjne, takie jak kadrowanie, korekta jasności i zestawienie materiałów, o ile nie zmieniają sensu ani kontekstu wypowiedzi lub zachowania dziecka.',
    'Materiały nie będą wykorzystywane do rozpoznawania twarzy, trenowania modeli sztucznej inteligencji ani przekazywane innym podmiotom do ich własnych celów promocyjnych bez odrębnej podstawy.',
]

WYCOFANIE = ('Zgoda jest dobrowolna i obowiązuje w roku szkolnym {{ROK_SZKOLNY}}, nie dłużej jednak niż do jej wycofania. '
             'Można ją wycofać w każdym czasie, kontaktując się z przedszkolem mailowo na adres przedszkole@kolorowe.eu '
             'lub pisemnie. Wycofanie zgody nie wpływa na zgodność z prawem działań dokonanych przed jej wycofaniem. '
             'Administrator usunie materiały z kontrolowanych przez siebie kanałów w rozsądnym terminie, z zastrzeżeniem, '
             'że całkowite usunięcie kopii wcześniej rozpowszechnionych w internecie może nie być możliwe.')

body = [logo_p]

body.append(para(run('Załącznik nr 2 do umowy nr {{NR_UMOWY}}', color=TEAL, bold=True, size=18), jc='center', po=60))
body.append(para(run('ZGODA NA UTRWALANIE I ROZPOWSZECHNIANIE WIZERUNKU ORAZ GŁOSU DZIECKA', bold=True, color=NAVY, size=28), jc='center', po=60))
body.append(para(run('Przedszkole Niepubliczne „Kolorowe Przedszkole" · rok szkolny {{ROK_SZKOLNY}}', size=18, color=NAVY), jc='center', po=240))

body.append(para(run('Imię i nazwisko dziecka: ', size=20) + run('{{DZIECKO}}', italic=True, bold=True, color=NAVY, size=20), po=200))

body.append(para(run('Administrator danych', bold=True, color=NAVY, size=20), po=60, border=True))
body.append(para(run('Olga Trębicka, Przedszkole Niepubliczne „Kolorowe Przedszkole", ul. Lotaryńska 18, 03-974 Warszawa. '
                     'Kontakt: przedszkole@kolorowe.eu, tel. 605 657 366.', size=18), po=200))

body.append(para(run('Decyzje rodzica / opiekuna prawnego', bold=True, color=NAVY, size=20), po=60, border=True))
body.append(para(run('Poniższe decyzje pochodzą z formularza wypełnionego przez rodzica. Brak zgody w jednym zakresie nie wpływa '
                     'na pozostałe decyzje ani na możliwość udziału dziecka w zajęciach i wydarzeniach.', size=18, italic=True), po=120))
body.append(tabela)
body.append(para(run(' ', size=12), po=200))

body.append(para(run('Cel i warunki wykorzystania', bold=True, color=NAVY, size=20), po=60, border=True))
for a in AKAPITY_CEL:
    body.append(para(run(a, size=18), po=100))

body.append(para(run('Czas obowiązywania i wycofanie zgody', bold=True, color=NAVY, size=20), przed=120, po=60, border=True))
body.append(para(run(WYCOFANIE, size=18), po=240))

body.append(para(run('☐  ', size=22) + run('Potwierdzam, że przed podjęciem decyzji wysłuchałem/am zdania dziecka w sposób '
                                           'odpowiedni do jego wieku i dojrzałości.', size=18), po=400))

# Data podpisania jest wspólna dla całej teczki i wchodzi z CONFIG.DATA_UMOWY,
# więc rodzic wpisuje przy podpisie tylko swoje nazwisko. Jedna data na
# umowie i załącznikach zamiast czterech pisanych ręcznie.
body.append(para(run('Warszawa, dnia ', size=18) +
                 run('{{DATA_UMOWY}}', bold=True, italic=True, size=18), jc='right', po=300))

body.append(para(run('.................................................                    '
                     '.................................................', size=18), jc='center', po=40))
body.append(para(run('czytelny podpis rodzica / opiekuna 1                    '
                     'czytelny podpis rodzica / opiekuna 2', size=14, color=NAVY), jc='center', po=0))

nowy = naglowek_xml + ''.join(body) + sectpr + '</w:body></w:document>'
open(doc_path, 'w', encoding='utf-8').write(nowy)

out = 'Zalacznik2_Wizerunek_SZABLON.docx'
if os.path.exists(out): os.remove(out)
zf = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED)
for folder, _, files in os.walk(work):
    for f in files:
        full = os.path.join(folder, f)
        zf.write(full, os.path.relpath(full, work))
zf.close()
print('→', out)

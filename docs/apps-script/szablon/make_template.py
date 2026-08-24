import re, shutil, zipfile, os
from xml.etree import ElementTree as ET

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ET.register_namespace('w', W)
def q(t): return '{%s}%s' % (W, t)

src = os.path.expanduser('~/Downloads/Umowa_Kolorowe_Przedszkole_2026_2027_edytowalna (2).docx')
work = 'tpl'
if os.path.exists(work): shutil.rmtree(work)
os.makedirs(work)
with zipfile.ZipFile(src) as z: z.extractall(work)

path = os.path.join(work, 'word/document.xml')
tree = ET.parse(path)
root = tree.getroot()

def ptext(p):
    return ''.join(t.text or '' for t in p.iter(q('t')))

def set_ptext(p, new):
    """Replace paragraph content with a single run, keeping first run's formatting."""
    runs = p.findall(q('r'))
    if not runs: return False
    keep = runs[0]
    rpr = keep.find(q('rPr'))
    for r in runs[1:]: p.remove(r)
    for t in list(keep.findall(q('t'))): keep.remove(t)
    for br in list(keep.findall(q('br'))): keep.remove(br)
    t = ET.SubElement(keep, q('t'))
    t.text = new
    t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    return True

DOTS = r'[.…_\s]{6,}$'

# (regex na tekst akapitu, funkcja zwracająca nowy tekst)
RULES = [
    (r'^UMOWA nr\s*[.…]*\s*$',                    lambda m: 'UMOWA nr {{NR_UMOWY}}'),
    (r'^(Zawarta dnia)\s*[.…]+\s*(pomiędzy.*)$',  lambda m: f'{m.group(1)} {{{{DATA_UMOWY}}}} {m.group(2)}'),
    (r'^(Adres zamieszkania:)\s*[.…]+\s*$',       lambda m: f'{m.group(1)} {{{{RODZICE_ADRES}}}}'),
    (r'^(Telefon:)\s*[.…]+\s*$',                  lambda m: f'{m.group(1)} {{{{RODZICE_TELEFON}}}}'),
    (r'^(E-mail:)\s*[.…]+\s*$',                   lambda m: f'{m.group(1)} {{{{RODZICE_EMAIL}}}}'),
    (r'^(Imiona:)\s*[.…]+\s*$',                   lambda m: f'{m.group(1)} {{{{DZIECKO_IMIONA}}}}'),
    (r'^(Nazwisko:)\s*[.…]+\s*$',                 lambda m: f'{m.group(1)} {{{{DZIECKO_NAZWISKO}}}}'),
    (r'^(Data urodzenia:)\s*[.…]+\s*$',           lambda m: f'{m.group(1)} {{{{DZIECKO_DATA_UR}}}}'),
    (r'^(PESEL:)\s*[.…]+\s*$',                    lambda m: f'{m.group(1)} {{{{DZIECKO_PESEL}}}}'),
    (r'^(Adres zamieszkania \(z kodem pocztowym\):)\s*[.…]+\s*$',  lambda m: f'{m.group(1)} {{{{DZIECKO_ADRES_ZAM}}}}'),
    (r'^(Adres zameldowania \(z kodem pocztowym\):)\s*[.…]+\s*$',  lambda m: f'{m.group(1)} {{{{DZIECKO_ADRES_ZAMEL}}}}'),
    (r'^(Dzielnica zamieszkania / zameldowania:)\s*[.…]+\s*$',     lambda m: f'{m.group(1)} {{{{DZIELNICA_ZAM}}}} / {{{{DZIELNICA_ZAMEL}}}}'),
    (r'^Dziecko uczęszcza do:.*$',                 lambda m: 'Dziecko uczęszcza do: {{PLACOWKA}}.'),
    (r'^\s*[.…]{20,}\s*$',                        lambda m: '{{RODZICE}}'),  # samotna linia kropek = rodzice
]

changed = []
body = root.find(q('body'))
paras = list(body.iter(q('p')))

seen_rodzice = False
for p in paras:
    txt = ptext(p).strip()
    if not txt: continue
    for pattern, repl in RULES:
        m = re.match(pattern, txt)
        if not m: continue
        # linia samych kropek: tylko pierwsza (rodzice), reszta to kontynuacje adresu
        if pattern.startswith(r'^\s*[.…]{20,}'):
            if seen_rodzice:
                set_ptext(p, '')
                changed.append('(usunięto pustą linię kropek)')
                break
            seen_rodzice = True
        new = repl(m)
        if set_ptext(p, new):
            changed.append(new[:70])
        break

# § 8 pkt 8 — e-mail do rachunków (placeholder w środku zdania)
for p in paras:
    txt = ptext(p)
    if 'na adres e-mail:' in txt:
        new = re.sub(r'(na adres e-mail:)\s*[.…]+', r'\1 {{EMAIL_RACHUNKI}}', txt)
        if new != txt and set_ptext(p, new):
            changed.append('§8: e-mail do rachunków')

# § 9 — cztery osoby upoważnione (w tabeli)
idx = 0
for p in paras:
    txt = ptext(p).strip()
    m = re.match(r'^(\d)\.\s*[.…]{10,}$', txt)
    if m and idx < 4:
        idx += 1
        if set_ptext(p, m.group(1) + '. {{UPOWAZNIONA_%d}}' % idx):
            changed.append('§9: upoważniona %d' % idx)

tree.write(path, xml_declaration=True, encoding='UTF-8')

out = 'Umowa_SZABLON_2026_2027.docx'
if os.path.exists(out): os.remove(out)
zf = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED)
for folder, _, files in os.walk(work):
    for f in files:
        full = os.path.join(folder, f)
        zf.write(full, os.path.relpath(full, work))
zf.close()
print('ZMIENIONE AKAPITY:')
for c in changed: print('  •', c)
print('\n→', out)

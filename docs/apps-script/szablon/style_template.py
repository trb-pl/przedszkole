import re, os, shutil, zipfile
from xml.etree import ElementTree as ET

W  = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R  = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'
A  = 'http://schemas.openxmlformats.org/drawingml/2006/main'
PIC= 'http://schemas.openxmlformats.org/drawingml/2006/picture'
for p, u in [('w',W),('r',R),('wp',WP),('a',A),('pic',PIC)]:
    ET.register_namespace(p, u)
def q(t): return '{%s}%s' % (W, t)

NAVY  = '2D346F'
TEAL  = '34BBA8'
FONT  = 'Nunito'

src  = 'Umowa_SZABLON_2026_2027.docx'
work = 'styled'
if os.path.exists(work): shutil.rmtree(work)
os.makedirs(work)
with zipfile.ZipFile(src) as z: z.extractall(work)

# ── 1. Logo do media + relacja + typ MIME ────────────────────────────────
os.makedirs(os.path.join(work,'word/media'), exist_ok=True)
shutil.copy('logo.png', os.path.join(work,'word/media/logo.png'))

rels_path = os.path.join(work,'word/_rels/document.xml.rels')
rels = ET.parse(rels_path); rroot = rels.getroot()
RID = 'rIdLogo'
ET.SubElement(rroot, '{http://schemas.openxmlformats.org/package/2006/relationships}Relationship', {
    'Id': RID,
    'Type': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
    'Target': 'media/logo.png',
})
rels.write(rels_path, xml_declaration=True, encoding='UTF-8')

ct_path = os.path.join(work,'[Content_Types].xml')
ct = open(ct_path, encoding='utf-8').read()
if 'Extension="png"' not in ct:
    ct = ct.replace('<Types ', '<Types ', 1)
    ct = re.sub(r'(<Types[^>]*>)', r'\1<Default Extension="png" ContentType="image/png"/>', ct, count=1)
    open(ct_path,'w',encoding='utf-8').write(ct)

# ── 2. Domyślny font w stylach ───────────────────────────────────────────
st_path = os.path.join(work,'word/styles.xml')
st = open(st_path, encoding='utf-8').read()
st = re.sub(r'<w:rFonts[^/]*?/>',
            f'<w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:cs="{FONT}"/>', st)
open(st_path,'w',encoding='utf-8').write(st)

# ── 3. document.xml ──────────────────────────────────────────────────────
doc_path = os.path.join(work,'word/document.xml')
tree = ET.parse(doc_path); root = tree.getroot()
body = root.find(q('body'))

def ptext(p):
    return ''.join(t.text or '' for t in p.iter(q('t')))

def rpr_of(r):
    rpr = r.find(q('rPr'))
    return ET.tostring(rpr, encoding='unicode') if rpr is not None else ''

def make_run(template_rpr_xml, text, *, italic=False, color=None, bold=None, size=None):
    r = ET.Element(q('r'))
    rpr = ET.fromstring(template_rpr_xml) if template_rpr_xml else ET.Element(q('rPr'))
    for tag in ('i','iCs'):
        for e in rpr.findall(q(tag)): rpr.remove(e)
    if italic:
        ET.SubElement(rpr, q('i')); ET.SubElement(rpr, q('iCs'))
    if color is not None:
        for e in rpr.findall(q('color')): rpr.remove(e)
        ET.SubElement(rpr, q('color'), {q('val'): color})
    if bold is not None:
        for tag in ('b','bCs'):
            for e in rpr.findall(q(tag)): rpr.remove(e)
        if bold:
            ET.SubElement(rpr, q('b')); ET.SubElement(rpr, q('bCs'))
    if size is not None:
        for tag in ('sz','szCs'):
            for e in rpr.findall(q(tag)): rpr.remove(e)
        ET.SubElement(rpr, q('sz'), {q('val'): str(size)})
        ET.SubElement(rpr, q('szCs'), {q('val'): str(size)})
    for e in rpr.findall(q('rFonts')): rpr.remove(e)
    rpr.insert(0, ET.Element(q('rFonts'), {q('ascii'):FONT, q('hAnsi'):FONT, q('cs'):FONT}))
    r.append(rpr)
    t = ET.SubElement(r, q('t')); t.text = text
    t.set('{http://www.w3.org/XML/1998/namespace}space','preserve')
    return r

PH = re.compile(r'(\{\{[A-Z_0-9]+\}\})')
zmian = {'placeholder':0, 'paragraf':0, 'sekcja':0}

for p in body.iter(q('p')):
    txt = ptext(p)
    if not txt.strip():
        continue

    runs = p.findall(q('r'))
    if not runs:
        continue
    wzor = rpr_of(runs[0])

    # § 1, § 2 … — akcent turkusowy, pogrubienie
    if re.fullmatch(r'§\s*\d+', txt.strip()):
        for r in runs: p.remove(r)
        p.append(make_run(wzor, txt.strip(), color=TEAL, bold=True, size=28))
        zmian['sekcja'] += 1
        continue

    # Tytuł umowy — granat, większy
    if txt.strip().startswith('UMOWA nr'):
        for r in runs: p.remove(r)
        p.append(make_run(wzor, txt.strip(), color=NAVY, bold=True, size=36))
        zmian['paragraf'] += 1
        continue

    # Akapity z polami — rozbijamy na fragmenty, pola kursywą w granacie
    if '{{' in txt:
        czesci = [c for c in PH.split(txt) if c != '']
        for r in runs: p.remove(r)
        for c in czesci:
            if PH.fullmatch(c):
                p.append(make_run(wzor, c, italic=True, color=NAVY, bold=True))
                zmian['placeholder'] += 1
            else:
                p.append(make_run(wzor, c))
        zmian['paragraf'] += 1

# Ujednolicenie fontu we wszystkich pozostałych runach
for r in body.iter(q('r')):
    rpr = r.find(q('rPr'))
    if rpr is None:
        rpr = ET.Element(q('rPr')); r.insert(0, rpr)
    for e in rpr.findall(q('rFonts')): rpr.remove(e)
    rpr.insert(0, ET.Element(q('rFonts'), {q('ascii'):FONT, q('hAnsi'):FONT, q('cs'):FONT}))

# ── 4. Logo na samej górze ───────────────────────────────────────────────
SZER_EMU = 1900000                      # ok. 5 cm
WYS_EMU  = int(SZER_EMU / 4.05)

logo_xml = f'''<w:p xmlns:w="{W}" xmlns:r="{R}" xmlns:wp="{WP}" xmlns:a="{A}" xmlns:pic="{PIC}">
  <w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr>
  <w:r><w:drawing>
    <wp:inline distT="0" distB="0" distL="0" distR="0">
      <wp:extent cx="{SZER_EMU}" cy="{WYS_EMU}"/>
      <wp:effectExtent l="0" t="0" r="0" b="0"/>
      <wp:docPr id="99" name="Logo Kolorowe Przedszkole"/>
      <wp:cNvGraphicFramePr/>
      <a:graphic><a:graphicData uri="{PIC}">
        <pic:pic>
          <pic:nvPicPr><pic:cNvPr id="0" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr>
          <pic:blipFill><a:blip r:embed="{RID}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
          <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{SZER_EMU}" cy="{WYS_EMU}"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
        </pic:pic>
      </a:graphicData></a:graphic>
    </wp:inline>
  </w:drawing></w:r>
</w:p>'''

body.insert(0, ET.fromstring(logo_xml))
tree.write(doc_path, xml_declaration=True, encoding='UTF-8')


# ── 4b. Stopka: adres strony nad numeracją ───────────────────────────────
ftr_path = os.path.join(work, 'word/footer1.xml')
if os.path.exists(ftr_path):
    ftr = open(ftr_path, encoding='utf-8').read()
    if 'koloroweprzedszkole.com' not in ftr:
        akapit = (
            '<w:p><w:pPr><w:pStyle w:val="Stopka"/><w:jc w:val="center"/>'
            '<w:spacing w:after="0"/></w:pPr>'
            f'<w:r><w:rPr><w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:cs="{FONT}"/>'
            f'<w:color w:val="{NAVY}"/><w:sz w:val="15"/><w:szCs w:val="15"/></w:rPr>'
            '<w:t>www.koloroweprzedszkole.com</w:t></w:r></w:p>'
        )
        # wstawiamy przed pierwszym akapitem stopki (nad numerem strony)
        i = ftr.index('<w:p ')
        ftr = ftr[:i] + akapit + ftr[i:]
        open(ftr_path, 'w', encoding='utf-8').write(ftr)
        print('Stopka: dodano adres strony')

# ── 5. Spakowanie ────────────────────────────────────────────────────────
out = 'Umowa_SZABLON_2026_2027_brand.docx'
if os.path.exists(out): os.remove(out)
zf = zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED)
for folder,_,files in os.walk(work):
    for f in files:
        full = os.path.join(folder,f)
        zf.write(full, os.path.relpath(full, work))
zf.close()

print('Pola w kursywie:', zmian['placeholder'])
print('Nagłówki §:', zmian['sekcja'])
print('Przebudowane akapity:', zmian['paragraf'])
print('→', out)

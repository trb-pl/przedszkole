import sys, zipfile, re
from xml.etree import ElementTree as ET
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
def text(path):
    z=zipfile.ZipFile(path)
    root=ET.fromstring(z.read('word/document.xml'))
    out=[]
    body=root.find('w:body',NS)
    def para_text(p):
        return ''.join(t.text or '' for t in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'))
    for el in body:
        tag=el.tag.split('}')[1]
        if tag=='p':
            t=para_text(el).strip()
            if t: out.append(t)
        elif tag=='tbl':
            for row in el.findall('w:tr',NS):
                cells=[' '.join(para_text(p).strip() for p in c.findall('w:p',NS)).strip() for c in row.findall('w:tc',NS)]
                out.append(' | '.join(cells))
    return '\n'.join(out)
print(text(sys.argv[1]))

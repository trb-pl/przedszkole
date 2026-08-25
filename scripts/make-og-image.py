# -*- coding: utf-8 -*-
"""Builds the site-wide Open Graph card (public/og-default.jpg).

Rendered once and committed — link previews in WhatsApp, iMessage, Messenger
and LinkedIn read a static file, so there is no reason to generate it at
build time. Kept in the repo so the card can be rebuilt when the logo or the
lead photo changes.

Constraints that drive the design:
  * 1200x630 — the size every scraper expects
  * under ~300 KB — WhatsApp silently drops previews for heavy images
  * readable as a thumbnail — the logo has to survive being shown 200 px wide
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FOTO = os.path.join(ROOT, 'public/og-image.jpg')
LOGO = os.path.join(ROOT, 'docs/apps-script/szablon/logo.png')
WYNIK = os.path.join(ROOT, 'public/og-default.jpg')
FONT = '/System/Library/Fonts/SFNSRounded.ttf'  # kształtem najbliższy Nunito

SZER, WYS = 1200, 630
KREM = (252, 246, 240)
GRANAT = (45, 52, 111)
TURKUS = (52, 187, 168)

PANEL = 700          # szerokość kremowego panelu z logo
MARGINES = 72

karta = Image.new('RGB', (SZER, WYS), KREM)

# ── Zdjęcie po prawej ────────────────────────────────────────────────────
foto = Image.open(FOTO).convert('RGB')
doc_szer, doc_wys = SZER - PANEL, WYS
skala = max(doc_szer / foto.width, doc_wys / foto.height)
foto = foto.resize((round(foto.width * skala), round(foto.height * skala)), Image.LANCZOS)

# Kadrujemy do prawej krawędzi — twarze dzieci siedzą w prawej części ujęcia.
lewo = foto.width - doc_szer
gora = max(0, (foto.height - doc_wys) // 2)
foto = foto.crop((lewo, gora, lewo + doc_szer, gora + doc_wys))
karta.paste(foto, (PANEL, 0))

# Miękkie przejście panel → zdjęcie, żeby styk nie był twardą pionową linią.
rozmycie = 90
maska = Image.linear_gradient('L').rotate(270, expand=True).resize((rozmycie, WYS))
karta.paste(Image.new('RGB', (rozmycie, WYS), KREM), (PANEL, 0), maska)

# ── Logo ─────────────────────────────────────────────────────────────────
logo = Image.open(LOGO).convert('RGB')
# Logo przyszło z białym tłem — wycinamy je, żeby nie zrobiło białej płyty
# na kremowym panelu.
alpha = logo.convert('L').point(lambda p: 0 if p > 244 else 255)
logo.putalpha(alpha)

logo_szer = PANEL - 2 * MARGINES
logo = logo.resize((logo_szer, round(logo.height * logo_szer / logo.width)), Image.LANCZOS)
logo_y = 168
karta.paste(logo, (MARGINES, logo_y), logo)

# ── Napisy ───────────────────────────────────────────────────────────────
rys = ImageDraw.Draw(karta)
f_duzy = ImageFont.truetype(FONT, 40)
f_maly = ImageFont.truetype(FONT, 27)

y = logo_y + logo.height + 54
rys.text((MARGINES, y), 'Saska Kępa i Gocław · od 1991 roku', font=f_duzy, fill=GRANAT)
rys.text((MARGINES, y + 62), 'koloroweprzedszkole.com', font=f_maly, fill=TURKUS)

# Turkusowy pasek u dołu — sygnał marki widoczny nawet w miniaturze.
rys.rectangle([0, WYS - 10, SZER, WYS], fill=TURKUS)

karta.save(WYNIK, 'JPEG', quality=88, optimize=True, progressive=True)
print('→ %s (%d KB)' % (WYNIK, os.path.getsize(WYNIK) // 1024))

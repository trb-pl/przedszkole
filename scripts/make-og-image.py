# -*- coding: utf-8 -*-
"""Builds the site-wide Open Graph card (public/og-default.jpg).

Rendered once and committed — link previews in WhatsApp, iMessage, Messenger
and LinkedIn read a static file, so there is no reason to generate it at
build time. Kept in the repo so the card can be rebuilt when the logo
changes.

Constraints that drive the design:
  * 1200x630 — the size every scraper expects
  * under ~300 KB — WhatsApp silently drops previews for heavy images
  * readable as a thumbnail — the logo has to survive being shown 200 px wide
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

LOGO = os.path.join(ROOT, 'docs/apps-script/szablon/logo.png')
WYNIK = os.path.join(ROOT, 'public/og-default.jpg')
FONT = '/System/Library/Fonts/SFNSRounded.ttf'  # kształtem najbliższy Nunito

SZER, WYS = 1200, 630
KREM = (252, 246, 240)
GRANAT = (45, 52, 111)
TURKUS = (52, 187, 168)

karta = Image.new('RGB', (SZER, WYS), KREM)
rys = ImageDraw.Draw(karta)

# ── Logo ─────────────────────────────────────────────────────────────────
logo = Image.open(LOGO).convert('RGB')
# Logo przyszło z białym tłem — wycinamy je, żeby nie zrobiło białej płyty
# na kremowym tle.
logo.putalpha(logo.convert('L').point(lambda p: 0 if p > 244 else 255))

logo_szer = 700
logo = logo.resize((logo_szer, round(logo.height * logo_szer / logo.width)), Image.LANCZOS)

# Blok logo + podpisy wyśrodkowany optycznie: liczymy jego łączną wysokość
# i dopiero wtedy ustawiamy górną krawędź.
f_duzy = ImageFont.truetype(FONT, 38)
f_maly = ImageFont.truetype(FONT, 26)
ODSTEP_1, ODSTEP_2 = 56, 26

h_duzy = rys.textbbox((0, 0), 'Ag', font=f_duzy)[3]
h_maly = rys.textbbox((0, 0), 'Ag', font=f_maly)[3]
blok = logo.height + ODSTEP_1 + h_duzy + ODSTEP_2 + h_maly
gora = (WYS - blok) // 2

karta.paste(logo, ((SZER - logo_szer) // 2, gora), logo)

# ── Napisy ───────────────────────────────────────────────────────────────
y = gora + logo.height + ODSTEP_1
rys.text((SZER // 2, y), 'Saska Kępa i Gocław · od 1991 roku',
         font=f_duzy, fill=GRANAT, anchor='ma')
rys.text((SZER // 2, y + h_duzy + ODSTEP_2), 'koloroweprzedszkole.com',
         font=f_maly, fill=TURKUS, anchor='ma')

# Turkusowy pasek u dołu — sygnał marki widoczny nawet w miniaturze.
rys.rectangle([0, WYS - 10, SZER, WYS], fill=TURKUS)

karta.save(WYNIK, 'JPEG', quality=90, optimize=True, progressive=True)
print('→ %s (%d KB)' % (WYNIK, os.path.getsize(WYNIK) // 1024))

#!/usr/bin/env python3
"""
nap_consistency.py — sprawdza spojnosc NAP (Name / Address / Phone) w repo.

NAP to fundament local SEO: Google i LLM-y ufaja firmie, ktorej dane sa
IDENTYCZNE wszedzie (config, schema JSON-LD, stopka, kontakt, lokalizacje).
Kazda rozbieznosc oslabia dopasowanie do wizytowki Google Business Profile.

UNIWERSALNY — kanoniczny NAP czytany z pliku JSON (--nap nap.json) albo
z domyslnych wartosci. Dziala dla dowolnego klienta, nie tylko przedszkola.

Uzycie:
    python3 nap_consistency.py [repo] [--nap nap.json]

nap.json (przyklad):
    {
      "name": "Kolorowe Przedszkole",
      "phones": ["+48 605 657 366"],
      "emails": ["przedszkole@kolorowe.eu"],
      "postals": ["03-974", "03-934"]
    }

Wynik: JSON na stdout — warianty znalezione vs kanoniczne + lista issues.
"""
import sys
import re
import json
import argparse
from pathlib import Path

# --- Wzorce ---------------------------------------------------------------
# Telefon: wymaga prefiksu +48 LUB separatorow (spacja/myslnik) miedzy grupami.
# To eliminuje gole ciagi cyfr z kodu (1000000000, wspolrzedne, hexy).
PHONE_RE = re.compile(
    r"\+48[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{3}\b"     # +48-605-657-366 / +48 605 657 366 / +48605657366
    r"|\b\d{3}[\s\-]\d{3}[\s\-]\d{3}\b"                # 605-657-366 / 605 657 366 (z separatorami)
)
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
# Bloki kolorow CSS — rgb()/rgba()/hsl() wygladaja jak telefon (np. "229 236 246")
CSS_COLOR_RE = re.compile(r"(?:rgba?|hsla?)\s*\([^)]*\)", re.IGNORECASE)
POSTAL_RE = re.compile(r"\b\d{2}-\d{3}\b")
# Placeholdery do zignorowania (czeste w szablonach)
PLACEHOLDER_EMAILS = {"jan@example.com", "john@example.com", "email@example.com",
                      "somecoolemail@domain.com", "your@email.com"}
PLACEHOLDER_PHONES = {"000000000", "48000000000", "123456789", "48123456789",
                      "600000000", "48600000000"}

DEFAULT_NAP = {
    "name": "Kolorowe Przedszkole",
    "phones": ["+48 605 657 366"],
    "emails": ["przedszkole@kolorowe.eu"],
    "postals": ["03-974", "03-934"],  # Lotarynska + Zakopianska (oba poprawne)
}


def norm_phone(raw: str) -> str:
    d = re.sub(r"\D", "", raw)
    if len(d) == 9:
        d = "48" + d
    return d


def scan_repo(root: Path) -> dict:
    f_phones, f_emails, f_postals, name_hits = {}, {}, {}, []
    scanned = 0
    patterns = ("src/**/*.astro", "src/**/*.ts", "src/**/*.yaml", "src/**/*.yml",
                "src/**/*.md", "content/**/*.md", "*.yaml", "*.yml")
    seen = set()
    for pat in patterns:
        for f in root.glob(pat):
            if not f.is_file() or f in seen:
                continue
            seen.add(f)
            try:
                text = f.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            scanned += 1
            rel = str(f.relative_to(root))
            phone_text = CSS_COLOR_RE.sub(" ", text)  # usun kolory CSS przed szukaniem telefonow
            for m in PHONE_RE.findall(phone_text):
                n = norm_phone(m)
                if n not in PLACEHOLDER_PHONES:
                    f_phones.setdefault(n, set()).add(rel)
            for m in EMAIL_RE.findall(text):
                lo = m.lower()
                if lo not in PLACEHOLDER_EMAILS:
                    f_emails.setdefault(lo, set()).add(rel)
            for m in POSTAL_RE.findall(text):
                f_postals.setdefault(m, set()).add(rel)
    return {
        "phones": {k: sorted(v) for k, v in f_phones.items()},
        "emails": {k: sorted(v) for k, v in f_emails.items()},
        "postals": {k: sorted(v) for k, v in f_postals.items()},
        "name_hits": name_hits, "scanned": scanned,
    }


def evaluate(found: dict, nap: dict) -> dict:
    issues = []
    canon_phones = {norm_phone(p) for p in nap["phones"]}
    canon_emails = {e.lower() for e in nap["emails"]}
    canon_postals = set(nap["postals"])

    extra_phones = [p for p in found["phones"] if p not in canon_phones]
    missing_phones = [p for p in canon_phones if p not in found["phones"]]
    if missing_phones:
        issues.append({"confidence": "Potwierdzone", "severity": "high",
                       "msg": f"Kanoniczny telefon nie znaleziony w repo: {missing_phones}."})
    if extra_phones:
        issues.append({"confidence": "Prawdopodobne", "severity": "medium",
                       "msg": f"Numery inne niz kanoniczny: {extra_phones} "
                              f"(w: {[found['phones'][p] for p in extra_phones]}). "
                              f"Sprawdz czy to literowki/stare numery."})

    extra_emails = [e for e in found["emails"] if e not in canon_emails]
    missing_emails = [e for e in canon_emails if e not in found["emails"]]
    if missing_emails:
        issues.append({"confidence": "Potwierdzone", "severity": "high",
                       "msg": f"Kanoniczny email nie znaleziony: {missing_emails}."})
    if extra_emails:
        issues.append({"confidence": "Prawdopodobne", "severity": "low",
                       "msg": f"Inne adresy email: {extra_emails}. Czy powinny tam byc?"})

    extra_postals = [p for p in found["postals"] if p not in canon_postals]
    if extra_postals:
        issues.append({"confidence": "Hipoteza", "severity": "low",
                       "msg": f"Kody pocztowe spoza kanonicznych: {extra_postals}. "
                              f"Jesli to kolejna placowka — dodaj do nap.json."})

    consistent = not extra_phones and not missing_phones and not missing_emails
    return {"nap_consistent": consistent,
            "phone_variants": len(found["phones"]),
            "issues": issues}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("repo", nargs="?", default=".")
    ap.add_argument("--nap", help="sciezka do nap.json")
    args = ap.parse_args()

    root = Path(args.repo).resolve()
    if not root.exists():
        print(json.dumps({"error": f"Sciezka nie istnieje: {root}"}))
        sys.exit(1)
    nap = DEFAULT_NAP
    if args.nap and Path(args.nap).exists():
        nap = json.loads(Path(args.nap).read_text(encoding="utf-8"))

    found = scan_repo(root)
    verdict = evaluate(found, nap)
    print(json.dumps({
        "module": "nap_consistency", "root": str(root),
        "files_scanned": found["scanned"], "verdict": verdict,
        "raw": {"phones": found["phones"], "emails": found["emails"],
                "postals": found["postals"]},
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

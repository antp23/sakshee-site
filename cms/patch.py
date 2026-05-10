#!/usr/bin/env python3
"""
One-time patch: injects CMS script tag into index.html
Run from the sakshee-site root: python3 cms/patch.py
"""
import re, sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
INDEX = ROOT / "index.html"

TAG = '<script src="cms/ui.js"></script>'
MARKER = '</body>'

if not INDEX.exists():
    print("❌  index.html not found at", INDEX)
    sys.exit(1)

html = INDEX.read_text(encoding="utf-8")

if 'cms/ui.js' in html:
    print("✅  cms/ui.js already injected — nothing to do")
    sys.exit(0)

if MARKER not in html:
    print("❌  Could not find </body> in index.html")
    sys.exit(1)

patched = html.replace(MARKER, f'  {TAG}\n{MARKER}', 1)
INDEX.write_text(patched, encoding="utf-8")
print("✅  Injected cms/ui.js into index.html")
print("    Restart your HTTP server if it caches files.")

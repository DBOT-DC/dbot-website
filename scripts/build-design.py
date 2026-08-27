#!/usr/bin/env python3
"""
build-design.py — propagate the shared DogeOS design system into both pages.

Open Design rule: one canonical source, version-controlled, no vendor lock-in.
DESIGN.md rule 5: each page still ships as a single self-contained HTML file.

This script inlines:
    .design-rules/dogeos-shared.css   (shared system — both pages)
    .design-rules/dogeos-<page>.css   (page-specific layer)

into the region between these markers in each page's <head>:

    /* SHARED:START */ ... /* SHARED:END */

Usage:
    python3 scripts/build-design.py          # write
    python3 scripts/build-design.py --check  # verify in sync, exit 1 if not
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RULES = ROOT / ".design-rules"

PAGES = {
    "dogeos-ecosystem": RULES / "dogeos-ecosystem.css",
    "dogeos-dashboard": RULES / "dogeos-dashboard.css",
}

START = "/* SHARED:START */"
END = "/* SHARED:END */"

BLOCK_RE = re.compile(
    re.escape(START) + r".*?" + re.escape(END),
    re.DOTALL,
)


def build_block(page: str, page_css: Path, shared: str) -> str:
    parts = [
        START,
        "/* ╔══════════════════════════════════════════════════════════════════╗",
        "   ║  AUTO-GENERATED — DO NOT EDIT THIS BLOCK BY HAND.                ║",
        "   ║  Source:  .design-rules/dogeos-shared.css                        ║",
        f"   ║           .design-rules/{page_css.name:<40}║",
        "   ║  Rebuild: python3 scripts/build-design.py                        ║",
        "   ╚══════════════════════════════════════════════════════════════════╝ */",
        "",
        shared.rstrip(),
        "",
        page_css.read_text(encoding="utf-8").rstrip(),
        "",
        END,
    ]
    return "\n".join(parts)


def main() -> int:
    check = "--check" in sys.argv

    shared_path = RULES / "dogeos-shared.css"
    if not shared_path.exists():
        print(f"FATAL: missing {shared_path}")
        return 2
    shared = shared_path.read_text(encoding="utf-8")

    failures: list[str] = []
    changed: list[str] = []

    for page, page_css in PAGES.items():
        html_path = ROOT / page / "index.html"
        if not html_path.exists():
            failures.append(f"{page}: missing {html_path}")
            continue
        if not page_css.exists():
            failures.append(f"{page}: missing {page_css}")
            continue

        html = html_path.read_text(encoding="utf-8")
        if START not in html or END not in html:
            failures.append(
                f"{page}: markers {START} / {END} not found in <head> — "
                "add them inside a <style> tag first"
            )
            continue

        block = build_block(page, page_css, shared)
        new_html = BLOCK_RE.sub(lambda _m: block, html, count=1)

        if new_html == html:
            print(f"  = {page}/index.html already in sync")
            continue

        changed.append(page)
        if check:
            failures.append(f"{page}: OUT OF SYNC — run python3 scripts/build-design.py")
        else:
            html_path.write_text(new_html, encoding="utf-8")
            kb = len(new_html) / 1024
            print(f"  ✓ {page}/index.html updated ({kb:.1f} KB)")

    if failures:
        print("\nFAILED:")
        for f in failures:
            print(f"  ✗ {f}")
        return 1

    if check:
        print("\nAll pages in sync with the shared design system.")
    else:
        print(f"\nDone. {len(changed)} page(s) rebuilt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

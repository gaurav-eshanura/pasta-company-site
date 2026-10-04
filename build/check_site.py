"""Static checks the site cannot check on its own.

Catches the failure modes that survive a build: an href pointing at a page that
was never generated, an image path that does not exist, an alt attribute that
disappeared, a missing favicon. Run after build/site.mjs.
"""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input",
             "link", "meta", "param", "source", "track", "wbr"}

# Canonical and og: URLs must be absolute and on this origin.
SITE_ORIGIN = "https://pasta.eshanura.com"


class PageScan(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.refs: list[tuple[str, str, int]] = []
        self.img_alt: list[tuple[str, int]] = []
        self.h1 = 0
        self.title = None
        self._in_title = False
        self.lang = None
        self.has_desc = False
        self.canonical = None
        self.desc = None
        self.og_url = None
        self.robots = None
        self.ld_json: list[str] = []
        self.ids: list[str] = []
        self.duplicate_ids: set[str] = set()
        self.buttons_no_name: list[int] = []
        self._stack: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag not in VOID_TAGS:
            self._stack.append(tag)
        line = self.getpos()[0]

        if "id" in a:
            if a["id"] in self.ids:
                self.duplicate_ids.add(a["id"])
            self.ids.append(a["id"])

        if tag == "html":
            self.lang = a.get("lang")
        elif tag == "title":
            self._in_title = True
        elif tag == "meta" and a.get("name", "").lower() == "description":
            self.has_desc = bool(a.get("content", "").strip())
            self.desc = a.get("content", "")
        elif tag == "meta" and a.get("name", "").lower() == "robots":
            self.robots = a.get("content", "")
        elif tag == "meta" and a.get("property", "").lower() == "og:url":
            self.og_url = a.get("content", "")
        elif tag == "link" and a.get("rel", "").lower() == "canonical":
            self.canonical = a.get("href", "")
        elif tag == "script" and a.get("type", "").lower() == "application/ld+json":
            self._in_ld = True
            self._ld_buf = []
        elif tag == "h1":
            self.h1 += 1
        elif tag == "img":
            if "src" in a:
                self.refs.append(("img", a["src"], line))
            if not a.get("alt"):
                self.img_alt.append((a.get("src", "?"), line))
        elif tag == "a" and "href" in a:
            self.refs.append(("a", a["href"], line))
        elif tag == "link" and "href" in a:
            self.refs.append(("link", a["href"], line))
        elif tag == "script" and "src" in a:
            self.refs.append(("script", a["src"], line))
        elif tag == "source" and "srcset" in a:
            for u in a["srcset"].split(","):
                self.refs.append(("source", u.strip().split(" ")[0], line))
        elif tag in ("button", "a"):
            self._pending_label = a.get("aria-label") or a.get("title") or ""
            self._pending_line = line

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        if tag == "script" and getattr(self, "_in_ld", False):
            self.ld_json.append("".join(self._ld_buf))
            self._in_ld = False
            self._ld_buf = []
        if tag in VOID_TAGS:
            return
        if self._stack and self._stack[-1] == tag:
            self._stack.pop()

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title = (self.title or "") + data.strip()
        if getattr(self, "_in_ld", False):
            self._ld_buf.append(data)


def main() -> int:
    pages = sorted(p for p in ROOT.glob("*.html"))
    if not pages:
        print("no HTML pages found -- run `npm run build` first")
        return 1

    # Scan every page once up front so cross-page fragments (pasta.html#slug)
    # can be resolved against the target document's ids.
    scans = {}
    for page in pages:
        s = PageScan()
        s.feed(page.read_text(encoding="utf-8"))
        scans[page.name] = s

    problems: list[str] = []
    checked_refs = 0

    for page in pages:
        rel = page.relative_to(ROOT).as_posix()
        scan = scans[page.name]

        if not scan.lang:
            problems.append(f"{rel}: <html> has no lang attribute")
        if not scan.title:
            problems.append(f"{rel}: missing or empty <title>")
        if not scan.has_desc:
            problems.append(f"{rel}: missing or empty meta description")
        if len(scan.title or "") > 65:
            problems.append(f"{rel}: <title> is {len(scan.title)} chars; Google truncates past ~60")
        if len(scan.desc or "") > 165:
            problems.append(
                f"{rel}: meta description is {len(scan.desc)} chars; Google truncates past ~160"
            )
        if not scan.canonical:
            problems.append(f"{rel}: missing canonical link")
        elif not scan.canonical.startswith(SITE_ORIGIN):
            problems.append(f"{rel}: canonical points off-site ({scan.canonical})")
        if not scan.og_url:
            problems.append(f"{rel}: missing og:url")
        if not scan.ld_json:
            problems.append(f"{rel}: no JSON-LD structured data")
        for block in scan.ld_json:
            try:
                data = json.loads(block)
            except json.JSONDecodeError as exc:
                problems.append(f"{rel}: JSON-LD does not parse — {exc}")
                continue
            graph = data.get("@graph", [])
            if not graph:
                problems.append(f"{rel}: JSON-LD @graph is empty")
            for node in graph:
                if "@type" not in node:
                    problems.append(f"{rel}: JSON-LD node without @type")
        # The error page must never be indexed, or it dilutes the sitemap.
        is_404 = page.name == "404.html"
        if is_404 and "noindex" not in (scan.robots or ""):
            problems.append(f"{rel}: error page must carry a noindex robots directive")
        if not is_404 and "noindex" in (scan.robots or ""):
            problems.append(f"{rel}: indexable page is marked noindex")
        if scan.h1 != 1:
            problems.append(f"{rel}: expected exactly 1 <h1>, found {scan.h1}")
        for dup in sorted(scan.duplicate_ids):
            problems.append(f"{rel}: duplicate id '{dup}'")
        for src, line in scan.img_alt:
            problems.append(f"{rel}:{line}: <img> without alt ({src})")

        for kind, ref, line in scan.refs:
            if not ref or ref.startswith(("http://", "https://", "mailto:", "tel:", "data:")):
                if ref.startswith("#") and len(ref) > 1:
                    checked_refs += 1
                    if ref[1:] not in scan.ids:
                        problems.append(f"{rel}:{line}: anchor {ref} has no matching id")
                continue

            checked_refs += 1
            path, _, frag = ref.partition("#")
            path = path.split("?")[0]
            if not path:
                if frag and frag not in scan.ids:
                    problems.append(f"{rel}:{line}: anchor {ref} has no matching id")
                continue

            target = (page.parent / path).resolve()
            if not target.is_relative_to(ROOT) or not target.exists():
                problems.append(f"{rel}:{line}: {kind} -> missing target '{ref}'")
                continue

            # A fragment into another page must land on a real id.
            if frag and target.name in scans and frag not in scans[target.name].ids:
                problems.append(f"{rel}:{line}: {kind} -> {path} has no id '{frag}'")

    print(f"scanned {len(pages)} pages, {checked_refs} local references")

    # Orphan assets: a file left behind by an earlier crop run keeps a stale
    # reference looking valid, so flag anything on disk nothing points at.
    referenced: set[Path] = set()

    def note(base: Path, ref: str) -> None:
        """Record a local file a reference points at, ignoring off-site URLs."""
        if ref.startswith(SITE_ORIGIN + "/"):
            ref = ref[len(SITE_ORIGIN) + 1 :]
        if not ref or ref.startswith(("http://", "https://", "data:", "mailto:", "tel:", "#")):
            return
        path = ref.partition("#")[0].split("?")[0]
        if path:
            referenced.add((base / path).resolve())

    for page in pages:
        for _, ref, _ in scans[page.name].refs:
            note(page.parent, ref)
        for prop in re.findall(r'content="([^"]+)"', page.read_text(encoding="utf-8")):
            note(ROOT, prop)

    for css in ROOT.glob("assets/css/*.css"):
        for url in re.findall(r"url\(['\"]?([^'\")]+)['\"]?\)", css.read_text(encoding="utf-8")):
            note(css.parent, url)

    for manifest in ROOT.glob("*.webmanifest"):
        for icon in re.findall(r'"src"\s*:\s*"([^"]+)"', manifest.read_text(encoding="utf-8")):
            note(ROOT, icon)

    orphans = sorted(
        f.relative_to(ROOT).as_posix()
        for f in (ROOT / "assets").rglob("*")
        if f.is_file() and f.resolve() not in referenced
    )
    for o in orphans:
        problems.append(f"{o}: asset on disk but not referenced by any page or stylesheet")

    if problems:
        print(f"\n{len(problems)} problem(s):\n")
        for p in problems:
            print(f"  ✗ {p}")
        return 1

    print("\n✓ all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())

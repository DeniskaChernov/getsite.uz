# -*- coding: utf-8 -*-
"""Build /uz and /en crawlable mirrors of key pages with hreflang + baked i18n."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    "index.html",
    "catalog.html",
    "cases.html",
    "blog.html",
    "cookies.html",
]
LANGS = ("uz", "en")
ORIGIN = "https://getsite.uz"


def export_i18n() -> dict:
    script = r"""
const fs = require('fs');
const vm = require('vm');
const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('assets/i18n.js','utf8'), ctx);
vm.runInContext(fs.readFileSync('assets/i18n-pricing.js','utf8'), ctx);
try { vm.runInContext(fs.readFileSync('assets/i18n-process.js','utf8'), ctx); } catch (e) {}
try { vm.runInContext(fs.readFileSync('assets/i18n-blog.js','utf8'), ctx); } catch (e) {}
const base = ctx.window.GETSITE_I18N || {};
// pricing/process/blog scripts mutate GETSITE_I18N in place
console.log(JSON.stringify(base));
"""
    out = subprocess.check_output(["node", "-e", script], cwd=ROOT, text=True, encoding="utf-8")
    return json.loads(out)


def rewrite_asset_paths(html: str) -> str:
    # Root-relative for assets and top-level pages when living in /uz/ or /en/
    html = re.sub(r'(href|src)="assets/', r'\1="/assets/', html)
    html = re.sub(r'(href|src)="\./assets/', r'\1="/assets/', html)
    # Favicons and common root files (with optional query)
    for name in ("favicon.ico", "manifest.webmanifest", "cookies.html", "getdesign.html"):
        html = re.sub(
            rf'(href|content)="{re.escape(name)}(\?[^"]*)?"',
            rf'\1="/{name}\2"',
            html,
        )
    return html


def page_key(path: str) -> str:
    if path in ("", "/", "index.html"):
        return "index.html"
    return path.lstrip("/")


def abs_url(lang: str, page: str) -> str:
    if page == "index.html":
        return f"{ORIGIN}/" if lang == "ru" else f"{ORIGIN}/{lang}/"
    return f"{ORIGIN}/{page}" if lang == "ru" else f"{ORIGIN}/{lang}/{page}"


def hreflang_block(page: str) -> str:
    lines = [
        f'    <link rel="alternate" hreflang="ru" href="{abs_url("ru", page)}">',
        f'    <link rel="alternate" hreflang="uz" href="{abs_url("uz", page)}">',
        f'    <link rel="alternate" hreflang="en" href="{abs_url("en", page)}">',
        f'    <link rel="alternate" hreflang="x-default" href="{abs_url("ru", page)}">',
    ]
    return "\n".join(lines)


def replace_meta(html: str, dict_: dict, page: str, lang: str) -> str:
    title = dict_.get("meta.title") or ""
    desc = dict_.get("meta.description") or ""
    # Page-specific overrides for non-home
    if page == "catalog.html":
        title = dict_.get("catalog.meta.title") or {
            "uz": "Sayt, bot yoki avtomatlashtirish buyurtma — katalog | getsite",
            "en": "Order a website, bot, or automation — catalog | getsite",
        }.get(lang, title)
        desc = dict_.get("catalog.meta.description") or {
            "uz": "Katalog: Toshkentda sayt yaratish va buyurtma, Telegram-bot, avtomatlashtirish. «Dan» narxlar ochiq.",
            "en": "Catalog: create and order a website in Tashkent, Telegram bots, automation. Open starting prices.",
        }.get(lang, desc)
    elif page == "cases.html":
        title = {
            "uz": "Keyslar — getsite",
            "en": "Cases — getsite",
        }.get(lang, "Кейсы — getsite")
        desc = {
            "uz": "getsite keyslari: jonli loyihalar productionda.",
            "en": "getsite case studies: live projects in production.",
        }.get(lang, desc)
    elif page == "blog.html":
        title = {
            "uz": "Blog — getsite",
            "en": "Blog — getsite",
        }.get(lang, "Блог — getsite")
        desc = {
            "uz": "getsite blogi: saytlar, botlar va mahsulot ishga tushirish.",
            "en": "getsite blog: launches, bots, and product notes.",
        }.get(lang, desc)
    elif page == "cookies.html":
        title = {
            "uz": "Cookie siyosati — getsite",
            "en": "Cookie policy — getsite",
        }.get(lang, "Политика cookie — getsite")

    html = re.sub(r"<title>[^<]*</title>", f"<title>{title}</title>", html, count=1)
    html = re.sub(
        r'<meta\s+name="description"\s+content="[^"]*"\s*/?>',
        f'<meta name="description" content="{desc}">',
        html,
        count=1,
        flags=re.I,
    )
    html = re.sub(
        r'<meta\s+property="og:title"\s+content="[^"]*"\s*/?>',
        f'<meta property="og:title" content="{title}">',
        html,
        count=1,
        flags=re.I,
    )
    html = re.sub(
        r'<meta\s+property="og:description"\s+content="[^"]*"\s*/?>',
        f'<meta property="og:description" content="{desc}">',
        html,
        count=1,
        flags=re.I,
    )
    html = re.sub(
        r'<meta\s+name="twitter:title"\s+content="[^"]*"\s*/?>',
        f'<meta name="twitter:title" content="{title}">',
        html,
        count=1,
        flags=re.I,
    )
    html = re.sub(
        r'<meta\s+name="twitter:description"\s+content="[^"]*"\s*/?>',
        f'<meta name="twitter:description" content="{desc}">',
        html,
        count=1,
        flags=re.I,
    )
    canon = abs_url(lang, page)
    html = re.sub(
        r'<link\s+rel="canonical"\s+href="[^"]*"\s*/?>',
        f'<link rel="canonical" href="{canon}">',
        html,
        count=1,
        flags=re.I,
    )
    html = re.sub(
        r'<meta\s+property="og:url"\s+content="[^"]*"\s*/?>',
        f'<meta property="og:url" content="{canon}">',
        html,
        count=1,
        flags=re.I,
    )
    # lang + locale on <html> (data-lang is CSP-safe force for app.js)
    html = re.sub(
        r'<html\s+lang="[^"]*"',
        f'<html lang="{lang}" data-lang="{lang}"',
        html,
        count=1,
    )
    locale = {"uz": "uz_UZ", "en": "en_US"}.get(lang, "ru_RU")
    if 'property="og:locale"' in html:
        html = re.sub(
            r'<meta\s+property="og:locale"\s+content="[^"]*"\s*/?>',
            f'<meta property="og:locale" content="{locale}">',
            html,
            count=1,
            flags=re.I,
        )
    else:
        html = html.replace("</title>", f'</title>\n    <meta property="og:locale" content="{locale}">', 1)
    return html


def bake_i18n(html: str, dict_: dict) -> str:
    """Replace text/html for elements with data-i18n / data-i18n-aria."""

    def repl_text(match: re.Match) -> str:
        key = match.group(1)
        open_rest = match.group(2)
        value = dict_.get(key)
        if value is None:
            return match.group(0)
        # Keep nested tags only if data-i18n-html
        if 'data-i18n-html="true"' in open_rest or "data-i18n-html='true'" in open_rest:
            return f'data-i18n="{key}"{open_rest}>{value}</'
        # Strip tags from value for text nodes
        plain = re.sub(r"<[^>]+>", "", value)
        return f'data-i18n="{key}"{open_rest}>{plain}</'

    html = re.sub(
        r'data-i18n="([^"]+)"([^>]*)>([\s\S]*?)</',
        repl_text,
        html,
    )

    def repl_aria(match: re.Match) -> str:
        key = match.group(1)
        value = dict_.get(key)
        if value is None:
            return match.group(0)
        safe = value.replace('"', "&quot;")
        return f'data-i18n-aria="{key}" aria-label="{safe}"'

    html = re.sub(
        r'data-i18n-aria="([^"]+)"(?:\s+aria-label="[^"]*")?',
        repl_aria,
        html,
    )
    return html


def rewrite_nav_hrefs(html: str, lang: str) -> str:
    """Point same-site HTML links to language versions where they exist."""
    prefix = f"/{lang}"

    def fix_href(match: re.Match) -> str:
        href = match.group(1)
        if href.startswith(("http://", "https://", "mailto:", "tel:", "#", "/assets/", "data:")):
            return match.group(0)
        if href.startswith("../"):
            return match.group(0)
        if href.startswith("/uz/") or href.startswith("/en/"):
            return match.group(0)
        if href.startswith("/"):
            # already absolute site path
            if href in ("/", "/index.html"):
                return f'href="{prefix}/"'
            for p in PAGES:
                if href == f"/{p}" or href.startswith(f"/{p}#"):
                    return f'href="{prefix}/{p}{href[len(p)+1:]}"'
            return match.group(0)

        # relative
        clean = href.split("#")[0]
        frag = ""
        if "#" in href:
            frag = "#" + href.split("#", 1)[1]
        if clean in ("", "index.html"):
            return f'href="{prefix}/{frag}"' if frag else f'href="{prefix}/"'
        if clean in PAGES:
            return f'href="{prefix}/{clean}{frag}"'
        if clean.startswith("blog/") or clean == "blog.html":
            # blog articles stay RU for now; blog index has mirror
            if clean == "blog.html":
                return f'href="{prefix}/blog.html{frag}"'
            return f'href="/{clean}{frag}"'
        if clean == "getdesign.html":
            return f'href="/getdesign.html"'
        if clean.startswith("assets/"):
            return f'href="/{clean}{frag}"'
        return match.group(0)

    return re.sub(r'href="([^"]+)"', fix_href, html)


def strip_hreflang(html: str) -> str:
    return re.sub(r'\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+"\s*/?>', "", html)


def inject_head(html: str, page: str, lang: str) -> str:
    html = strip_hreflang(html)
    block = hreflang_block(page)
    if re.search(r'<link\s+rel="canonical"', html, flags=re.I):
        html = re.sub(
            r'(<link\s+rel="canonical"[^>]*>)',
            "\n" + block + "\n    " + r"\1",
            html,
            count=1,
            flags=re.I,
        )
    else:
        html = html.replace("<head>", "<head>\n" + block, 1)
    return html


def bake_lang_switch(html: str, lang: str) -> str:
    for code in ("ru", "uz", "en"):
        active = code == lang
        cls = "lang-switch__btn is-active" if active else "lang-switch__btn"
        pressed = "true" if active else "false"
        html = re.sub(
            rf'<button class="lang-switch__btn[^"]*" type="button" data-lang="{code}"[^>]*>',
            f'<button class="{cls}" type="button" data-lang="{code}" aria-pressed="{pressed}">',
            html,
        )
    return html


def inject_root_hreflang(html: str, page: str) -> str:
    html = strip_hreflang(html)
    block = hreflang_block(page)
    if re.search(r'<link\s+rel="canonical"', html, flags=re.I):
        html = re.sub(
            r'(<link\s+rel="canonical"[^>]*>)',
            "\n" + block + "\n    " + r"\1",
            html,
            count=1,
            flags=re.I,
        )
    else:
        html = html.replace("<head>", "<head>\n" + block, 1)
    return html


def build() -> None:
    data = export_i18n()
    for page in PAGES:
        src = ROOT / page
        raw_clean = strip_hreflang(src.read_text(encoding="utf-8"))
        src.write_text(inject_root_hreflang(raw_clean, page), encoding="utf-8")
        print("hreflang ru", page)

        for lang in LANGS:
            dict_ = data.get(lang) or {}
            html = raw_clean
            html = rewrite_asset_paths(html)
            html = replace_meta(html, dict_, page, lang)
            html = bake_i18n(html, dict_)
            html = bake_lang_switch(html, lang)
            html = inject_head(html, page, lang)
            html = rewrite_nav_hrefs(html, lang)
            out_dir = ROOT / lang
            out_dir.mkdir(exist_ok=True)
            (out_dir / page).write_text(html, encoding="utf-8")
            print("wrote", f"{lang}/{page}")


if __name__ == "__main__":
    build()

# -*- coding: utf-8 -*-
"""Generate SEO landing pages for getsite.uz commercial clusters."""
from pathlib import Path
from datetime import date

ROOT = Path(r"C:\Getsite.uz")
TODAY = date.today().isoformat()

PAGES = [
    {
        "file": "sozdat-sajt.html",
        "title": "Создать сайт в Ташкенте — разработка под ключ | getsite",
        "description": "Создать сайт в Ташкенте и Узбекистане: лендинг, корпоративный, каталог, магазин. План, сроки и цена «от» до старта. getsite.",
        "h1": "Создать сайт в Ташкенте",
        "lead": "Нужен сайт, который приводит заявки, а не просто «висит в интернете». Создаём структуру, дизайн, адаптив и запуск — с планом и сроками до кода.",
        "service_type": "Создание сайтов",
        "tg": "sites_landing",
        "cta": "Создать сайт в Telegram",
        "sections": [
            (
                "Какой сайт создать",
                """<ul class="seo-landing__list">
            <li><a href="lending-tashkent.html">Лендинг</a> — одна страница под рекламу и заявку</li>
            <li><a href="korporativnyj-sajt.html">Корпоративный сайт</a> — о компании, услугах и доверии</li>
            <li><a href="sajt-katalog.html">Сайт-каталог</a> — товары или услуги с карточками</li>
            <li><a href="internet-magazin.html">Интернет-магазин</a> — корзина, оплата, статусы</li>
          </ul>""",
            ),
            (
                "Как проходит создание сайта",
                """<ol class="seo-landing__steps">
            <li>Разбор задачи: цель сайта, аудитория, что должно случиться после визита.</li>
            <li>Структура и прототип ключевых экранов.</li>
            <li>Дизайн, вёрстка, формы, базовое SEO, запуск.</li>
            <li>Передача доступов и короткая инструкция.</li>
          </ol>""",
            ),
            (
                "Сколько стоит создать сайт",
                """<p>Лендинг — от 4,9 млн сум. Корпоративный — от 8,9 млн. Каталог — от 11,9 млн. Магазин — от 14,9 млн.
            Подробнее о бюджетах — в статье <a href="blog/website-cost-uz.html">«Сколько стоит сайт в Узбекистане»</a>
            и на странице <a href="stoimost-sajta.html">стоимость сайта</a>.</p>""",
            ),
        ],
        "faq": [
            ("С чего начать, если нужно создать сайт с нуля?", "Напишите в Telegram задачу одним сообщением: ниша, цель сайта, есть ли материалы. Вернёмся с планом и ориентиром по срокам."),
            ("Создаёте сайт на конструкторе или с нуля?", "Под задачу: быстрый лендинг или кастомная разработка. Не навязываем лишний стек — только то, что нужно бизнесу."),
            ("Сколько занимает создание сайта?", "Типовой лендинг — обычно от 2–4 недель после согласования структуры. Срок фиксируем в плане до старта."),
        ],
    },
    {
        "file": "sdelat-sajt.html",
        "title": "Сделать сайт в Ташкенте — под ключ для бизнеса | getsite",
        "description": "Сделать сайт в Ташкенте: от идеи до запуска. Лендинги, каталоги, магазины. Цены «от», обсуждение в Telegram. getsite.",
        "h1": "Сделать сайт в Ташкенте",
        "lead": "Сделать сайт — значит получить рабочий инструмент продаж: понятная структура, мобильная версия, формы и уведомления менеджеру.",
        "service_type": "Разработка сайтов",
        "tg": "sites_landing",
        "cta": "Сделать сайт — написать",
        "sections": [
            (
                "Для кого делаем сайты",
                """<p>Для локального бизнеса в Ташкенте и Узбекистане, для услуг и e-com, для команд, которым нужен сайт без «агентской воды» —
            с понятным составом и сроками. Смотрите <a href="cases.html">кейсы</a> и <a href="catalog.html">каталог</a>.</p>""",
            ),
            (
                "Что будет в готовом сайте",
                """<ul class="seo-landing__list">
            <li>Структура под вашу задачу</li>
            <li>Адаптив под телефон</li>
            <li>Формы и уведомления в Telegram</li>
            <li>Базовая SEO-подготовка и запуск</li>
          </ul>""",
            ),
        ],
        "faq": [
            ("Можно ли сделать сайт за неделю?", "Иногда — если объём маленький и материалы готовы. Чаще честный срок 2–4 недели на лендинг; назовём дату после разбора."),
            ("Нужны ли тексты и фото от нас?", "Можете дать черновики — поможем структурой. Полное наполнение с нуля обсуждается отдельно."),
        ],
    },
    {
        "file": "razrabotka-sajta.html",
        "title": "Разработка сайта в Ташкенте и Узбекистане | getsite",
        "description": "Разработка сайта в Ташкенте: проектирование, дизайн, код, запуск. Открытые цены «от», план до старта. getsite.",
        "h1": "Разработка сайта",
        "lead": "Разработка сайта под ваш процесс: от карты страниц до продакшена. Без сюрпризов на финише — сначала план и сроки.",
        "service_type": "Веб-разработка",
        "tg": "sites_corporate",
        "cta": "Обсудить разработку",
        "sections": [
            (
                "Этапы разработки",
                """<ol class="seo-landing__steps">
            <li>Бриф и цели</li>
            <li>Структура и прототип</li>
            <li>Дизайн ключевых экранов</li>
            <li>Разработка, интеграции, тест</li>
            <li>Запуск и передача</li>
          </ol>""",
            ),
            (
                "С чем интегрируем",
                """<p>Формы → Telegram, аналитика, при необходимости CMS, каталог, оплата и CRM.
            Отдельные модули — в <a href="catalog.html">каталоге услуг</a>.</p>""",
            ),
        ],
        "faq": [
            ("Делаете поддержку после разработки?", "Да — техническое сопровождение от 700 тыс сум / мес. Можно разовые правки."),
            ("Можно доработать существующий сайт?", "Да, если стек позволяет. Сначала смотрим код и оцениваем объём."),
        ],
    },
    {
        "file": "lending-tashkent.html",
        "title": "Лендинг в Ташкенте — заказать продающий лендинг | getsite",
        "description": "Заказать лендинг в Ташкенте от 4,9 млн сум: структура под заявку, адаптив, формы, Telegram. getsite.",
        "h1": "Лендинг в Ташкенте",
        "lead": "Лендинг для рекламы и заявок: один оффер, понятные блоки, форма и уведомление менеджеру в Telegram.",
        "service_type": "Разработка лендингов",
        "tg": "sites_landing",
        "cta": "Заказать лендинг",
        "sections": [
            (
                "Что входит в лендинг",
                """<ul class="seo-landing__list">
            <li>Структура до 10 блоков</li>
            <li>Дизайн и адаптив</li>
            <li>Формы + Telegram-уведомления</li>
            <li>Базовое SEO, аналитика, запуск</li>
          </ul>
          <p>Цена — от 4,9 млн сум. Состав на странице <a href="catalog.html">каталога</a>.</p>""",
            ),
            (
                "Когда нужен именно лендинг",
                """<p>Новый оффер, запуск рекламы, одна услуга или продукт, тест спроса.
            Если нужен многостраничный сайт — смотрите <a href="korporativnyj-sajt.html">корпоративный сайт</a>.</p>""",
            ),
        ],
        "faq": [
            ("Чем лендинг лучше многостраничника?", "Быстрее запуск и проще довести посетителя до заявки. Многостраничник — когда нужно рассказать о компании шире."),
            ("Сделаете лендинг под Яндекс/Google рекламу?", "Да: структура под оффер, быстрая загрузка, цели в аналитике по договорённости."),
        ],
    },
    {
        "file": "korporativnyj-sajt.html",
        "title": "Корпоративный сайт в Ташкенте — заказать | getsite",
        "description": "Корпоративный сайт в Ташкенте от 8,9 млн сум: страницы компании, CMS, формы. getsite.",
        "h1": "Корпоративный сайт",
        "lead": "Сайт компании, где понятно кто вы, что предлагаете и как связаться. До 8 страниц, CMS, формы и аналитика.",
        "service_type": "Корпоративные сайты",
        "tg": "sites_corporate",
        "cta": "Заказать корпоративный сайт",
        "sections": [
            (
                "Что обычно входит",
                """<ul class="seo-landing__list">
            <li>До 8 страниц</li>
            <li>Структура и дизайн</li>
            <li>CMS для правок контента</li>
            <li>Формы, аналитика, базовое SEO, запуск</li>
          </ul>
          <p>От 8,9 млн сум — см. <a href="catalog.html#cat-sites">каталог</a>.</p>""",
            ),
        ],
        "faq": [
            ("Нужен ли корпоративный сайт, если есть Instagram?", "Соцсети не заменяют сайт: доверие, SEO, свой канал заявок, полный рассказ об услугах."),
            ("Сколько языков можно сделать?", "Доп. язык — отдельная опция в каталоге. Базово собираем одну языковую версию."),
        ],
    },
    {
        "file": "sajt-katalog.html",
        "title": "Сайт-каталог в Ташкенте — заказать | getsite",
        "description": "Сайт-каталог в Ташкенте от 11,9 млн сум: категории, карточки, CMS, заявки. getsite.",
        "h1": "Сайт-каталог",
        "lead": "Каталог, по которому выбирают и оставляют заявку с карточки — без обязательной онлайн-оплаты, если она пока не нужна.",
        "service_type": "Сайты-каталоги",
        "tg": "sites_catalog",
        "cta": "Заказать каталог",
        "sections": [
            (
                "Возможности",
                """<ul class="seo-landing__list">
            <li>Категории и карточки</li>
            <li>CMS и заявки с товара</li>
            <li>Базовый поиск, аналитика, запуск</li>
          </ul>
          <p>Если нужна оплата онлайн — смотрите <a href="internet-magazin.html">интернет-магазин</a>.</p>""",
            ),
        ],
        "faq": [
            ("Сколько товаров можно загрузить?", "Зависит от объёма: базовое наполнение обсуждаем отдельно, массовый импорт — как доп. работа."),
            ("Подойдёт ли каталог для услуг, не только товаров?", "Да — карточки услуг, кейсов, объектов недвижимости и т.п."),
        ],
    },
    {
        "file": "internet-magazin.html",
        "title": "Интернет-магазин в Ташкенте — создать и заказать | getsite",
        "description": "Интернет-магазин в Ташкенте от 14,9 млн сум: каталог, корзина, checkout, CMS. getsite.",
        "h1": "Интернет-магазин в Ташкенте",
        "lead": "Магазин до оплаты и статусов заказа — не каталог с кнопкой «купить». Корзина, checkout и CMS под ваш ассортимент.",
        "service_type": "Разработка интернет-магазинов",
        "tg": "sites_shop",
        "cta": "Заказать интернет-магазин",
        "sections": [
            (
                "Что входит",
                """<ul class="seo-landing__list">
            <li>Каталог, корзина, checkout</li>
            <li>CMS и адаптив</li>
            <li>Статусы, аналитика, запуск</li>
          </ul>
          <p>Онлайн-оплата и доставка подключаются как модули — цены в <a href="catalog.html">каталоге</a>.</p>""",
            ),
        ],
        "faq": [
            ("Какие платёжные системы подключаете?", "Те, что актуальны в Узбекистане под ваш юрстатус. Конкретный провайдер — после брифа."),
            ("Можно начать с каталога, а магазин позже?", "Да. Часто так и делают: сначала заявки, потом checkout."),
        ],
    },
    {
        "file": "telegram-bot-tashkent.html",
        "title": "Telegram-бот в Ташкенте — заказать разработку | getsite",
        "description": "Заказать Telegram-бот в Ташкенте от 4,5 млн сум: сценарий, заявки, уведомления команде. getsite.",
        "h1": "Telegram-бот в Ташкенте",
        "lead": "Бот собирает заявку с контекстом, а не только номер телефона. Сценарий под задачу, уведомления команде, тест в чате до передачи.",
        "service_type": "Разработка Telegram-ботов",
        "tg": "tg_bot",
        "cta": "Заказать бота",
        "sections": [
            (
                "Что умеет бот",
                """<ul class="seo-landing__list">
            <li>Сценарий и меню</li>
            <li>Сбор заявок и база</li>
            <li>Уведомления и админ-команды</li>
            <li>Тест и размещение</li>
          </ul>
          <p>От 4,5 млн сум. Нужна панель — <a href="catalog.html#cat-telegram">бот + админ-панель</a>. Статья:
            <a href="blog/why-telegram-bot.html">зачем бизнесу бот</a>.</p>""",
            ),
        ],
        "faq": [
            ("Бот вместо сайта или вместе?", "Часто вместе: сайт для доверия и SEO, бот для быстрых заявок. Разберём, что первично."),
            ("Делаете Mini App?", "Да — отдельная услуга в каталоге, от 18 млн сум."),
        ],
    },
    {
        "file": "stoimost-sajta.html",
        "title": "Стоимость сайта в Ташкенте и Узбекистане 2026 | getsite",
        "description": "Стоимость сайта в Ташкенте: лендинг от 4,9 млн, корпоративный от 8,9 млн, магазин от 14,9 млн. Что влияет на цену. getsite.",
        "h1": "Стоимость сайта в Ташкенте",
        "lead": "Прозрачные цены «от» при стандартном составе. Ниже — ориентиры и от чего зависит итоговая смета.",
        "service_type": "Оценка стоимости сайта",
        "tg": "discuss",
        "cta": "Узнать стоимость в Telegram",
        "sections": [
            (
                "Ориентиры цен",
                """<ul class="seo-landing__list">
            <li>Лендинг — от 4,9 млн сум</li>
            <li>Корпоративный сайт — от 8,9 млн сум</li>
            <li>Сайт-каталог — от 11,9 млн сум</li>
            <li>Интернет-магазин — от 14,9 млн сум</li>
            <li>Telegram-бот — от 4,5 млн сум</li>
          </ul>
          <p>Полный прайс — в <a href="catalog.html">каталоге</a>. Разбор рынка —
            <a href="blog/website-cost-uz.html">сколько стоит сайт в Узбекистане</a>.</p>""",
            ),
            (
                "От чего растёт цена",
                """<ul class="seo-landing__list">
            <li>Число страниц и уникальный дизайн</li>
            <li>CMS, фильтры, поиск, личный кабинет</li>
            <li>Оплата, доставка, CRM, доп. языки</li>
            <li>Срочность и объём контента</li>
          </ul>""",
            ),
        ],
        "faq": [
            ("Почему цена «от», а не фикс?", "Фикс возможен после состава. «От» — честный минимум на стандартный пакет без сюрпризов в мелком шрифте."),
            ("Есть ли рассрочка?", "Обсуждается индивидуально после оценки объёма."),
        ],
    },
    {
        "file": "avtomatizaciya-biznesa.html",
        "title": "Автоматизация бизнеса в Ташкенте | getsite",
        "description": "Автоматизация процессов и интеграций в Ташкенте: от 1,9 млн сум за аналитику, от 3 млн за процесс. getsite.",
        "h1": "Автоматизация бизнеса",
        "lead": "Убираем ручной процесс, который съедает часы: связка сервисов, уведомления, инструкция — без переписывания всей компании.",
        "service_type": "Автоматизация бизнеса",
        "tg": "auto_process",
        "cta": "Обсудить автоматизацию",
        "sections": [
            (
                "С чего начать",
                """<p>Часто с <strong>аналитики и проектирования</strong> (от 1,9 млн) — чтобы не платить за лишние модули.
            Затем — автоматизация одного процесса (от 3 млн) или интеграция систем (от 2,5 млн).
            Каталог: <a href="catalog.html#cat-auto">автоматизация</a>.</p>""",
            ),
        ],
        "faq": [
            ("Нужен ли код, если есть n8n / Make?", "Иногда достаточно связки no-code. Иногда — свой сервис. Решаем по надёжности и стоимости поддержки."),
            ("Делаете CRM с нуля?", "Да, после аналитики — отдельная услуга в каталоге."),
        ],
    },
]

HUB_LINKS = [
    ("sozdat-sajt.html", "Создать сайт"),
    ("zakazat-sajt.html", "Заказать сайт"),
    ("sdelat-sajt.html", "Сделать сайт"),
    ("razrabotka-sajta.html", "Разработка сайта"),
    ("lending-tashkent.html", "Лендинг"),
    ("korporativnyj-sajt.html", "Корпоративный сайт"),
    ("sajt-katalog.html", "Сайт-каталог"),
    ("internet-magazin.html", "Интернет-магазин"),
    ("telegram-bot-tashkent.html", "Telegram-бот"),
    ("stoimost-sajta.html", "Стоимость сайта"),
    ("avtomatizaciya-biznesa.html", "Автоматизация"),
    ("catalog.html", "Весь каталог цен"),
]


def related_nav(current: str) -> str:
    items = []
    for href, label in HUB_LINKS:
        if href == current:
            continue
        items.append(f'<li><a href="{href}">{label}</a></li>')
    return '<ul class="seo-landing__related">' + "".join(items[:8]) + "</ul>"


def faq_html(faq: list) -> str:
    if not faq:
        return ""
    blocks = []
    entities = []
    for q, a in faq:
        blocks.append(
            f"""<details class="seo-faq__item">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>"""
        )
        entities.append(
            {
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a},
            }
        )
    import json

    schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": entities,
    }
    return (
        '<h2>Частые вопросы</h2><div class="seo-faq__list">'
        + "".join(blocks)
        + "</div>"
        + f'<script type="application/ld+json">\n{json.dumps(schema, ensure_ascii=False, indent=2)}\n</script>'
    )


def page_html(p: dict) -> str:
    sections = "".join(f"<h2>{t}</h2>\n          {b}\n" for t, b in p["sections"])
    faq = faq_html(p.get("faq") or [])
    related = related_nav(p["file"])
    return f"""<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' https://mc.yandex.ru https://mc.yandex.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://mc.yandex.ru; connect-src 'self' https://mc.yandex.ru https://mc.yandex.com; form-action 'self'">
    <title>{p['title']}</title>
    <meta name="description" content="{p['description']}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="https://getsite.uz/{p['file']}">
    <meta property="og:title" content="{p['title']}">
    <meta property="og:description" content="{p['description']}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://getsite.uz/{p['file']}">
    <meta property="og:image" content="https://getsite.uz/assets/og-image.png">
    <meta property="og:locale" content="ru_RU">
    <meta property="og:site_name" content="getsite">
    <link rel="icon" href="assets/favicon.svg?v=3" type="image/svg+xml">
    <link rel="icon" href="favicon.ico?v=3" sizes="any">
    <link rel="icon" href="assets/brand/favicon-32.png?v=3" sizes="32x32" type="image/png">
    <link rel="apple-touch-icon" href="assets/brand/favicon-180.png?v=3">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700;800;900&family=Golos+Text:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/styles.css?v=66">
    <script src="assets/site-config.js?v=4"></script>
    <script src="assets/analytics.js?v=1" defer></script>
    <script src="assets/app.js?v=37" defer></script>
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "{p['h1']}",
      "serviceType": "{p['service_type']}",
      "provider": {{
        "@type": "Organization",
        "name": "getsite",
        "url": "https://getsite.uz/",
        "telephone": "+998919080621",
        "email": "getsiteuzbekistan@gmail.com",
        "address": {{
          "@type": "PostalAddress",
          "addressLocality": "Ташкент",
          "addressCountry": "UZ"
        }}
      }},
      "areaServed": [
        {{ "@type": "City", "name": "Ташкент" }},
        {{ "@type": "Country", "name": "Узбекистан" }}
      ],
      "url": "https://getsite.uz/{p['file']}",
      "description": "{p['description']}"
    }}
    </script>
  </head>
  <body class="page-blog page-seo-landing">
    <div class="cursor-dot" data-cursor-dot aria-hidden="true"></div>
    <div class="cursor-ring" data-cursor-ring aria-hidden="true"></div>
    <header class="site-header is-scrolled" data-header>
      <div class="brand-switch" data-brand-switch>
        <a class="brand-switch__item is-active" href="index.html">getsite<span class="accent">*</span></a>
        <a class="brand-switch__item" href="getdesign.html">getdesign<span class="accent">*</span></a>
      </div>
      <div class="site-header__actions">
        <a class="btn btn--ghost btn--header" href="https://telegram.me/getsiteuzbot?start={p['tg']}" data-tg-start="{p['tg']}" target="_blank" rel="noopener noreferrer">{p['cta']}</a>
        <a class="menu-button menu-button--link" href="uslugi.html" aria-label="Все услуги">≡</a>
      </div>
    </header>
    <main class="blog-page" id="main-content">
      <a class="blog-page__back" href="uslugi.html" aria-label="Все услуги">← услуги</a>
      <div class="blog-page__content">
        <div class="blog-page__head">
          <h1>{p['h1']}</h1>
          <p>{p['lead']}</p>
        </div>
        <article class="seo-landing">
          {sections}
          {faq}
          <h2>Смотрите также</h2>
          {related}
          <p class="seo-landing__cta-row">
            <a class="btn btn--accent" href="https://telegram.me/getsiteuzbot?start={p['tg']}" data-tg-start="{p['tg']}" target="_blank" rel="noopener noreferrer">{p['cta']}</a>
            <a class="blog-more" href="catalog.html">Каталог и цены →</a>
          </p>
        </article>
      </div>
    </main>
  </body>
</html>
"""


def hub_html() -> str:
    cards = "".join(
        f'<a class="seo-hub__card" href="{href}"><span>{label}</span></a>'
        for href, label in HUB_LINKS
    )
    return f"""<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' https://mc.yandex.ru https://mc.yandex.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://mc.yandex.ru; connect-src 'self' https://mc.yandex.ru https://mc.yandex.com; form-action 'self'">
    <title>Услуги getsite — создать и заказать сайт в Ташкенте</title>
    <meta name="description" content="Все направления getsite: создать сайт, заказать лендинг, магазин, Telegram-бот, автоматизация. Цены и посадочные по запросам.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://getsite.uz/uslugi.html">
    <meta property="og:title" content="Услуги getsite — создать и заказать сайт в Ташкенте">
    <meta property="og:description" content="Создать сайт, лендинг, магазин, бот, автоматизация — посадочные и каталог цен.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://getsite.uz/uslugi.html">
    <meta property="og:image" content="https://getsite.uz/assets/og-image.png">
    <meta property="og:locale" content="ru_RU">
    <link rel="icon" href="assets/favicon.svg?v=3" type="image/svg+xml">
    <link rel="icon" href="favicon.ico?v=3" sizes="any">
    <link rel="stylesheet" href="assets/styles.css?v=66">
    <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700;800;900&family=Golos+Text:wght@400;500;600&display=swap" rel="stylesheet">
    <script src="assets/site-config.js?v=4"></script>
    <script src="assets/analytics.js?v=1" defer></script>
    <script src="assets/app.js?v=37" defer></script>
  </head>
  <body class="page-blog page-seo-landing">
    <header class="site-header is-scrolled" data-header>
      <div class="brand-switch" data-brand-switch>
        <a class="brand-switch__item is-active" href="index.html">getsite<span class="accent">*</span></a>
        <a class="brand-switch__item" href="getdesign.html">getdesign<span class="accent">*</span></a>
      </div>
      <div class="site-header__actions">
        <a class="btn btn--ghost btn--header" href="https://telegram.me/getsiteuzbot?start=discuss" data-tg-start="discuss" target="_blank" rel="noopener noreferrer">Обсудить</a>
        <a class="menu-button menu-button--link" href="index.html" aria-label="На главную">←</a>
      </div>
    </header>
    <main class="blog-page" id="main-content">
      <a class="blog-page__back" href="index.html">← getsite</a>
      <div class="blog-page__content">
        <div class="blog-page__head">
          <h1>Услуги и запросы</h1>
          <p>Выберите задачу: создать или заказать сайт, лендинг, магазин, бота или автоматизацию. Цены — в каталоге, старт — в Telegram.</p>
        </div>
        <div class="seo-hub">{cards}</div>
        <p class="seo-landing__cta-row">
          <a class="btn btn--accent" href="catalog.html">Открыть каталог цен</a>
          <a class="blog-more" href="zakazat-sajt.html">Заказать сайт →</a>
        </p>
      </div>
    </main>
  </body>
</html>
"""


def main() -> None:
    for p in PAGES:
        path = ROOT / p["file"]
        path.write_text(page_html(p), encoding="utf-8")
        print("wrote", p["file"])
    (ROOT / "uslugi.html").write_text(hub_html(), encoding="utf-8")
    print("wrote uslugi.html")

    # patch sitemap: insert SEO urls after zakazat
    sm = ROOT / "sitemap.xml"
    text = sm.read_text(encoding="utf-8")
    urls = ["uslugi.html"] + [p["file"] for p in PAGES]
    # also keep zakazat
    block = []
    for u in urls:
        block.append(
            f"""  <url>
    <loc>https://getsite.uz/{u}</loc>
    <lastmod>{TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.92</priority>
  </url>"""
        )
    insert = "\n".join(block)
    marker = "https://getsite.uz/zakazat-sajt.html"
    if marker in text:
        # after zakazat url block
        idx = text.find("</url>", text.find(marker)) + len("</url>")
        # remove previously generated if re-run
        for u in urls:
            start = text.find(f"<loc>https://getsite.uz/{u}</loc>")
            if start != -1:
                u_start = text.rfind("<url>", 0, start)
                u_end = text.find("</url>", start) + len("</url>")
                text = text[:u_start] + text[u_end:]
                # recalculate idx
                idx = text.find("</url>", text.find(marker)) + len("</url>")
        text = text[:idx] + "\n" + insert + text[idx:]
        sm.write_text(text, encoding="utf-8")
        print("updated sitemap")
    else:
        print("sitemap marker missing")


if __name__ == "__main__":
    main()

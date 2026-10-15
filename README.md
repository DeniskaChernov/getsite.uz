# getsite.uz

Рабочая статическая версия лендинга getsite.

## Структура

- `index.html` - основной сайт.
- `assets/styles.css` - стили интерфейса и адаптива.
- `assets/app.js` - меню, прелоадер, reveal-анимации, форма и управление particle-сценой.
- `assets/particles2.js` - WebGL particle-сцена, перенесенная из Claude Design-макета.
- `assets/og-image.png` и `assets/favicon.svg` - изображения для предпросмотра и иконки.
- `manifest.webmanifest`, `robots.txt`, `sitemap.xml` - файлы для публикации и индексации.
- `_headers` - рекомендуемые security headers для статических хостингов, которые поддерживают этот формат.
- `project/` - исходный handoff-архив с `.dc.html` прототипами.

Главный исходный макет: `project/getsite v4.dc.html`.

## Запуск

Сайт можно открыть напрямую через `index.html` или поднять любой статический сервер из корня проекта.

## Публикация на Cloudflare

Сайт работает в Cloudflare Workers (`getsite-uz`). Домены `getsite.uz` и
`www.getsite.uz` направлены на Worker маршрутами из `wrangler.jsonc`.
Railway и PostgreSQL для сайта не требуются; Telegram-бот и CRM развёртываются отдельно.

```sh
npm ci
npm run deploy
```

Для первого входа в аккаунт Cloudflare на другом компьютере выполните
`npx wrangler login`. Для локальной проверки используйте `npm run dev`.

`npm run build` собирает в `dist/` только публичные HTML-страницы, ресурсы,
языковые версии и SEO-файлы. Исходные прототипы, документация и настройки
не публикуются. `_headers` задаёт защитные заголовки, `_redirects` сохраняет
старые SEO-редиректы. Worker сохраняет URL с `.html` и открывает `/`, `/en/`,
`/uz/` без изменения существующих ссылок. `/health` возвращает `OK`.

В Cloudflare DNS обе записи доменов должны оставаться **Proxied**.
Для Worker Routes используется адрес-заглушка `192.0.2.1`; весь HTTP-трафик
обслуживает Worker, обращения к Railway отсутствуют.

Настройки Git-сборки Cloudflare: репозиторий `DeniskaChernov/getsite.uz`,
ветка `main`, корень `/`, команда сборки `npm run build`,
команда публикации `npx wrangler deploy`.

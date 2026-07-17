# Security

Статический сайт: в репозитории нет серверного кода, базы данных и обработчиков форм. Все заявки уходят через deep-link в Telegram-бота.

## Что уже защищено

- **Строгая CSP** прописана `<meta http-equiv>` на каждой странице: скрипты только с `self` и `mc.yandex.*`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`. Инлайн-скрипты запрещены.
- **`_headers`** содержит полный набор security-заголовков (CSP c `frame-ancestors`, HSTS, `nosniff`, `Permissions-Policy`, COOP/CORP) — для хостингов, которые читают этот формат.
- **Аналитика по согласию**: Яндекс Метрика загружается только после явного согласия в cookie-виджете (`assets/analytics.js`), webvisor выключен.
- **Telegram deep-links**: payload на фронте фильтруется по allowlist-регулярке `[a-zA-Z0-9_-]`, максимум 64 символа; все внешние ссылки — `rel="noopener noreferrer"`.
- **Нет пользовательского ввода в DOM**: `innerHTML` используется только для собственных i18n-словарей из бандла.
- **Секретов в репозитории нет**: токен бота и ID Метрики не хранятся в коде (`site-config.js` содержит только публичные username).
- `/.well-known/security.txt` — контакт для ответственного разглашения.

## Что настраивается на стороне Cloudflare (не в репо)

Сайт стоит за Cloudflare. В дашборде должно быть включено:

1. **SSL/TLS → Full (strict)** и **Always Use HTTPS**.
2. **HSTS** (SSL/TLS → Edge Certificates): max-age 12 мес, includeSubDomains, preload — если хостинг не отдаёт заголовок из `_headers`.
3. **Transform Rule / Response Header**: продублировать заголовки из `_headers`, если origin их не отдаёт (проверить: `curl -I https://getsite.uz`).
4. **Bot Fight Mode / WAF managed rules** — базовая защита от сканеров.
5. DNS-записи только проксированные (оранжевое облако), origin (Railway) не светить напрямую.

## Регулярная проверка

- https://securityheaders.com/?q=getsite.uz — цель A/A+.
- https://observatory.mozilla.org — цель B+ и выше.
- После смены хостинга перепроверить, что заголовки из `_headers` реально отдаются.

## Telegram-бот

Требования к безопасности бота вынесены в `docs/telegram-bot-prompt.md`, раздел «Безопасность». Ключевое: токен только в секретах окружения, webhook c `secret_token`, rate-limit на пользователя, никаких оплат и персональных данных сверх мини-брифа.

## Reporting

Уязвимости: приватно на `getsiteuzbekistan@gmail.com` или @getsiteuz в Telegram.

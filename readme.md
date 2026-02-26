# btlz-wb-test

Сервис синхронизации тарифов WB → Postgres → Google Sheets.

## Быстрый старт

### 1. Подготовка окружения

```bash
cp example.env .env
# Заполните .env реальными значениями (WB_API_TOKEN и т.д.)
```

### 2. Google Service Account

Положите JSON-ключ сервисного аккаунта в файл `credentials/google.json`:

```bash
mkdir -p credentials
cp /path/to/your-service-account-key.json credentials/google.json
```

Файл монтируется в контейнер как read-only volume по пути `/app/credentials/google.json`.
Директория `credentials/` добавлена в `.gitignore` — ключ не попадёт в репозиторий.

### 3. Запуск

```bash
docker compose up --build
```

Приложение:
- применяет миграции при старте
- запускает seeds только в `NODE_ENV=development`
- по cron (из `SYNC_FREQUENCY`) забирает тарифы из WB и экспортирует в Google Sheets
- поднимает HTTP-сервер с `GET /health` на `APP_PORT`

### Команды разработки

Запуск только БД:

```bash
docker compose up -d --build postgres
```

Миграции и сиды вне контейнера:

```bash
npm run knex:dev migrate latest
npm run knex:dev seed run
```

Разработка с hot-reload:

```bash
npm run dev
```

### Конфигурация

Все настройки — через переменные окружения (см. `example.env`):

| Переменная | Описание |
|---|---|
| `POSTGRES_*` | Подключение к Postgres |
| `APP_PORT` | Порт HTTP-сервера |
| `SYNC_FREQUENCY` | `minutely` или `hourly` |
| `WB_TARIFFS_BOX_URL` | URL эндпоинта тарифов WB |
| `WB_API_TOKEN` | Токен авторизации WB API |
| `ARCHIVE_DAYS` | Глубина архива в днях |
| `GOOGLE_SERVICE_ACCOUNT_JSON_PATH` | Путь к JSON-ключу сервисного аккаунта |

### Финальная проверка

```bash
docker compose down --rmi local --volumes
docker compose up --build
```

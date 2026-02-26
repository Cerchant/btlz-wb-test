btlz-wb-test

Сервис получает тарифы Wildberries по расписанию, сохраняет их в PostgreSQL по дням и экспортирует в Google Sheets.

---

Как это работает

По расписанию из SYNC_FREQUENCY (каждую минуту или каждый час) сервис выполняет цикл:

- Запрашивает тарифы WB через GET /api/v1/tariffs/box?date=YYYY-MM-DD с авторизацией по токену.
- Сохраняет данные в PostgreSQL с UPSERT по дате и складу, поэтому внутри одного дня данные перезаписываются свежими.
- Для каждой Google-таблицы из SPREADSHEET_IDS обновляет два листа.
- Лист stocks_coefs содержит тарифы за текущий день, отсортированные по коэффициенту доставки от меньшего к большему.
- Лист stocks_coefs_archive содержит архив за последние ARCHIVE_DAYS дней с сортировкой по дате (убывание) и коэффициенту доставки (возрастание).

HTTP-сервер поднимается на порту APP_PORT и отвечает на GET /health проверкой соединения с PostgreSQL.

---

Тестовый запуск (development)

В example.env уже заполнены все данные для проверки тестового задания, включая токен WB, сервисный аккаунт Google и ID таблицы. Запустите одной командой:

```
docker compose --env-file example.env up --build
```

Сервис применяет миграции, запускает seeds и включает cron-задачу. Ничего копировать или заполнять не нужно.

Таблица для проверки тестового задания: https://docs.google.com/spreadsheets/d/1Mpsvr3AQcUkXuQCa1hNF3kvMHrph9z5akNzJgBGuE3o/edit?gid=546504237#gid=546504237

---

Запуск в production

Для работы с собственными данными скопируйте example.env в .env и заполните переменные своими значениями:

```
cp example.env .env
```

Поставьте NODE_ENV=production, укажите свой WB_API_TOKEN, SPREADSHEET_IDS и GOOGLE_SERVICE_ACCOUNT_JSON. Затем запустите:

```
docker compose up --build
```

В production-режиме seeds не запускаются, сервис работает только с данными из .env.

---

Переменные окружения

Все переменные описаны в example.env, вот что каждая из них означает:

| Переменная | Описание | Допустимые значения | Пример |
|---|---|---|---|
| NODE_ENV | Режим работы, seeds запускаются только в development | development, production | production |
| POSTGRES_PORT | Порт PostgreSQL | число | 5432 |
| POSTGRES_DB | Имя базы данных | строка | postgres |
| POSTGRES_USER | Пользователь базы данных | строка | postgres |
| POSTGRES_PASSWORD | Пароль к базе данных | строка | postgres |
| APP_PORT | Порт HTTP-сервера | число | 5000 |
| SYNC_FREQUENCY | Частота синхронизации, управляет и ingest, и export | minutely, hourly | minutely |
| WB_TARIFFS_BOX_URL | URL эндпоинта тарифов WB | URL | https://common-api.wildberries.ru/api/v1/tariffs/box |
| WB_API_TOKEN | Токен авторизации WB API | строка | ваш токен из личного кабинета WB |
| ARCHIVE_DAYS | Сколько дней хранить в архивном листе | целое число | 30 |
| SPREADSHEET_IDS | ID Google-таблиц через запятую | строка | abc123,def456 |
| GOOGLE_SERVICE_ACCOUNT_JSON | JSON сервисного аккаунта Google целиком в одну строку | JSON-строка | см. ниже |

POSTGRES_HOST не нужен в .env, потому что compose.yaml подставляет имя контейнера postgres автоматически. Для локальной разработки без Docker подставляется localhost по умолчанию.

---

Google Service Account

Для работы с Google Sheets нужен сервисный аккаунт Google Cloud. Вот пошаговая настройка:

1. Откройте Google Cloud Console (console.cloud.google.com), перейдите в раздел IAM, затем Сервисные аккаунты.
2. Создайте новый сервисный аккаунт или выберите существующий.
3. Нажмите на аккаунт, перейдите на вкладку Ключи, нажмите Добавить ключ, выберите тип JSON и скачайте файл.
4. Откройте скачанный файл и скопируйте его содержимое целиком в переменную GOOGLE_SERVICE_ACCOUNT_JSON в вашем .env файле.

Вставлять JSON нужно в одну строку. Если в скачанном файле JSON занимает несколько строк, сожмите его в одну. Вот как это сделать через терминал:

```
cat your-key.json | tr -d '\n' | pbcopy
```

После этого вставьте содержимое буфера обмена в .env после GOOGLE_SERVICE_ACCOUNT_JSON=.

Расшарьте Google-таблицу на email сервисного аккаунта:

1. Из скачанного JSON скопируйте значение поля client_email (выглядит как name@project.iam.gserviceaccount.com).
2. Откройте вашу Google-таблицу, нажмите Настройки доступа.
3. Вставьте скопированный email и выберите роль Редактор.

Каждая Google-таблица должна содержать два листа (вкладки) с именами stocks_coefs и stocks_coefs_archive. Создайте их вручную, если их ещё нет.

---

Как указать Google-таблицы для экспорта

Список таблиц задаётся в переменной SPREADSHEET_IDS через запятую. spreadsheet_id берётся из URL таблицы: https://docs.google.com/spreadsheets/d/ВОТ_ЭТОТ_ID/edit

Пример для одной таблицы:

```
SPREADSHEET_IDS=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
```

Пример для нескольких таблиц:

```
SPREADSHEET_IDS=ID_ПЕРВОЙ_ТАБЛИЦЫ,ID_ВТОРОЙ_ТАБЛИЦЫ,ID_ТРЕТЬЕЙ_ТАБЛИЦЫ
```

---

Проверка работы

1. Убедитесь, что /health отвечает 200:

```
curl http://localhost:5000/health
```

Ответ при нормальной работе выглядит так: {"status":"ok"}.

2. Проверьте, что тарифы записались в базу:

```
docker compose exec postgres psql -U postgres -d postgres -c \
  "SELECT date, warehouse_name, box_delivery_coef_expr FROM tariffs_box_daily ORDER BY date DESC LIMIT 5;"
```

Если данные появились, ingest работает корректно.

3. Откройте Google-таблицу и проверьте, что листы stocks_coefs и stocks_coefs_archive заполнены данными.

---

Локальная разработка

Для разработки без Docker запустите только базу и приложение отдельно:

```
docker compose up -d --build postgres
npm run dev
```

В этом режиме NODE_ENV=development (из .env), поэтому seeds запустятся автоматически.

---

Чистый перезапуск

Если нужно удалить все данные и пересобрать с нуля:

```
docker compose down --rmi local --volumes
docker compose up --build
```

Эта команда удалит образы и тома PostgreSQL, затем пересоберёт проект и применит миграции заново.

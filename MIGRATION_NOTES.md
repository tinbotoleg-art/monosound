# Удаление AI и переход на статический фронтенд + правило-based рекомендации

## Что удалить из репозитория

- `server.ts` — весь Express-сервер с эндпоинтами `/api/recommendations` и `/api/ai-playlist`
- `metadata.json` — специфично для Google AI Studio, больше не нужно
- старый `.env.example` (с `GEMINI_API_KEY`) — замените на новый (см. ниже)
- из `package.json`: `express`, `@google/genai`, `dotenv`, `@types/express`, `esbuild` (если использовался только для сборки `server.ts`)

## Что добавить / заменить

| Было | Стало |
|---|---|
| `lib/aiRecommendations.ts` | `lib/recommendationEngine.ts` — без внешних вызовов к AI |
| `components/RecommendationsView.tsx` | обновлён — берёт `userId`, вызывает `getRecommendations()` |
| `components/CreatePlaylistModal.tsx` | обновлён — вкладка «По настроению» работает на `generateLocalPlaylist()`, без сети |
| `App.tsx` | добавлен стабильный `userId` (аккаунт или анонимный guest-id) + синхронизация профиля на сервер |
| `types.ts` | категория рекомендаций `ai_curated` → `similar_user` |
| `package.json` | скрипты `dev`/`build`/`preview` теперь — чистый Vite, без Express |
| `.env.example` | вместо `GEMINI_API_KEY` — `VITE_API_BASE_URL` |

## Как теперь работают рекомендации (без ИИ)

Три сигнала считаются локально в браузере на основе `PreferenceProfile`:

1. **По жанрам** — `favoriteGenres[track.genre]`, нормализовано 0–100%.
2. **По артистам** — `favoriteArtists[track.artist]`, нормализовано 0–100%.
3. **По похожим пользователям** — сравнение множества `likedTrackIds` текущего
   пользователя с профилями других пользователей по индексу Жаккара:

   ```
   similarity = |A ∩ B| / |A ∪ B| * 100
   ```

   Берутся только пользователи с `similarity` от **70% до 100%**. Треки,
   которые им нравятся (и которых нет у текущего пользователя),
   рекомендуются с весом, равным средней похожести проголосовавших
   пользователей.

Если сервер профилей недоступен или `VITE_API_BASE_URL` не задан —
третий сигнал просто не участвует, работают жанры и артисты.

## Что нужно реализовать на вашем музыкальном сервере (не ИИ, просто 2 роута)

```
POST {API_BASE}/profiles/:userId
  body: {
    likedTrackIds: string[],
    favoriteGenres: Record<string, number>,
    favoriteArtists: Record<string, number>
  }
  -> upsert профиля пользователя (по userId)

GET {API_BASE}/profiles
  -> [
       { userId, likedTrackIds, favoriteGenres, favoriteArtists },
       ...
     ]
     (профили всех пользователей — сравнение схожести делает клиент)
```

`userId` — либо `id` авторизованного пользователя, либо постоянный
анонимный `guest-...` id, который клиент сам генерирует и хранит в
`localStorage` (реализовано в `App.tsx`).

## Деплой

Приложение больше не требует Node-сервера в рантайме — это чистая
статика после `vite build` (папка `dist/`). Можно раздавать через
GitHub Pages, Netlify, Vercel, Cloudflare Pages и т.п. Музыка и
профили пользователей продолжают жить на вашем отдельном сервере,
адрес которого указывается в `VITE_API_BASE_URL`.

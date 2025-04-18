# Wishlist Site

Одностраничное React + TypeScript приложение с Vite и Tailwind CSS для ведения списка желаемых вещей.

## 📦 Стек технологий

- React 18 + TypeScript
- Vite
- Tailwind CSS
- ESLint + Prettier

## 🚀 Быстрый старт

```bash
# Клонирование репозитория
git clone <repo-url>
cd wishlist-site

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

Приложение будет доступно по адресу:

> http://localhost:5173

## 📑 Скрипты

- `npm run dev` — запуск с HMR для разработки
- `npm run build` — сборка в папку `dist`
- `npm run preview` — локальный сервер для проверки сборки
- `npm run lint` — проверка кода через ESLint
- `npm run format` — автоформатирование через Prettier

## 🗂 Структура проекта

```
.
├── public
│   └── index.html
├── src
│   ├── components
│   │   ├── Todo.tsx
│   │   └── ScrollToTopButton.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── .gitignore
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

## ⚙️ Как это работает

- Компонент `ScrollToTopButton` отслеживает позицию скролла и показывает кнопку при достижении порога в 100px.
- В `App.tsx` хранится состояние списка, добавление и удаление элементов передаётся через пропсы в `Todo`.

## ☁️ Деплой

1. Создать пустой репозиторий на GitHub
2. ```bash
   git remote add origin <repo-url>
   git push -u origin main
   ```
3. Подключить к платформе (Vercel / Netlify / GitHub Pages)

## 📄 Лицензия

MIT
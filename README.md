# Мой Вишлист

Простое одностраничное веб-приложение (SPA) для управления личным списком желаний. Дизайн минималистичный, данные хранятся локально в браузере (Local Storage).

## ✨ Стек технологий

*   **Frontend:** React 19 + TypeScript
*   **Стилизация:** Tailwind CSS 4
*   **Сборка:** Vite
*   **Хранение данных:** Local Storage

## 🚀 Быстрый старт

1.  **Клонируйте репозиторий:**
    ```bash
    git clone <URL вашего репозитория>
    cd wishlist-site
    ```
2.  **Установите зависимости:**
    ```bash
    npm install
    ```
3.  **Запустите dev-сервер:**
    ```bash
    npm run dev
    ```
    Приложение будет доступно по адресу `http://localhost:5173` (или на другом порту, если 5173 занят).

## 🛠️ Сборка для деплоя

1.  **Выполните сборку проекта:**
    ```bash
    npm run build
    ```
    Статические файлы для деплоя будут созданы в папке `dist`.

2.  **Разверните папку `dist`** на любом хостинге для статических сайтов (например, Vercel, Netlify, GitHub Pages, Cloudflare Pages).

## 📜 Основные скрипты

*   `npm run dev`: Запуск в режиме разработки с Hot Module Replacement (HMR).
*   `npm run build`: Сборка оптимизированной версии приложения в папку `dist`.
*   `npm run lint`: Проверка кода с помощью ESLint.
*   `npm run preview`: Локальный запуск сервера для просмотра собранной версии из `dist`.

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
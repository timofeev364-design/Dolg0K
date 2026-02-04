# Как загрузить проект на GitHub и Деплоить

Этот способ самый правильный и удобный.

## 1. Подготовка (Уже сделано)
Я создал файл `.gitignore`, чтобы лишние папки (вроде `node_modules` и `database.json`) не улетели в интернет.

## 2. Создание репозитория на GitHub
1.  Зайдите на [github.com/new](https://github.com/new).
2.  Назовите репозиторий, например `babki-app`.
3.  Выберите **Private** (Приватный), так как это ваше личное приложение.
4.  Нажмите **Create repository**.

## 3. Загрузка кода (Через терминал)

В VS Code откройте терминал (`Ctrl + ~`) и по очереди введите эти команды (замените `ВАШ_GITHUB_НИК` на ваш реальный ник):

```bash
git init
git add .
git commit -m "First commit: Babki App"
git branch -M main
git remote add origin https://github.com/ВАШ_GITHUB_НИК/babki-app.git
git push -u origin main
```

*(Если `git init` выдает ошибку, что такой команды нет, нужно установить [Git](https://git-scm.com/downloads)).*

---

## 4. Как теперь запустить это в интернете?

Когда код окажется на GitHub, магия становится проще:

### Для сайта (Vercel):
1.  Зайдите на [vercel.com](https://vercel.com).
2.  Нажмите **Add New...** -> **Project**.
3.  Нажмите **Import** напротив вашего репозитория `babki-app`.
4.  В настройках:
    - **Root Directory**: `apps/mobile` (нажмите Edit и выберите папку).
    - **Framework Preset**: Expo (обычно само, или выберите Other -> Build Command: `npx expo export:web`).
5.  Нажмите **Deploy**.
6.  *Если будут ошибки билда, возможно, нужно будет настроить команды установки dependencies в корне, но Vercel обычно умный.*

### Для сервера (Render):
1.  Зайдите на [render.com](https://render.com).
2.  Нажмите **New +** -> **Web Service**.
3.  Выберите "Build from GitHub" и найдите `babki-app`.
4.  **Root Directory**: `apps/api`.
5.  **Build Command**: `npm install`.
6.  **Start Command**: `node server.js`.
7.  Нажмите **Create Web Service**.

После этого следуйте **Шагу 4** из `DEPLOYMENT_GUIDE.md` — отправьте ссылку с Vercel в BotFather.

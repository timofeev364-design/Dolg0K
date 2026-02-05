# Porting to Telegram Mini App (TMA)

This guide explains how to adapt the existing Expo mobile application into a Telegram Mini App.

## Prerequisites

- [Telegram Account](https://telegram.org)
- [BotFather](https://t.me/BotFather) bot
- [Vercel](https://vercel.com) (or any web hosting)

## Step 1: Web Compatibility

The app is already built with Expo Router, which supports web out of the box.
Ensure all `react-native` imports that are not supported on web (like `StatusBar` barStyle) have platform guards or web equivalents.

**Check `app/_layout.tsx`:**
We have added a global style injection for Web to ensure the background looks correct and scrolling feels native.

## Step 2: Install Telegram Web App SDK

Install the types and SDK script.

```bash
npm install --save @twa-dev/sdk
npm install --save-dev @types/telegram-web-app
```

Add the script to your `public/index.html` (if you eject) or use a layout effect to inject it.
Since we are using Expo Router, we can add it in `app/_layout.tsx` or a custom `index.html`.

**Easiest way in Expo:**
Add it to the `head` using `react-helmet` or simply check for `window.Telegram`.

```typescript
// src/hooks/useTelegram.ts
export function useTelegram() {
    const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
    return {
        tg,
        user: tg?.initDataUnsafe?.user,
        queryId: tg?.initDataUnsafe?.query_id,
    };
}
```

## Step 3: Deploy to Vercel

1.  Run `npm run web:build` (or `npx expo export -p web`) to check for errors.
2.  Connect your repo to Vercel.
3.  Set the **Output Directory** to `dist` (default for Expo Router export).
4.  Deploy. You will get a URL like `https://babki-app.vercel.app`.

## Step 4: Configure BotFather

1.  Open [BotFather](https://t.me/BotFather) in Telegram.
2.  Create a new bot `/newbot`.
3.  Create a new Web App `/newapp`.
4.  Select your bot.
5.  Enter title and description.
6.  **Important**: Paste your Vercel URL (e.g., `https://babki-app.vercel.app`) when asked for the Web App URL.
7.  BotFather will give you a "Short name" link (e.g., `t.me/mybot/app`).

## Step 5: Integration Points

### 1. Auto-Login
Instead of asking for a name in `onboarding.tsx`, checks if `tg.initDataUnsafe.user` exists.

```typescript
// app/onboarding.tsx
const { user } = useTelegram();
useEffect(() => {
    if (user?.first_name) {
        setName(user.first_name);
    }
}, [user]);
```

### 2. MainButton
Use the Telegram Main Button (the big button at the bottom) instead of creating your own fixed buttons.

```typescript
useEffect(() => {
    if (tg) {
        tg.MainButton.setText("Confirm");
        tg.MainButton.onClick(handleComplete);
        tg.MainButton.show();
    }
}, []);
```

### 3. Theme
Sync your `src/theme.ts` with `tg.themeParams` to respect user's Telegram theme (Dark/Light).

## Troubleshooting

- **White Screen**: Check console logs for JS errors.
- **Scroll Issues**: Ensure `body { overflow-y: scroll }` is set in global styles.
- **Back Button**: Handle `tg.BackButton.onClick(() => router.back())`.

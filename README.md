# 🗾 旅遊規劃 APP

4 人共同編輯的旅遊行程規劃工具，支援即時同步！

## ✨ 功能

- 📍 **行程規劃** - 新增景點、美食、購物、住宿
- 💰 **記帳功能** - 預算追蹤、消費紀錄、分帳
- ✅ **準備清單** - 出發前 checklist
- 🛍️ **必買清單** - 購物清單
- 👥 **多人協作** - 最多 4 人即時同步編輯
- 🔗 **分享連結** - 一鍵邀請旅伴

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定 Firebase

在開始之前，你需要先建立 Firebase Realtime Database：

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇你的專案 `travel-planner-app`
3. 左側選單 → **建構** → **Realtime Database**
4. 點擊 **建立資料庫**
5. 選擇 **asia-southeast1 (新加坡)**
6. 選擇 **以測試模式啟動**
7. 完成後，複製資料庫 URL 到 `src/firebase.js`

### 3. 啟動開發伺服器

```bash
npm start
```

瀏覽器會自動開啟 http://localhost:3000

## 📱 部署到 GitHub Pages

### 1. 建立 GitHub Repository

1. 前往 [GitHub](https://github.com/new)
2. 建立新的 repository，例如 `travel-planner`
3. 設為 Public

### 2. 推送程式碼

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的帳號/travel-planner.git
git push -u origin main
```

### 3. 部署

```bash
npm run deploy
```

### 4. 設定 GitHub Pages

1. 前往 Repository → Settings → Pages
2. Source 選擇 `gh-pages` branch
3. 儲存後等待幾分鐘
4. 你的網站就會上線：`https://你的帳號.github.io/travel-planner`

## 🔗 分享給旅伴

部署完成後，把網址分享給朋友，他們就可以一起編輯行程了！

每個人第一次進入時會輸入暱稱，之後所有編輯都會即時同步。

## 📂 專案結構

```
travel-planner-firebase/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # 主要元件
│   ├── firebase.js     # Firebase 設定
│   └── index.js        # 入口點
├── package.json
└── README.md
```

## 🛠️ 技術棧

- React 18
- Firebase Realtime Database
- GitHub Pages

## 📄 License

MIT

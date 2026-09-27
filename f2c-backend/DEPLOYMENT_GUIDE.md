# 🚀 ZUNKAKO Backend - Render Free Tier Deployment Guide

This guide walks you through deploying the Node.js Express backend for Zunkako App on Render (Free Cloud Hosting) step-by-step.

---

## 📋 Prerequisites
1. A GitHub account.
2. The Zunkako project pushed to your GitHub repository.

---

## 🛠️ Step-by-Step Render Deployment

### Step 1: Sign up on Render
1. Open [https://render.com](https://render.com) in your web browser.
2. Click **Get Started for Free** and log in using your **GitHub account**.

### Step 2: Create a New Web Service
1. On the Render Dashboard, click the **New +** button in the top right.
2. Select **Web Service**.
3. Choose **Build and deploy from a Git repository** and click **Next**.
4. Select your **Zunkako** repository from the list (click **Connect**).

### Step 3: Configure Deployment Settings
Fill in the deployment settings as follows:

- **Name**: `zunkako-backend`
- **Region**: `Singapore (Asia Pacific)` (Best latency for South India)
- **Branch**: `master` (or `main`)
- **Root Directory**: `f2c-backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Instance Type**: **Free** ($0 / month)

### Step 4: Configure Environment Variables
Scroll down to **Environment Variables** and add:
- `PORT` = `3000`
- `NODE_ENV` = `production`

### Step 5: Deploy Service
1. Click **Create Web Service**.
2. Render will automatically install dependencies and launch your server.
3. Once complete, Render will display your live URL (e.g., `https://zunkako-backend.onrender.com`).

---

## 📱 Update Mobile App API Service
In your React Native App, open `src/services/api.js` and set the production base URL:
```javascript
const BASE_URL = 'https://zunkako-backend.onrender.com/api';
```

---
*Zunkako F2C Backend Infrastructure ready for Production!*

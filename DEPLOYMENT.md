# Deployment Guide - Free Hosting Options

## Option 1: GitHub Pages (Recommended) ⭐

**Best for**: Simple, reliable, and free hosting with version control

### Steps:

1. **Create a GitHub account** (if you don't have one): https://github.com

2. **Create a new repository**:
   - Go to https://github.com/new
   - Name it `blackjack-strategy-helper` (or any name you like)
   - Make it **Public** (required for free GitHub Pages)
   - Click "Create repository"

3. **Upload your files**:
   ```bash
   # In your project directory
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/blackjack-strategy-helper.git
   git push -u origin main
   ```
   
   Or use GitHub Desktop app for a GUI approach.

4. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click **Settings** tab
   - Scroll to **Pages** section
   - Under **Source**, select `main` branch and `/ (root)` folder
   - Click **Save**
   - Wait 1-2 minutes for deployment

5. **Access your site**:
   - Your site will be available at: `https://YOUR_USERNAME.github.io/blackjack-strategy-helper/`

---

## Option 2: Netlify Drop ⚡

**Best for**: Fastest deployment (no Git required)

### Steps:

1. **Go to**: https://app.netlify.com/drop
2. **Drag and drop** your entire project folder
3. **Get instant URL**: Your site is live immediately!
4. **Optional**: Sign up for a free account to get a custom domain

**Pros**: No Git needed, instant deployment
**Cons**: Need to re-upload when you make changes (unless you connect Git)

---

## Option 3: Vercel 🚀

**Best for**: Modern, fast, great performance

### Steps:

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd /Users/haibwu/Projects/blackjack-strategy-helper
   vercel
   ```

3. **Follow prompts** - it will give you a URL instantly

**Pros**: Very fast, great CDN, easy updates
**Cons**: Requires Node.js installed

---

## Option 4: Cloudflare Pages 🌐

**Best for**: Fast global CDN, free custom domain

### Steps:

1. **Sign up**: https://pages.cloudflare.com
2. **Connect GitHub** (or upload manually)
3. **Deploy** - automatic deployments on every push

**Pros**: Fastest CDN, free SSL, custom domains
**Cons**: Slightly more setup

---

## Option 5: Surge.sh 📦

**Best for**: Simple command-line deployment

### Steps:

1. **Install Surge**:
   ```bash
   npm install -g surge
   ```

2. **Deploy**:
   ```bash
   cd /Users/haibwu/Projects/blackjack-strategy-helper
   surge
   ```

3. **Follow prompts** - choose a subdomain or use the suggested one

**Pros**: Simple, fast
**Cons**: Requires Node.js

---

## Recommendation Summary

| Option | Ease | Speed | Best For |
|--------|------|-------|----------|
| **GitHub Pages** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Most users |
| **Netlify Drop** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Quickest start |
| **Vercel** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Developers |
| **Cloudflare Pages** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Performance |
| **Surge.sh** | ⭐⭐⭐ | ⭐⭐⭐⭐ | CLI users |

---

## Quick Start (Recommended: GitHub Pages)

1. Create GitHub account
2. Create new repository
3. Upload files via web interface or Git
4. Enable Pages in Settings
5. Done! 🎉

Your site will be live at: `https://YOUR_USERNAME.github.io/blackjack-strategy-helper/`

---

## Notes

- All options are **completely free**
- Your app uses IndexedDB (local storage), so it works offline
- No backend needed - it's a static site
- All data is stored locally in the user's browser
- No API keys or configuration needed


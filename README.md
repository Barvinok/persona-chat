# PersonaChat

An AI-powered app that learns someone's communication style from their messages and lets you chat with them as if they were there.

## Features

- Create profiles by uploading a TXT, PDF, or WhatsApp export
- AI responds in that person's voice, tone, and language
- Supports Russian, Ukrainian, RU+UK mixed, and English
- Chat history persisted in browser (localStorage)
- Clean, warm UI with serif typography

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Vercel Edge Functions (serverless)
- **AI**: Claude claude-sonnet-4-20250514 via Anthropic API
- **State**: Zustand (persisted to localStorage)
- **DB**: Supabase Storage

---

## Local Development

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/persona-chat.git
cd persona-chat
npm install
```

### 2. Set your API key

Create a `.env.local` file:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run locally

Install Vercel CLI to run edge functions locally:

```bash
npm install -g vercel
vercel dev
```

Or just run the frontend (API calls will fail without a key):

```bash
npm run dev
```

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/persona-chat.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import your `persona-chat` repository
4. Framework preset: **Vite** (auto-detected)
5. Click **Deploy**

### 3. Add your Anthropic API key

After deploy:
1. Go to your project → **Settings → Environment Variables**
2. Add: `ANTHROPIC_API_KEY` = `sk-ant-...`
3. Click **Save** then **Redeploy**

Your app is now live at `https://persona-chat-xxx.vercel.app`

---

## Adding a New Profile

1. Click **+ New profile** in the sidebar
2. Enter the person's name
3. Choose the response language
4. Upload their communication file (TXT works best — copy/paste WhatsApp exports or email threads)
5. Click **Create profile** and start chatting

## File Format Tips

- **TXT**: Plain text, any encoding. Works great for copied messages.
- **WhatsApp**: Export chat as `.txt` from WhatsApp → Share → Export Chat (without media)
- **PDF**: Text-based PDFs work; scanned images won't extract well.

The more messages in the file, the better the AI captures their voice.

---

## Project Structure

```
persona-chat/
├── api/
│   └── chat.js          # Vercel edge function (proxies Anthropic API)
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── ChatWindow.jsx
│   │   ├── NewProfileModal.jsx
│   │   └── Avatar.jsx
│   ├── lib/
│   │   ├── store.js      # Zustand state management
│   │   └── api.js        # API helper + system prompt builder
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── vercel.json
├── vite.config.js
└── package.json
```

# Portfolio Admin Panel

A private CMS dashboard to manage your portfolio content — projects, experience, and contact messages.

---

## Setup

**Step 1 — Install dependencies**
```bash
cd portfolio-admin
npm install
```

**Step 2 — Create your .env file**
```bash
cp .env.example .env
```

Open `.env` and set:
```
VITE_API_URL=http://localhost:3001/api
```

**Step 3 — Start the dev server**
```bash
npm run dev
```

Opens at: **http://localhost:5174**

---

## Login

Use your seeded admin credentials:
```
Email:    hello@eraf.dev
Password: admin123
```

**Change your password immediately** after first login via the backend API:
```
PATCH /api/admin/password
{ "currentPassword": "admin123", "newPassword": "your-new-password" }
```

---

## Pages

| Page | What you can do |
|------|----------------|
| **Dashboard** | See stats (total projects, experience, messages, unread count) + recent messages preview |
| **Projects** | View all projects, search by name/category, add new, edit existing, delete |
| **Experience** | View all experience entries, add new, edit, delete. "Currently working here" checkbox sets endDate to null |
| **Messages** | Read contact form submissions, filter by All/Unread/Starred, star important ones, delete, reply via email |

---

## How Auth Works

1. You enter email + password → hits `POST /api/admin/login`
2. Backend returns an **access token** (valid 15 min) + **refresh token** (valid 7 days)
3. Both tokens are saved in `localStorage`
4. Every API request automatically sends `Authorization: Bearer <token>`
5. When you close and reopen the browser, your session is restored from localStorage
6. Click "Sign Out" to clear tokens and return to login screen

---

## Deploying to Vercel (alongside your portfolio)

You can deploy the admin panel as a **separate Vercel project**:

```bash
# Build
npm run build

# Deploy with Vercel CLI
vercel --prod
```

In Vercel environment variables, set:
```
VITE_API_URL = https://your-portfolio-api.onrender.com/api
```

Your admin panel will be at a separate URL like `https://portfolio-admin-xx.vercel.app`

---

## Security Notes

- The admin panel URL is not linked anywhere on your public portfolio
- All admin API routes require a valid JWT — no token = 401 blocked
- Keep your admin email and password private
- Consider using a non-obvious URL when deploying (e.g. rename to `cms` or `control`)


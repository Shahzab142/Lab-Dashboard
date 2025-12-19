# Vercel Deployment Guide - Lab Monitor Dashboard

This guide explains how to deploy the Lab Monitor Dashboard to Vercel.

## 🚀 Deployment Steps

### 1. Import Project to Vercel
- Go to [vercel.com](https://vercel.com) and click **"Add New" -> "Project"**.
- Import your GitHub repository.
- Select the `dashboard` folder as the root directory of the project.

### 2. Configure Build Settings
The default settings for Vite should be automatically detected:
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 3. Set Environment Variables
You **MUST** add the following environment variables in the Vercel dashboard:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase Anon Key | `eyJhbGciOiJIUz...` |
| `VITE_SERVER_URL` | Your Render Server URL | `https://lab-systems-monitoring-server-2-0.onrender.com` |

### 4. Deploy
Click **"Deploy"**. Vercel will build your project and provide a production URL.

---

## 🛠 Troubleshooting

### SPA Routing
We have included a `vercel.json` file to handle Single Page Application (SPA) routing. This ensures that refreshing the page on routes like `/dashboard/history` doesn't result in a 404 error.

### Linting/TypeScript Errors
If the build fails due to linting errors, you can bypass them by modifying the build command to `npm run build` (which is already the default and doesn't run lint). If TypeScript errors occur, ensure your local environment is clean before pushing.

---

## 📈 Next Steps
Once deployed, make sure to update your Agent configuration if you change the Server URL in the future.

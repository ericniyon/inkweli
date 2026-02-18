<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Inkwell – Next.js full-stack app

A full-stack publishing platform built with **Next.js 15** (App Router), **Prisma**, and **PostgreSQL**.

## Stack

- **Frontend:** Next.js App Router, React 19, Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** PostgreSQL with Prisma ORM

## Run locally

**Prerequisites:** Node.js 18+, PostgreSQL (or a hosted DB URL)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment**
   - Copy or create `.env.local` with:
     - `DATABASE_URL` – PostgreSQL connection string (e.g. from Railway, Neon, or local Postgres)
     - `GEMINI_API_KEY` – optional, for AI features (e.g. branding in Admin)

3. **Database**
   ```bash
   npm run db:push    # create/update tables
   npm run db:seed     # optional: seed writers & subscription plans
   ```

4. **Dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Start dev server               |
| `npm run build`| Production build               |
| `npm run start`| Start production server        |
| `npm run db:push` | Sync Prisma schema to DB   |
| `npm run db:seed` | Seed plans & writers       |
| `npm run db:studio` | Open Prisma Studio       |

## API routes

- `GET /api/articles` – list published articles  
- `POST /api/articles` – create article (body: title, slug, authorId, …)  
- `GET /api/writers` – list writers  
- `GET /api/subscription-plans` – list subscription plans  

The app uses these when the database is set up; otherwise it falls back to mock data so the UI still works.

## Project layout

- `app/` – Next.js App Router (layout, page, API routes)
- `components/` – React UI components
- `lib/prisma.ts` – Prisma client singleton
- `prisma/schema.prisma` – database schema
- `types.ts` / `constants.ts` – shared types and fallback data

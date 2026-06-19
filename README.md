# AI Lecture Scheduler

Upload Georgian university (BTU) exam timetable screenshots, review extracted exam data, and generate the best 3-hour lecture windows for your class. Built as a single Vercel project with a React frontend and serverless API routes.

## Features

- OCR extraction from up to 50 student exam screenshots (OpenAI Vision)
- Batched processing to avoid serverless timeouts
- Editable review step for student names, subjects, dates, and times
- Scheduler ranks 3-hour lecture windows by student availability
- Results summary highlighting the **best two session slots**
- Export results as **CSV**, **Excel**, or a **shareable lecturer report**

## Project structure

```
exam-scheduler/
├── api/                  # Built Node.js route output (generated at build time)
├── server/               # TypeScript API route source
│   ├── extract.ts        # POST /api/extract
│   ├── calculate.ts      # POST /api/calculate
│   └── _lib/
│       ├── ocr.ts
│       └── scheduler.ts
├── frontend/             # React + Vite UI
├── package.json          # Node.js project entrypoint
├── scripts/
│   ├── build-api.mjs
│   └── verify-api.mjs
└── vercel.json
```

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- OpenAI API key with access to `gpt-4.1-mini`
- [Vercel CLI](https://vercel.com/docs/cli) optional (`npm run dev:vercel`)

## Local development

### 1. Install dependencies

```bash
npm install
npm install --prefix frontend
```

### 2. Configure environment variables

Create a local env file at the project root (not committed):

```bash
cp .env.example .env
```

Edit `.env`:

```env
OPENAI_API_KEY=sk-your-openai-api-key
OCR_DEFAULT_YEAR=2026
```

Leave `frontend/.env` without `VITE_API_URL` so the Vite dev server proxies `/api/*` to `http://127.0.0.1:3000`.

### 3. Run the full app locally

From the project root:

```bash
npm run dev
```

This starts:

- a local Node API server on `http://127.0.0.1:3000` (`/api/extract`, `/api/calculate`)
- the Vite frontend on `http://127.0.0.1:5173`

Open **http://127.0.0.1:5173** in your browser.

To use `vercel dev` instead (requires `vercel login`):

```bash
npm run dev:vercel
```

### Frontend-only dev (optional)

If you only need UI work and already have the local API server running on port 3000:

```bash
npm run dev --prefix frontend
```

The Vite dev server proxies `/api/*` to `http://localhost:3000`.

## Deploy to Vercel

### 1. Push to GitHub

Make sure the repository is on GitHub.

### 2. Import the project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `MariamManjo/exam-scheduler` (or your fork)
3. In **Project Settings**, confirm:
   - **Root Directory:** leave empty (repository root — not `frontend/`)
   - **Framework Preset:** `Other` (not FastAPI)
   - **Install / Build / Output:** leave empty — `vercel.json` sets these

`vercel.json` deploys `frontend/dist` as static files and treats `api/*.js` as Node.js serverless routes. TypeScript API source lives in `server/`; only the esbuild output in `api/` is deployed. There is no Python in git, so Vercel should not detect FastAPI.

### 3. Add environment variables

In Vercel → Project → Settings → Environment Variables, add:

| Name | Value | Required |
|------|-------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `OCR_DEFAULT_YEAR` | `2026` | No |

Apply to **Production**, **Preview**, and **Development**.

### 4. Deploy

Click **Deploy**. Vercel will:

1. install root + frontend dependencies and prebuild `api/*.js` routes
2. run `npm run build` (rebuild API routes, then Vite → `frontend/dist`)
3. deploy `/api/extract` and `/api/calculate` as Node.js serverless functions

Before deploying, you can simulate a clean Vercel clone locally:

```bash
npm run verify:vercel
```

### 5. Verify

After deployment:

1. Open your Vercel URL
2. Upload a BTU exam screenshot
3. Confirm OCR, review, schedule, and results all work
4. Download CSV / Excel / lecturer report from the results page

## API routes

### `POST /api/extract`

Processes **1 image per request** (the frontend sends one compressed screenshot at a time).

```json
{
  "images": [
    {
      "index": 0,
      "data": "<base64>",
      "contentType": "image/jpeg",
      "fallbackName": "Student 1"
    }
  ]
}
```

### `POST /api/calculate`

```json
{
  "students": [
    {
      "name": "Student 1",
      "exams": [{ "date": "2026-06-22", "time": "15:00" }]
    }
  ],
  "start_date": "2026-06-01",
  "end_date": "2026-06-30"
}
```

## Scheduler rules

- Working hours: 09:00–21:00
- Lecture duration: 3 hours
- Exam conflict window: 90 minutes from each exam start time
- Window step: 30 minutes
- Returns top 10 ranked windows

## Notes

- Images are compressed in the browser before OCR to stay within Vercel request limits.
- OCR uses a default year (`OCR_DEFAULT_YEAR`, default `2026`) when BTU screenshots show month/day only.
- No separate Python backend, Railway, or Render setup is required.
- If Vercel still shows a FastAPI error, open **Project Settings → General → Framework Preset** and set it to **Other**, then redeploy.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Full-stack local dev via `vercel dev` |
| `npm run build` | Build API routes + frontend for production |
| `npm run verify:vercel` | Simulate clean Vercel build (no prebuilt `api/*.js`) |
| `npm run lint` | Lint frontend |

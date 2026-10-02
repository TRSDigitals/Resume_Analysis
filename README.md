# TRS Digitals — AI Resume Analyzer

A polished, responsive resume analyzer with ATS-style scoring, job-description matching, skill detection, improvement suggestions, and optional OpenAI Responses API enhancement.

## Features
- PDF and DOCX upload
- Local fallback analyzer works without an AI key
- Optional AI analysis through a secure Node/Express backend
- ATS-style score and section scores
- Job-description keyword matching
- Matched and missing skills
- Resume issue detection
- Improvement suggestions
- Responsive TRS Digitals dashboard
- No API secrets in the frontend

## Run
Requirements: Node.js 20+

### Backend
```bash
cd server
npm install
copy .env.example .env
npm run dev
```

### Frontend
Open another terminal:
```bash
cd client
npm install
npm run dev
```

Then open the URL printed by Vite.

## Optional AI
Put your provider key in `server/.env`. The frontend never receives this secret.

The application still analyzes resumes locally when no AI key is configured.

## Important
The ATS score is an application-generated heuristic, not a guarantee of how a particular employer's ATS will score a resume.

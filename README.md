# Saifur Rahman — Portfolio & Digital Studio

A modern React, TypeScript, Express, and Three.js portfolio web application featuring an interactive 3D office experience with an autonomous guide, procedural architectural visualization, a research & project showcase, and a private Content Management Studio.

## Features

- **Interactive 3D Office Studio**: Built with Three.js featuring procedural lighting, furniture, custom marble/walnut textures, and a guide avatar that navigates to specific rooms.
- **Guided Tours & Route Picker**: Choose between the "Professional Journey" route or the "Projects & Research" route.
- **Project Showcase**: Filter by project categories, view technical stacks, project summaries, outcomes, external links, and save items to a local shortlist.
- **Research & Publications**: Publication index with topics, DOI links, abstracts, and citation metadata.
- **Clubs & Outreach**: Visual organizational marks with detailed activity timelines and honors.
- **Credential Search**: Live search and filtering for certificates with modal document previews.
- **Trophy Room & Event Gallery**: Highlighting achievements, awards, and event albums.
- **Contact & Spam Protection**: Client-validated contact form with honeypot fields and instant feedback.
- **Private Admin Studio (`/studio`)**: First-time account setup, authentication, 8-character minimum password security, password recovery codes, and full CRUD content management for profiles, records, messages, and uploaded media.
- **Bilingual Interface**: Full English and Bengali translation system.
- **Accessibility & Fallback**: Complete semantic HTML fallbacks when WebGL is unavailable, full keyboard accessibility, and reduced-motion support.

## Getting Started

### Development

```bash
npm install
npm run dev
```

The development server runs on `http://localhost:3000`.

### Build for Production

```bash
npm run build
npm run audit
npm start
```

## Production Deployment & Hosting Guide

The application uses an Express production server (`server.ts`) serving the pre-built Vite client assets while powering REST APIs for portfolio data, admin operations, contact form handling, and file uploads.

### Environment Configuration
Copy `.env.example` to `.env` in production:
```bash
PORT=3000
NODE_ENV=production
```

### Persistent Storage Requirements
- **JSON Database**: Defaults to `data/portfolio-db.json`. When deploying to services like Railway, Render, Fly.io, or VPS, mount a persistent volume at `/data` (or the directory containing `data/`) so content edits and contact inquiries survive redeployments.
- **Media Uploads**: Uploaded files are saved to `public/uploads/`. Mount a persistent volume or bind mount for `public/uploads` to preserve uploaded PDFs and images.
- **Git Hygiene**: `data/*.json` and `public/uploads/*` are automatically ignored by `.gitignore` to prevent committing live data or credentials.

### Automated Deployment Audit
Run the automated security and persistence check suite:
```bash
npm run audit
```
This verifies build artifacts, API data protection, admin token authorization, contact form honeypots, and persistence.

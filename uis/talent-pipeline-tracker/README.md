# TrackFlow Talent Pipeline

A Next.js App Router and TypeScript workspace for reviewing candidates across TrackFlow's warehouse and logistics hiring pipeline.

## Run locally

From `uis/talent-pipeline-tracker`, run:

```bash
npm ci
npm run dev -- --hostname 127.0.0.1
```

Open [http://localhost:3000](http://localhost:3000). No credentials or external service are needed for the demo.

- Search by name or email and combine status and stage filters. The URL stores those filters so the view can be bookmarked.
- Select a candidate to open their profile at `/candidates/[id]` without losing the filtered list. Update their status or stage, edit application details, and add or delete interview notes.
- Use **Add candidate** to register an application from another channel.

## Data and validation

The local demo implements `GET` and `POST` on `/records`, `GET`, `PATCH` and `PUT` on `/records/:id`, `GET` and `POST` on `/records/:id/notes`, and `DELETE` on `/records/:id/notes/:note_id`. The client adapter lives in `services/records.ts`; shared types live in `types/candidate.ts`.

The app starts with fictional candidates. Changes persist in `.tracker-data/records.json` by default. `TRACKER_DATA_DIR` can point a local server to a separate directory for testing. The store is intended for a single local instance; there is no authentication or production API integration. Only use fictional data until an authenticated backend is connected.

Run `npm run lint` and `npm run build` to validate the application.

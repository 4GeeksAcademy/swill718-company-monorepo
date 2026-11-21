import { randomUUID } from "node:crypto";
import { readStore, saveStore } from "@/services/demo-store";
import { parseProfileUrl } from "@/services/profile-url";
import { stages, statuses, type CandidateInput } from "@/types/candidate";

type Context = RouteContext<"/records/[[...parts]]">;

class RequestError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

function field(data: Record<string, unknown>, key: string, max = 250) {
  const value = data[key];
  if (typeof value !== "string" || value.trim().length > max) {
    throw new RequestError(`Enter a valid ${key} (up to ${max} characters).`);
  }
  return value.trim();
}

function option<T extends string>(choices: readonly T[], value: unknown, label: string): T {
  const result = choices.find((choice) => choice === value);
  if (!result) throw new RequestError(`Choose a valid ${label}.`);
  return result;
}

function link(data: Record<string, unknown>, key: string) {
  const value = field(data, key, 2048);
  if (value && !parseProfileUrl(value)) {
    throw new RequestError(`${key === "cv" ? "CV" : "LinkedIn"} must be an HTTP or HTTPS link.`);
  }
  return value;
}

function candidateInput(data: Record<string, unknown>): CandidateInput {
  const name = field(data, "name");
  const email = field(data, "email");
  const position = field(data, "position");
  if (!name || !position || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new RequestError("Full name, a valid email address, and position are required.");
  }
  const appliedOn = field(data, "appliedOn");
  const date = new Date(`${appliedOn}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(appliedOn) || !Number.isFinite(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== appliedOn) {
    throw new RequestError("Enter a valid application date.");
  }
  const experience = data.experience;
  if (experience !== null && (typeof experience !== "number" || !Number.isInteger(experience) ||
    experience < 0 || experience > 80)) {
    throw new RequestError("Years of experience must be a whole number between 0 and 80.");
  }
  return {
    name, email, position, appliedOn, experience,
    phone: field(data, "phone"), linkedin: link(data, "linkedin"), cv: link(data, "cv"),
    status: option(statuses, data.status, "status"), stage: option(stages, data.stage, "stage"),
  };
}

async function body(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new RequestError("Content-Type must be application/json.", 415);
  }
  let value: unknown;
  try {
    value = await request.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new RequestError("The request body must be valid JSON.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestError("The request body must be a JSON object.");
  }
  return value as Record<string, unknown>;
}

async function dispatch(request: Request, context: Context) {
  try {
    const { parts = [] } = await context.params;
    const [id, resource, noteId] = parts;
    const { method } = request;
    const data = ["POST", "PUT", "PATCH"].includes(method) ? await body(request) : {};
    if (parts.length > 3 || (resource && resource !== "notes")) {
      throw new RequestError("Endpoint not found.", 404);
    }
    const store = readStore();
    const index = store.candidates.findIndex((candidate) => candidate.id === id);
    const candidate = store.candidates[index];
    if (id && !candidate) throw new RequestError("Candidate not found.", 404);

    if (!id && method === "GET") return Response.json(store.candidates);
    if (!id && method === "POST") {
      const created = { ...candidateInput(data), id: randomUUID() };
      store.candidates.unshift(created);
      saveStore(store);
      return Response.json(created, { status: 201 });
    }
    if (candidate && !resource && method === "GET") return Response.json(candidate);
    if (candidate && !resource && (method === "PUT" || method === "PATCH")) {
      let updated;
      if (method === "PUT") {
        updated = { ...candidateInput(data), id };
      } else {
        if (!("status" in data) && !("stage" in data)) throw new RequestError("Supply a status or stage.");
        updated = { ...candidate };
        if ("status" in data) updated.status = option(statuses, data.status, "status");
        if ("stage" in data) updated.stage = option(stages, data.stage, "stage");
      }
      store.candidates[index] = updated;
      saveStore(store);
      return Response.json(updated);
    }
    if (candidate && resource === "notes") {
      const notes = store.notes[id] ?? [];
      if (!noteId && method === "GET") return Response.json(notes);
      if (!noteId && method === "POST") {
        const text = field(data, "text", 2000);
        if (!text) throw new RequestError("Write a note before adding it.");
        const note = { id: randomUUID(), text, createdAt: new Date().toISOString() };
        store.notes[id] = [note, ...notes];
        saveStore(store);
        return Response.json(note, { status: 201 });
      }
      if (noteId && method === "DELETE") {
        if (!notes.some((note) => note.id === noteId)) throw new RequestError("Note not found.", 404);
        store.notes[id] = notes.filter((note) => note.id !== noteId);
        saveStore(store);
        return new Response(null, { status: 204 });
      }
    }
    throw new RequestError("Method not allowed.", 405);
  } catch (error) {
    if (error instanceof RequestError) return Response.json({ error: error.message }, { status: error.status });
    console.error("Candidate records request failed:", error);
    return Response.json({ error: "Could not access candidate records. Please try again." }, { status: 500 });
  }
}

async function handle(request: Request, context: Context) {
  const response = await dispatch(request, context);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };

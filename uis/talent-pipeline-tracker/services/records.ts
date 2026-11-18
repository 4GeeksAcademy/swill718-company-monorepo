import type { Candidate, CandidateInput, Note } from "@/types/candidate";

async function request<T>(path: string, method = "GET", body?: object, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/records${path}`, {
    method,
    signal,
    cache: "no-store",
    ...(body && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const data = response.headers.get("content-type")?.includes("application/json")
      ? await response.json()
      : null;
    throw new Error(data?.error || `The request failed (${response.status}). Please try again.`);
  }
  return response.status === 204 ? undefined as T : await response.json();
}

const record = (id: string) => `/${encodeURIComponent(id)}`;

export const records = {
  list: (signal?: AbortSignal) => request<Candidate[]>("", "GET", undefined, signal),
  get: (id: string, signal?: AbortSignal) => request<Candidate>(record(id), "GET", undefined, signal),
  create: (data: CandidateInput) => request<Candidate>("", "POST", data),
  replace: (id: string, data: CandidateInput) => request<Candidate>(record(id), "PUT", data),
  update: (id: string, data: Partial<Pick<CandidateInput, "status" | "stage">>) =>
    request<Candidate>(record(id), "PATCH", data),
  notes: (id: string, signal?: AbortSignal) => request<Note[]>(`${record(id)}/notes`, "GET", undefined, signal),
  addNote: (id: string, text: string) => request<Note>(`${record(id)}/notes`, "POST", { text }),
  deleteNote: (id: string, noteId: string) =>
    request<void>(`${record(id)}/notes/${encodeURIComponent(noteId)}`, "DELETE"),
};

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Candidate, Note, Stage, Status } from "@/types/candidate";

type Store = { candidates: Candidate[]; notes: Record<string, Note[]> };

const sample: [string, string, Status, Stage, string, number][] = [
  ["Olivia Rhye", "Warehouse Operations Manager", "In progress", "Interview", "2026-11-17", 7],
  ["Phoenix Baker", "Logistics Coordinator", "New", "Applied", "2026-11-16", 3],
  ["Lana Steiner", "Supply Chain Analyst", "In progress", "Screening", "2026-11-15", 5],
  ["Demi Wilkinson", "Dispatch Supervisor", "On hold", "Interview", "2026-11-14", 6],
  ["Candice Wu", "Fleet Operations Specialist", "Hired", "Closed", "2026-11-13", 8],
  ["Natali Craig", "Inventory Control Lead", "In progress", "Offer", "2026-11-12", 4],
  ["Drew Cano", "Last-Mile Delivery Coordinator", "Rejected", "Closed", "2026-11-11", 3],
  ["Orlando Diggs", "Warehouse Associate", "New", "Applied", "2026-11-10", 2],
];

function seed(): Store {
  return {
    candidates: sample.map(([name, position, status, stage, appliedOn, experience], index) => ({
      id: String(index + 1), name, position, status, stage, appliedOn, experience,
      email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
      phone: index === 0 ? "+1 (213) 555-0134" : "",
      linkedin: "", cv: "",
    })),
    notes: {
      "1": [{ id: "sample-note", text: "Phone screen completed. Discussed leading warehouse teams through peak season and improving shift handoffs.", createdAt: "2026-11-17T18:00:00Z" }],
    },
  };
}

function directory() {
  return process.env.TRACKER_DATA_DIR || join(process.cwd(), ".tracker-data");
}

export function readStore(): Store {
  try {
    return JSON.parse(readFileSync(join(directory(), "records.json"), "utf8"));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return seed();
    throw error;
  }
}

export function saveStore(store: Store) {
  const dir = directory();
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = join(dir, "records.json");
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify(store), { mode: 0o600 });
  renameSync(temporary, file);
}


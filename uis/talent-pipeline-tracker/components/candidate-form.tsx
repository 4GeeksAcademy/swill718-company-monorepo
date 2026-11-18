"use client";

import { useState, type FormEvent } from "react";
import { records } from "@/services/records";
import { stages, statuses, type Candidate, type CandidateInput } from "@/types/candidate";
import { Feedback, messageOf } from "./ui";

const fields = [
  { name: "name", label: "Full name", required: true, placeholder: "e.g. Alex Rivera" },
  { name: "email", label: "Email address", required: true, type: "email", placeholder: "alex@example.com" },
  { name: "position", label: "Position", required: true, placeholder: "e.g. Logistics Coordinator" },
  { name: "phone", label: "Phone number", type: "tel", placeholder: "+1 (555) 000-0000" },
  { name: "linkedin", label: "LinkedIn URL", type: "url", placeholder: "https://linkedin.com/in/…" },
  { name: "cv", label: "CV / résumé URL", type: "url", placeholder: "https://…" },
  { name: "experience", label: "Years of experience", type: "number", min: 0, max: 80, step: 1 },
  { name: "appliedOn", label: "Application date", type: "date", required: true },
] as const;

function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function CandidateForm({ candidate, onSaved, onCancel }: {
  candidate?: Candidate;
  onSaved: (candidate: Candidate) => void;
  onCancel: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "").trim();
    const status = statuses.find((item) => item === value("status"));
    const stage = stages.find((item) => item === value("stage"));
    if (!value("name") || !value("email") || !value("position") || !value("appliedOn") || !status || !stage) {
      setError("Enter a name, email, position, application date, status, and stage.");
      return;
    }

    const input: CandidateInput = {
      name: value("name"), email: value("email"), position: value("position"),
      phone: value("phone"), linkedin: value("linkedin"), cv: value("cv"),
      experience: value("experience") ? Number(value("experience")) : null,
      appliedOn: value("appliedOn"), status, stage,
    };
    setPending(true);
    setError("");
    try {
      const saved = candidate ? await records.replace(candidate.id, input) : await records.create(input);
      onSaved(saved);
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="candidate-form" aria-busy={pending}>
    <p className="muted">{candidate ? "Correct the candidate’s application and contact information." : "Register a candidate from a referral, job board, or another channel."} Fields marked * are required.</p>
    <fieldset disabled={pending} className="form-grid">
      {fields.map(({ name, label, ...attrs }) => <label key={name}>
        <span>{label}{"required" in attrs && attrs.required ? " *" : ""}</span>
        <input name={name} defaultValue={candidate?.[name] ?? (name === "appliedOn" ? today() : "")}
          maxLength={name === "cv" || name === "linkedin" ? 2048 : 250} {...attrs} />
      </label>)}
      <label><span>Status</span><select name="status" defaultValue={candidate?.status ?? statuses[0]}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Stage</span><select name="stage" defaultValue={candidate?.stage ?? stages[0]}>{stages.map((item) => <option key={item}>{item}</option>)}</select></label>
    </fieldset>
    <Feedback error={error} />
    <div className="form-actions">
      <button type="button" className="button secondary" onClick={onCancel} disabled={pending}>Cancel</button>
      <button type="submit" className="button primary" disabled={pending}>{pending ? "Saving…" : candidate ? "Save changes" : "Add candidate"}</button>
    </div>
  </form>;
}

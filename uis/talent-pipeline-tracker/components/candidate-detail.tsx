"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect, useState, type FormEvent } from "react";
import { parseProfileUrl } from "@/services/profile-url";
import { records } from "@/services/records";
import { stages, statuses, type Candidate, type CandidateInput, type Note, type Stage, type Status } from "@/types/candidate";
import { CandidateForm } from "./candidate-form";
import { Avatar, Feedback, Icon, Panel, Select, StatusBadge, formatDate, messageOf } from "./ui";
import { WorkspaceContext } from "./workspace";

function useResource<T>(id: string, fetchData: (id: string, signal: AbortSignal) => Promise<T>) {
  const [result, setResult] = useState<{ data: T } | { error: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await fetchData(id, controller.signal);
        if (!controller.signal.aborted) setResult({ data });
      } catch (failure) {
        if (!controller.signal.aborted) setResult({ error: messageOf(failure) });
      }
    }
    void load();
    return () => controller.abort();
  }, [id, attempt, fetchData]);

  function retry() {
    setResult(null);
    setAttempt((value) => value + 1);
  }
  return { result, retry, setResult };
}

function ResourceError({ error, retry }: { error: string; retry: () => void }) {
  return <div><Feedback error={error} /><button className="button secondary" onClick={retry}>Try again</button></div>;
}

function Notes({ id }: { id: string }) {
  const { result, retry, setResult } = useResource(id, records.notes);
  const [text, setText] = useState("");
  const [pending, setPending] = useState<"add" | string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || pending) return;
    setPending("add");
    setError("");
    setSuccess("");
    try {
      const note = await records.addNote(id, text.trim());
      setResult((current) => current && "data" in current ? { data: [note, ...current.data] } : current);
      setText("");
      setSuccess("Note added.");
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setPending(null);
    }
  }

  async function deleteNote(note: Note) {
    setPending(note.id);
    setError("");
    setSuccess("");
    try {
      await records.deleteNote(id, note.id);
      setResult((current) => current && "data" in current
        ? { data: current.data.filter((item) => item.id !== note.id) } : current);
      setConfirm(null);
      setSuccess("Note deleted.");
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setPending(null);
    }
  }

  return <section className="detail-section" aria-labelledby="notes-title">
    <h3 id="notes-title"><Icon name="notes" size={18} /> Interview &amp; call notes</h3>
    {!result ? <p className="muted" role="status">Loading notes…</p>
      : "error" in result ? <ResourceError error={result.error} retry={retry} />
      : <>
        <form className="notes-form" onSubmit={addNote} aria-busy={pending === "add"}>
          <label htmlFor="candidate-note" className="sr-only">New note</label>
          <textarea id="candidate-note" value={text} onChange={(event) => setText(event.target.value)} maxLength={2000}
            placeholder="Capture a takeaway from a call or interview…" rows={3} disabled={pending === "add"} />
          <button className="button primary" disabled={!text.trim() || pending !== null}>
            <Icon name="plus" size={16} />{pending === "add" ? "Adding…" : "Add note"}
          </button>
        </form>
        <Feedback error={error} success={success} />
        {result.data.length === 0 ? <p className="muted notes-empty">No notes yet.</p>
          : <ul className="notes-list">{result.data.map((note) => <li key={note.id}>
            <div className="note-header">
              <time dateTime={note.createdAt}>{formatDate(note.createdAt)}</time>
              <button type="button" className="icon-button" disabled={pending !== null || confirm === note.id}
                aria-label={`Delete note from ${formatDate(note.createdAt)}: ${note.text.slice(0, 40)}`}
                onClick={() => setConfirm(note.id)}><Icon name="trash" size={16} /></button>
            </div>
            <p>{note.text}</p>
            {confirm === note.id && <div className="delete-confirm">
              <span>Delete this note?</span>
              <button type="button" className="text-button" disabled={pending !== null} onClick={() => setConfirm(null)}>Cancel</button>
              <button type="button" className="text-button danger" disabled={pending !== null} onClick={() => void deleteNote(note)}>
                {pending === note.id ? "Deleting…" : "Delete note"}
              </button>
            </div>}
          </li>)}</ul>}
      </>}
  </section>;
}

function ProfileLink({ value, label }: { value: string; label: string }) {
  const url = parseProfileUrl(value);
  return url
    ? <a href={url.href} target="_blank" rel="noreferrer">{label} <Icon name="external" size={14} /></a>
    : <span className="muted">Not provided</span>;
}

export function CandidateDetail({ id }: { id: string }) {
  const workspace = useContext(WorkspaceContext);
  const router = useRouter();
  const { result, retry, setResult } = useResource(id, records.get);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function saved(candidate: Candidate, notice: string) {
    setResult({ data: candidate });
    workspace?.syncCandidate(candidate);
    setSuccess(notice);
  }

  async function update(change: Partial<Pick<CandidateInput, "status" | "stage">>) {
    setPending(true);
    setError("");
    setSuccess("");
    try {
      saved(await records.update(id, change), change.status ? "Status updated." : "Stage updated.");
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setPending(false);
    }
  }

  const candidate = result && "data" in result ? result.data : null;
  return <Panel title={editing ? "Edit candidate" : "Candidate details"} onClose={() => {
    if (editing) setEditing(false);
    else router.replace(workspace?.listHref ?? "/", { scroll: false });
  }}>
    {!result ? <p role="status">Loading candidate…</p> : "error" in result
      ? <ResourceError error={result.error} retry={retry} /> : candidate && <>
        {editing ? <CandidateForm candidate={candidate} onCancel={() => setEditing(false)} onSaved={(updated) => {
          saved(updated, "Candidate details saved.");
          setEditing(false);
        }} /> : <div className="profile">
          <div className="profile-heading">
            <Avatar name={candidate.name} />
            <div><h3>{candidate.name}</h3><p>{candidate.position}</p></div>
          </div>
          <div className="profile-actions">
            <StatusBadge status={candidate.status} />
            <button type="button" className="button secondary" disabled={pending} onClick={() => {
              setEditing(true);
              setSuccess("");
              setError("");
            }}><Icon name="edit" size={16} /> Edit details</button>
          </div>
          <section className="detail-section">
            <h3>Hiring progress</h3>
            <div className="form-grid progress-grid" aria-busy={pending}>
              <div><span className="field-caption">Status</span><Select label="Candidate status" value={candidate.status} options={statuses}
                disabled={pending} onChange={(status) => void update({ status: status as Status })} /></div>
              <div><span className="field-caption">Stage</span><Select label="Candidate stage" value={candidate.stage} options={stages}
                disabled={pending} onChange={(stage) => void update({ stage: stage as Stage })} /></div>
            </div>
            {pending && <p className="muted" role="status">Saving changes…</p>}
            <Feedback error={error} success={success} />
          </section>
          <section className="detail-section">
            <h3>Application details</h3>
            <dl className="detail-fields">
              <div><dt>Email address</dt><dd><a href={`mailto:${candidate.email}`}>{candidate.email}</a></dd></div>
              <div><dt>Phone number</dt><dd>{candidate.phone || <span className="muted">Not provided</span>}</dd></div>
              <div><dt>Years of experience</dt><dd>{candidate.experience ?? <span className="muted">Not provided</span>}</dd></div>
              <div><dt>Application date</dt><dd><time dateTime={candidate.appliedOn}>{formatDate(candidate.appliedOn)}</time></dd></div>
              <div><dt>LinkedIn</dt><dd><ProfileLink value={candidate.linkedin} label="Open profile" /></dd></div>
              <div><dt>CV / résumé</dt><dd><ProfileLink value={candidate.cv} label="Open résumé" /></dd></div>
            </dl>
          </section>
        </div>}
        <div hidden={editing}><Notes id={id} /></div>
      </>}
  </Panel>;
}

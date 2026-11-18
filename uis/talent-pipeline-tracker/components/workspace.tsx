"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createContext, useEffect, useState, type ReactNode } from "react";
import { records } from "@/services/records";
import { stages, statuses, type Candidate } from "@/types/candidate";
import { CandidateForm } from "./candidate-form";
import { Avatar, Feedback, Icon, Panel, Select, StatusBadge, formatDate, messageOf } from "./ui";

export const WorkspaceContext = createContext<{
  listHref: string; syncCandidate: (candidate: Candidate) => void;
} | null>(null);

const cards = [
  { label: "Total candidates", status: "", icon: "users", tone: "mint", caption: "Across all stages" },
  { label: "New applications", status: "New", icon: "inbox", tone: "blue", caption: "Ready for review" },
  { label: "In progress", status: "In progress", icon: "clock", tone: "lilac", caption: "Moving through the pipeline" },
  { label: "Hired", status: "Hired", icon: "check", tone: "mint", caption: "Successfully placed" },
] as const;

export function Workspace({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const status = statuses.find((item) => item === params.get("status")) ?? "";
  const stage = stages.find((item) => item === params.get("stage")) ?? "";
  const search = params.get("q") ?? "";
  const suffix = params.size ? `?${params}` : "";
  const listHref = `/${suffix}`;
  const [result, setResult] = useState<{ candidates: Candidate[] } | { error: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const candidates = await records.list(controller.signal);
        if (!controller.signal.aborted) setResult({ candidates });
      } catch (failure) {
        if (!controller.signal.aborted) setResult({ error: messageOf(failure) });
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  function syncCandidate(candidate: Candidate) {
    if (!result || !("candidates" in result)) {
      setResult(null);
      setAttempt((value) => value + 1);
      return;
    }
    setResult((current) => {
      if (!current || !("candidates" in current)) return current;
      const found = current.candidates.some((item) => item.id === candidate.id);
      return { candidates: found
        ? current.candidates.map((item) => item.id === candidate.id ? candidate : item)
        : [candidate, ...current.candidates] };
    });
  }

  function filter(values: Partial<Record<"status" | "stage" | "q", string>>) {
    const next = new URLSearchParams(window.location.search);
    Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    window.history.replaceState(null, "", window.location.pathname + (next.size ? `?${next}` : ""));
  }

  const clear = () => filter({ status: "", stage: "", q: "" });
  const candidates = result && "candidates" in result ? result.candidates : null;
  const query = search.trim().toLowerCase();
  const visible = candidates?.filter((item) => (!status || item.status === status) &&
    (!stage || item.stage === stage) && (!query || [item.name, item.email].some((value) => value.toLowerCase().includes(query)))) ?? [];

  return <WorkspaceContext.Provider value={{ listHref, syncCandidate }}>
    <header className="topbar">
      <div className="topbar-inner">
        <Link href={listHref} className="brand" scroll={false}><span className="brand-mark"><Icon name="logo" size={24} /></span>TrackFlow</Link>
        <span className="topbar-divider" />
        <span className="workspace-label">People Operations</span>
        <span className="internal-label"><span />Demo workspace</span>
      </div>
    </header>
    <main className="workspace">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><Icon name="pipeline" size={16} /> RECRUITING WORKSPACE</div>
          <h1>Talent Pipeline</h1>
          <p>Track applications and move candidates through every stage of hiring.</p>
        </div>
        <button className="button primary add-candidate" onClick={() => { setSuccess(""); setAdding(true); }}><Icon name="plus" size={19} />Add candidate</button>
      </div>
      <section className="metrics" aria-label="Pipeline overview">
        {cards.map(({ label, status: cardStatus, icon, tone, caption }) => <button key={label} type="button"
          className="metric" aria-pressed={status === cardStatus} onClick={() => filter({ status: cardStatus })}>
          <span className={`metric-icon ${tone}`}><Icon name={icon} /></span>
          <span className="metric-label">{label}</span>
          <strong>{candidates ? (cardStatus ? candidates.filter((item) => item.status === cardStatus).length : candidates.length) : "—"}</strong>
          <span className="metric-caption">{caption}</span>
        </button>)}
      </section>
      <Feedback success={success} />
      <section className="directory" aria-labelledby="directory-title">
        <div className="directory-heading">
          <div>
            <h2 id="directory-title">Candidates {candidates && <span className="count">{visible.length}</span>}</h2>
            <p>View and manage everyone in your talent pipeline.</p>
          </div>
          <div className="filters">
            <label className="search"><Icon name="search" size={17} /><input type="search" aria-label="Search candidates by name or email" placeholder="Search name or email…" value={search} onChange={(event) => filter({ q: event.target.value })} /></label>
            <Select label="Filter by status" value={status || "All statuses"} options={["All statuses", ...statuses]} onChange={(value) => filter({ status: value === "All statuses" ? "" : value })} />
            <Select label="Filter by stage" value={stage || "All stages"} options={["All stages", ...stages]} onChange={(value) => filter({ stage: value === "All stages" ? "" : value })} />
          </div>
        </div>
        {!result ? <div className="empty" role="status">Loading candidates…</div>
          : "error" in result ? <div className="empty">
            <Feedback error={result.error} /><button className="button secondary" onClick={() => { setResult(null); setAttempt((value) => value + 1); }}>Try again</button>
          </div>
          : !visible.length ? <div className="empty">
            <span className="metric-icon mint"><Icon name={result.candidates.length ? "search" : "users"} /></span>
            <h3>{result.candidates.length ? "No matching candidates" : "No candidates yet"}</h3>
            <p>{result.candidates.length ? "Try a different search or clear your filters." : "Add your first candidate to get started."}</p>
            {result.candidates.length > 0 && <button className="button secondary" onClick={clear}>Clear filters</button>}
          </div>
          : <>
            <table>
              <thead><tr>{["Candidate", "Position", "Status", "Stage", "Applied"].map((label) => <th scope="col" key={label}>{label}</th>)}<th scope="col"><span className="sr-only">Details</span></th></tr></thead>
              <tbody>{visible.map((candidate) => {
                const href = `/candidates/${encodeURIComponent(candidate.id)}${suffix}`;
                return <tr key={candidate.id}>
                  <td><Link className="candidate-link" href={href} scroll={false} prefetch={false}>
                    <Avatar name={candidate.name} /><span><strong>{candidate.name}</strong><small>{candidate.email}</small></span>
                  </Link></td>
                  <td className="position-cell">{candidate.position}</td>
                  <td><StatusBadge status={candidate.status} /></td>
                  <td><span className="stage">{candidate.stage}</span></td>
                  <td className="applied-cell">{formatDate(candidate.appliedOn)}</td>
                  <td><Link className="row-arrow" href={href} scroll={false} prefetch={false} aria-label={`View ${candidate.name}`}><Icon name="right" size={17} /></Link></td>
                </tr>;
              })}</tbody>
            </table>
            <div className="directory-footer" role="status">Showing {visible.length} of {result.candidates.length} candidates
              {(status || stage || search) && <button className="text-button" onClick={clear}>Clear filters</button>}
            </div>
          </>}
      </section>
    </main>
    {children}
    {adding && <Panel title="Add candidate" onClose={() => setAdding(false)}>
      <CandidateForm onCancel={() => setAdding(false)} onSaved={(candidate) => {
        syncCandidate(candidate);
        setSuccess(`${candidate.name} was added to the pipeline.`);
        setAdding(false);
      }} />
    </Panel>}
  </WorkspaceContext.Provider>;
}

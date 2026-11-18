"use client";

import { useEffect, useRef, type ReactNode } from "react";

const paths = {
  logo: "M3 6h12l-4 5H3z M9 13h12l-4 5H9z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M22 21v-2a4 4 0 0 0-3-3.87 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 3.13a4 4 0 0 1 0 7.75",
  plus: "M12 5v14M5 12h14",
  search: "M21 21l-4.3-4.3 M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  chevron: "m6 9 6 6 6-6",
  right: "m9 18 6-6-6-6",
  pipeline: "M5 4v16 M5 7h6a4 4 0 0 1 4 4v2 M5 17h12 M15 13l-2-2m2 2 2-2 M17 17l-2-2m2 2-2 2",
  clock: "M12 6v6l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  check: "m8 12 3 3 5-6 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  inbox: "M4 4h16l2 10v5H2v-5z M2 14h6l2 2h4l2-2h6",
  close: "m6 6 12 12M18 6 6 18",
  edit: "m4 16-1 5 5-1L21 7l-4-4z M14 6l4 4",
  notes: "M14 2H5v20h14V7z M14 2v5h5 M8 12h8 M8 16h6",
  trash: "M3 6h18 M8 6V3h8v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
  external: "M13 5h6v6 M19 5l-8 8 M10 5H5v14h14v-5",
};

export function Icon({ name, size = 20 }: { name: keyof typeof paths; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill={name === "logo" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}

export function Avatar({ name }: { name: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase();
  const tone = Array.from(name).reduce((sum, char) => sum + (char.codePointAt(0) ?? 0), 0) % 6;
  return <span aria-hidden="true" className={`avatar avatar-${tone}`}>{initials}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status status-${status.toLowerCase().replaceAll(" ", "-")}`}><span />{status}</span>;
}

export function Select({ label, value, options, onChange, disabled }: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return <span className="select-wrap">
    <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
      {options.map((item) => <option key={item}>{item}</option>)}
    </select>
    <Icon name="chevron" size={15} />
  </span>;
}

export function Panel({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return <dialog ref={ref} className="panel" aria-label={title} onCancel={(event) => {
    event.preventDefault();
    onClose();
  }}>
    <div className="panel-header">
      <h2>{title}</h2>
      <button className="icon-button" type="button" aria-label={`Close ${title.toLowerCase()}`} onClick={onClose}><Icon name="close" /></button>
    </div>
    <div className="panel-content">{children}</div>
  </dialog>;
}

export function Feedback({ error, success }: { error?: string; success?: string }) {
  if (error) return <p className="feedback error" role="alert">{error}</p>;
  if (success) return <p className="feedback success" role="status">{success}</p>;
  return null;
}

export function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

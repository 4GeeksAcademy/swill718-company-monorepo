export const statuses = ["New", "In progress", "On hold", "Hired", "Rejected"] as const;
export const stages = ["Applied", "Screening", "Interview", "Offer", "Closed"] as const;

export type Status = (typeof statuses)[number];
export type Stage = (typeof stages)[number];

export interface CandidateInput {
  name: string;
  email: string;
  position: string;
  phone: string;
  linkedin: string;
  cv: string;
  experience: number | null;
  appliedOn: string;
  status: Status;
  stage: Stage;
}

export interface Candidate extends CandidateInput {
  id: string;
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
}

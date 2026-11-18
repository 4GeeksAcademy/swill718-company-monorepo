import { CandidateDetail } from "@/components/candidate-detail";

export default async function CandidatePage({ params }: PageProps<"/candidates/[id]">) {
  const { id } = await params;
  return <CandidateDetail key={id} id={id} />;
}

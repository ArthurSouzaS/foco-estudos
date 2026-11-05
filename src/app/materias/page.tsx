import type { Metadata } from "next";
import { SubjectsView } from "@/components/subjects/SubjectsView";

export const metadata: Metadata = { title: "Matérias" };

export default function SubjectsPage() {
  return <SubjectsView />;
}

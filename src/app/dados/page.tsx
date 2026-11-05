import type { Metadata } from "next";
import { DataView } from "@/components/data/DataView";

export const metadata: Metadata = { title: "Dados" };

export default function DataPage() {
  return <DataView />;
}

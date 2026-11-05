import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <EmptyState
      icon="🧭"
      title="Página não encontrada"
      description="O endereço que você tentou acessar não existe."
      action={<Link href="/">Voltar para o dashboard</Link>}
    />
  );
}

"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { DownloadIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { Button, Card, ConfirmDialog, PageHeader } from "@/components/ui";
import { useStudyData } from "@/context/StudyDataContext";
import { formatDuration, toDateKey } from "@/lib/date";
import { downloadTextFile } from "@/lib/download";
import type { AppData } from "@/lib/types";
import { parseBackup, serializeBackup } from "@/lib/validation";
import styles from "./DataView.module.scss";

type Feedback = { tone: "success" | "error"; text: string };

function summary(data: AppData) {
  const seconds = data.sessions.reduce((sum, s) => sum + s.durationSec, 0);
  return `${data.subjects.length} matérias, ${data.tasks.length} tarefas e ${formatDuration(seconds)} de estudo`;
}

export function DataView() {
  const { data, hydrated, replaceData, resetData } = useStudyData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<AppData | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>();

  function handleExport() {
    downloadTextFile(`foco-estudos-backup-${toDateKey(new Date())}.json`, serializeBackup(data));
    setFeedback({ tone: "success", text: "Backup exportado! Guarde o arquivo em um lugar seguro." });
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ tone: "error", text: "Arquivo muito grande (máximo de 5 MB)." });
      return;
    }
    const result = parseBackup(await file.text());
    if (!result.ok) {
      setFeedback({ tone: "error", text: `Não foi possível importar: ${result.error}` });
      return;
    }
    setFeedback(undefined);
    setPending(result.data);
  }

  return (
    <>
      <PageHeader
        title="Dados"
        description="Seus dados ficam salvos apenas neste navegador. Faça backups para não perder nada ou para levar para outro computador."
      />

      <div className={styles.grid}>
        <Card title="Exportar backup">
          <p className={styles.text}>
            Baixe um arquivo <code>.json</code> com {hydrated ? summary(data) : "seus dados"}.
          </p>
          <Button variant="primary" onClick={handleExport} disabled={!hydrated}>
            <DownloadIcon size={18} /> Exportar JSON
          </Button>
        </Card>

        <Card title="Importar backup">
          <p className={styles.text}>
            Restaure um arquivo exportado pelo Foco Estudos. <strong>Os dados atuais serão substituídos.</strong>
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            onChange={(e) => void handleFile(e)}
            aria-label="Selecionar arquivo de backup"
            tabIndex={-1}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={!hydrated}>
            <UploadIcon size={18} /> Importar JSON
          </Button>
        </Card>

        <Card title="Apagar tudo" className={styles.danger}>
          <p className={styles.text}>Remove todas as matérias, tarefas, sessões e configurações deste navegador.</p>
          <Button variant="danger" onClick={() => setConfirmReset(true)} disabled={!hydrated}>
            <TrashIcon size={18} /> Apagar dados
          </Button>
        </Card>
      </div>

      <div aria-live="polite" className={styles.feedbackArea}>
        {feedback && (
          <p className={styles.feedback} data-tone={feedback.tone} role={feedback.tone === "error" ? "alert" : undefined}>
            {feedback.text}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={pending !== null}
        title="Importar backup?"
        confirmLabel="Substituir dados"
        message={
          pending && (
            <>
              O arquivo contém <strong>{summary(pending)}</strong>. Os dados atuais ({summary(data)}) serão substituídos.
            </>
          )
        }
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) replaceData(pending);
          setPending(null);
          setFeedback({ tone: "success", text: "Dados importados com sucesso!" });
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Apagar todos os dados?"
        confirmLabel="Apagar tudo"
        message="Essa ação não pode ser desfeita. Considere exportar um backup antes."
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetData();
          setConfirmReset(false);
          setFeedback({ tone: "success", text: "Todos os dados foram apagados." });
        }}
      />
    </>
  );
}

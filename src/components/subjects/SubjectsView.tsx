"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { EditIcon, TrashIcon } from "@/components/icons";
import { Button, Card, ConfirmDialog, EmptyState, Loading, Modal, PageHeader } from "@/components/ui";
import { useStudyData } from "@/context/StudyDataContext";
import { formatDuration } from "@/lib/date";
import { totalsBySubject } from "@/lib/stats";
import type { Subject } from "@/lib/types";
import { SubjectForm } from "./SubjectForm";
import styles from "./SubjectsView.module.scss";

export function SubjectsView() {
  const { data, hydrated, addSubject, updateSubject, deleteSubject } = useStudyData();
  const [editing, setEditing] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState<Subject | null>(null);

  const stats = useMemo(() => {
    const time = new Map(totalsBySubject(data.sessions, data.subjects).map((t) => [t.subjectId, t.seconds]));
    return new Map(
      data.subjects.map((s) => {
        const tasks = data.tasks.filter((t) => t.subjectId === s.id);
        return [
          s.id,
          {
            seconds: time.get(s.id) ?? 0,
            pending: tasks.filter((t) => t.status !== "feito").length,
            total: tasks.length,
          },
        ];
      }),
    );
  }, [data]);

  const namesExcept = (id?: string) =>
    data.subjects.filter((s) => s.id !== id).map((s) => s.name.toLowerCase());

  const deletingTasks = deleting ? (stats.get(deleting.id)?.total ?? 0) : 0;

  return (
    <>
      <PageHeader title="Matérias" description="Cadastre as matérias que você está estudando e escolha uma cor para cada uma." />

      <div className={styles.layout}>
        <Card title="Nova matéria" className={styles.formCard}>
          <SubjectForm existingNames={namesExcept()} onSubmit={addSubject} />
        </Card>

        <section aria-labelledby="lista-materias">
          <h2 id="lista-materias" className={styles.listTitle}>
            Suas matérias <span className={styles.count}>{hydrated ? data.subjects.length : ""}</span>
          </h2>

          {!hydrated ? (
            <Loading />
          ) : data.subjects.length === 0 ? (
            <EmptyState
              icon="📚"
              title="Nenhuma matéria ainda"
              description="Crie sua primeira matéria no formulário ao lado para começar a organizar tarefas e sessões de estudo."
            />
          ) : (
            <ul className={styles.list}>
              {data.subjects.map((subject) => {
                const info = stats.get(subject.id);
                return (
                  <li key={subject.id} className={styles.item} style={{ "--subject": subject.color } as CSSProperties}>
                    <span className={styles.color} aria-hidden="true" />
                    <div className={styles.info}>
                      <h3 className={styles.name}>{subject.name}</h3>
                      <p className={styles.meta}>
                        <span className="mono">{formatDuration(info?.seconds ?? 0)}</span> estudados ·{" "}
                        {info?.pending ?? 0} {info?.pending === 1 ? "tarefa pendente" : "tarefas pendentes"}
                      </p>
                    </div>
                    <div className={styles.actions}>
                      <Button variant="ghost" size="sm" iconOnly aria-label={`Editar ${subject.name}`} onClick={() => setEditing(subject)}>
                        <EditIcon size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" iconOnly aria-label={`Excluir ${subject.name}`} onClick={() => setDeleting(subject)}>
                        <TrashIcon size={16} />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <Modal open={editing !== null} title="Editar matéria" onClose={() => setEditing(null)}>
        {editing && (
          <SubjectForm
            key={editing.id}
            initial={{ name: editing.name, color: editing.color }}
            submitLabel="Salvar alterações"
            existingNames={namesExcept(editing.id)}
            onCancel={() => setEditing(null)}
            onSubmit={(input) => {
              updateSubject(editing.id, input);
              setEditing(null);
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir matéria?"
        message={
          <>
            A matéria <strong>{deleting?.name}</strong>
            {deletingTasks > 0
              ? deletingTasks === 1
                ? " e a sua tarefa serão excluídas"
                : ` e as suas ${deletingTasks} tarefas serão excluídas`
              : " será excluída"}
            . O tempo já estudado continua no histórico como “Sem matéria”.
          </>
        }
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteSubject(deleting.id);
          setDeleting(null);
        }}
      />
    </>
  );
}

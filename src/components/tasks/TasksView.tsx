"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, ConfirmDialog, EmptyState, Loading, Modal, PageHeader } from "@/components/ui";
import { useStudyData } from "@/context/StudyDataContext";
import { TASK_STATUSES } from "@/lib/constants";
import { DEFAULT_FILTERS, filterTasks, sortTasks, type TaskFilters as Filters } from "@/lib/tasks";
import type { Task, TaskStatus } from "@/lib/types";
import { TaskFilters } from "./TaskFilters";
import { TaskForm } from "./TaskForm";
import { TaskItem } from "./TaskItem";
import styles from "./TasksView.module.scss";

export function TasksView() {
  const { data, hydrated, addTask, updateTask, setTaskStatus, deleteTask } = useStudyData();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);

  const subjectsById = useMemo(() => new Map(data.subjects.map((s) => [s.id, s])), [data.subjects]);

  // Contagem por status respeita os demais filtros (matéria, prioridade e busca).
  const counts = useMemo(() => {
    const base = filterTasks(data.tasks, { ...filters, status: "todos" });
    const result = { todos: base.length } as Record<TaskStatus | "todos", number>;
    for (const s of TASK_STATUSES) result[s] = base.filter((t) => t.status === s).length;
    return result;
  }, [data.tasks, filters]);

  const visible = useMemo(() => sortTasks(filterTasks(data.tasks, filters)), [data.tasks, filters]);

  if (!hydrated) {
    return (
      <>
        <PageHeader title="Tarefas" />
        <Loading />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Tarefas" description="Organize o que precisa ser feito em cada matéria, com prazo e prioridade." />

      {data.subjects.length === 0 ? (
        <EmptyState
          icon="📝"
          title="Cadastre uma matéria primeiro"
          description="As tarefas são organizadas por matéria."
          action={<Link href="/materias/">Ir para Matérias</Link>}
        />
      ) : (
        <div className={styles.stack}>
          <Card title="Nova tarefa">
            <TaskForm
              subjects={data.subjects}
              defaultSubjectId={filters.subjectId !== "todas" ? filters.subjectId : undefined}
              onSubmit={addTask}
            />
          </Card>

          <section aria-labelledby="lista-tarefas">
            <h2 id="lista-tarefas" className="visually-hidden">
              Lista de tarefas
            </h2>
            <TaskFilters subjects={data.subjects} filters={filters} counts={counts} onChange={setFilters} />

            <p className="visually-hidden" aria-live="polite">
              {visible.length} {visible.length === 1 ? "tarefa encontrada" : "tarefas encontradas"}
            </p>

            {visible.length === 0 ? (
              <EmptyState
                icon={data.tasks.length === 0 ? "✨" : "🔍"}
                title={data.tasks.length === 0 ? "Nenhuma tarefa cadastrada" : "Nenhuma tarefa com esses filtros"}
                description={
                  data.tasks.length === 0
                    ? "Adicione sua primeira tarefa no formulário acima."
                    : "Tente mudar ou limpar os filtros."
                }
              />
            ) : (
              <ul className={styles.list}>
                {visible.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    subject={subjectsById.get(task.subjectId)}
                    onStatusChange={(status) => setTaskStatus(task.id, status)}
                    onEdit={() => setEditing(task)}
                    onDelete={() => setDeleting(task)}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <Modal open={editing !== null} title="Editar tarefa" onClose={() => setEditing(null)}>
        {editing && (
          <TaskForm
            key={editing.id}
            subjects={data.subjects}
            initial={editing}
            showStatus
            submitLabel="Salvar alterações"
            onCancel={() => setEditing(null)}
            onSubmit={(input) => {
              updateTask(editing.id, input);
              setEditing(null);
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir tarefa?"
        message={
          <>
            A tarefa <strong>{deleting?.title}</strong> será excluída permanentemente.
          </>
        }
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteTask(deleting.id);
          setDeleting(null);
        }}
      />
    </>
  );
}

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { StudyDataProvider } from "@/context/StudyDataContext";
import { STORAGE_KEY } from "@/lib/constants";
import { appData, subject } from "@/test/factories";
import { TasksView } from "./TasksView";

function setup() {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(appData({ subjects: [subject(), subject({ id: "mat-2", name: "Redes", color: "#38bdf8" })] })),
  );
  render(
    <StudyDataProvider>
      <TasksView />
    </StudyDataProvider>,
  );
  return userEvent.setup();
}

const taskList = () => screen.getByRole("list", { name: "" });

describe("TasksView (CRUD e filtros de tarefas)", () => {
  it("pede uma matéria antes de criar tarefas", async () => {
    render(
      <StudyDataProvider>
        <TasksView />
      </StudyDataProvider>,
    );
    expect(await screen.findByText("Cadastre uma matéria primeiro")).toBeInTheDocument();
  });

  it("cria tarefas, muda status, filtra e exclui", async () => {
    const user = setup();
    const form = (await screen.findByRole("heading", { name: "Nova tarefa" })).closest("section")!;

    await user.type(within(form).getByLabelText("Tarefa"), "Modelar diagrama ER");
    await user.selectOptions(within(form).getByLabelText("Prioridade"), "alta");
    await user.click(within(form).getByRole("button", { name: "Adicionar tarefa" }));

    await user.type(within(form).getByLabelText("Tarefa"), "Configurar roteador");
    await user.selectOptions(within(form).getByLabelText("Matéria"), "mat-2");
    await user.click(within(form).getByRole("button", { name: "Adicionar tarefa" }));

    expect(within(taskList()).getAllByRole("listitem")).toHaveLength(2);

    // Concluir pela caixa de seleção
    await user.click(screen.getByRole("checkbox", { name: 'Concluir "Configurar roteador"' }));
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    expect(saved.tasks.find((t: { title: string }) => t.title === "Configurar roteador").status).toBe("feito");

    // Filtro por status
    await user.click(screen.getByRole("button", { name: /^Feito/ }));
    expect(within(taskList()).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Configurar roteador")).toBeInTheDocument();

    // Filtro por busca sem resultado
    await user.click(screen.getByRole("button", { name: /^Todas/ }));
    await user.type(screen.getByLabelText("Buscar"), "diagrama");
    expect(within(taskList()).getAllByRole("listitem")).toHaveLength(1);
    await user.selectOptions(screen.getAllByLabelText("Matéria")[1]!, "mat-2");
    expect(screen.getByText("Nenhuma tarefa com esses filtros")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));

    // Excluir
    await user.click(screen.getByRole("button", { name: 'Excluir "Modelar diagrama ER"' }));
    await user.click(within(screen.getByRole("dialog", { name: "Excluir tarefa?" })).getByRole("button", { name: "Excluir" }));
    expect(within(taskList()).getAllByRole("listitem")).toHaveLength(1);
  });
});

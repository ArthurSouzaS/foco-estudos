import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { StudyDataProvider } from "@/context/StudyDataContext";
import { STORAGE_KEY } from "@/lib/constants";
import { SubjectsView } from "./SubjectsView";

const renderView = () =>
  render(
    <StudyDataProvider>
      <SubjectsView />
    </StudyDataProvider>,
  );

const stored = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");

describe("SubjectsView (CRUD de matérias)", () => {
  it("cria, edita e exclui uma matéria salvando no localStorage", async () => {
    const user = userEvent.setup();
    renderView();

    expect(await screen.findByText("Nenhuma matéria ainda")).toBeInTheDocument();

    // Criar
    await user.type(screen.getByLabelText("Nome da matéria"), "Programação Web");
    await user.click(screen.getByLabelText("Roxo"));
    await user.click(screen.getByRole("button", { name: "Adicionar matéria" }));
    expect(screen.getByRole("heading", { name: "Programação Web" })).toBeInTheDocument();
    expect(stored().subjects).toMatchObject([{ name: "Programação Web", color: "#a78bfa" }]);

    // Duplicada
    await user.type(screen.getByLabelText("Nome da matéria"), "programação web");
    await user.click(screen.getByRole("button", { name: "Adicionar matéria" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Já existe uma matéria com esse nome.");
    await user.clear(screen.getByLabelText("Nome da matéria"));

    // Editar
    await user.click(screen.getByRole("button", { name: "Editar Programação Web" }));
    const dialog = screen.getByRole("dialog", { name: "Editar matéria" });
    const input = within(dialog).getByLabelText("Nome da matéria");
    await user.clear(input);
    await user.type(input, "Front-end");
    await user.click(within(dialog).getByRole("button", { name: "Salvar alterações" }));
    expect(screen.getByRole("heading", { name: "Front-end" })).toBeInTheDocument();
    expect(stored().subjects[0].name).toBe("Front-end");

    // Excluir
    await user.click(screen.getByRole("button", { name: "Excluir Front-end" }));
    const confirm = screen.getByRole("dialog", { name: "Excluir matéria?" });
    await user.click(within(confirm).getByRole("button", { name: "Excluir" }));
    expect(screen.getByText("Nenhuma matéria ainda")).toBeInTheDocument();
    expect(stored().subjects).toEqual([]);
  });

  it("valida nome vazio", async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(await screen.findByRole("button", { name: "Adicionar matéria" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Informe o nome da matéria.");
  });
});

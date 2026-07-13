import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TodoList } from "./todo-list";

const pendingTodo = {
  id: "1",
  title: "Write tests",
  description: "Cover the todo list",
  emoji: "✅",
  status: "pending" as const,
};

const completedTodo = {
  id: "2",
  title: "Ship feature",
  description: "Already done",
  emoji: "🚀",
  status: "completed" as const,
};

describe("TodoList", () => {
  it("shows an empty state and adds a todo on click", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();

    render(<TodoList todos={[]} onUpdate={onUpdate} isAgentRunning={false} />);

    expect(screen.getByText("No todos yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add a task" }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0][0]).toHaveLength(1);
  });

  it("splits todos into To Do and Done columns", () => {
    render(
      <TodoList
        todos={[pendingTodo, completedTodo]}
        onUpdate={vi.fn()}
        isAgentRunning={false}
      />,
    );

    expect(screen.getByRole("region", { name: "To Do column" })).toHaveTextContent(
      "Write tests",
    );
    expect(screen.getByRole("region", { name: "Done column" })).toHaveTextContent(
      "Ship feature",
    );
  });

  it("toggles a todo's status when its checkbox is clicked", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();

    render(
      <TodoList todos={[pendingTodo]} onUpdate={onUpdate} isAgentRunning={false} />,
    );

    await user.click(screen.getByRole("checkbox"));

    expect(onUpdate).toHaveBeenCalledWith([{ ...pendingTodo, status: "completed" }]);
  });

  it("deletes a todo when its delete button is clicked", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();

    render(
      <TodoList
        todos={[pendingTodo, completedTodo]}
        onUpdate={onUpdate}
        isAgentRunning={false}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "Delete todo" })[0]);

    expect(onUpdate).toHaveBeenCalledWith([completedTodo]);
  });
});

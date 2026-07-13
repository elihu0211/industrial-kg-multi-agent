using IndustrialKgAgent.Domain.Todos;

namespace IndustrialKgAgent.Application.Tools;

public sealed class TodosTool(ITodoStore store)
{
    [Description("Manage the current todos.")]
    public string ManageTodos([Description("The complete source of truth for the user's todos.")] List<Todo> todos)
    {
        foreach (var todo in todos)
        {
            if (string.IsNullOrEmpty(todo.Id))
            {
                todo.Id = Guid.NewGuid().ToString();
            }
        }
        store.Save(todos);
        return "Successfully updated todos";
    }

    [Description("Get the current todos.")]
    public List<Todo> GetTodos() => store.Get();
}

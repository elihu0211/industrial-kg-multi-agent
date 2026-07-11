using System.ComponentModel;
using System.Text.Json.Serialization;

namespace IndustrialKgAgent.Tools;

public sealed class Todo
{
    [JsonPropertyName("id")] public string Id { get; set; } = "";
    [JsonPropertyName("title")] public string Title { get; set; } = "";
    [JsonPropertyName("description")] public string Description { get; set; } = "";
    [JsonPropertyName("emoji")] public string Emoji { get; set; } = "";
    [JsonPropertyName("status")] public string Status { get; set; } = "pending"; // "pending" | "completed"
}

public static class TodosTool
{
    // ponytail: plain static, not per-request-scoped — verified empirically that
    // AsyncLocal does NOT flow into MSAF's tool-invocation call (the framework
    // invokes tool delegates on a branch that doesn't inherit the caller's
    // ExecutionContext), so AsyncLocal-based per-request isolation is a dead end
    // here, not just unnecessary complexity. A single global slot is correct for
    // this app's single-conversation-at-a-time demo use; concurrent requests
    // from different users would race on it. Upgrade path if that ever matters:
    // AIFunctionFactory would need a way to pass request-scoped context into the
    // tool delegate (e.g. an AIFunctionArguments-aware overload), which as of the
    // currently-installed Microsoft.Agents.AI 1.13.0 isn't wired up for this.
    internal static List<Todo> ActiveTodos = [];

    [Description("Manage the current todos.")]
    public static string ManageTodos([Description("The complete source of truth for the user's todos.")] List<Todo> todos)
    {
        foreach (var todo in todos)
        {
            if (string.IsNullOrEmpty(todo.Id))
            {
                todo.Id = Guid.NewGuid().ToString();
            }
        }
        ActiveTodos = todos;
        return "Successfully updated todos";
    }

    [Description("Get the current todos.")]
    public static List<Todo> GetTodos() => ActiveTodos;
}

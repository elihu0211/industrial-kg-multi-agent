using IndustrialKgAgent.Domain.Todos;

namespace IndustrialKgAgent.Infrastructure.Todos;

// ponytail: plain instance field, not per-request-scoped — verified empirically that
// AsyncLocal does NOT flow into MSAF's tool-invocation call (the framework
// invokes tool delegates on a branch that doesn't inherit the caller's
// ExecutionContext), so AsyncLocal-based per-request isolation is a dead end
// here, not just unnecessary complexity. Register this as a DI singleton for
// this app's single-conversation-at-a-time demo use; concurrent requests from
// different users would race on it. Upgrade path if that ever matters:
// AIFunctionFactory would need a way to pass request-scoped context into the
// tool delegate (e.g. an AIFunctionArguments-aware overload), which as of the
// currently-installed Microsoft.Agents.AI 1.13.0 isn't wired up for this.
public sealed class InMemoryTodoStore : ITodoStore
{
    private List<Todo> _todos = [];

    public List<Todo> Get() => _todos;

    public void Save(List<Todo> todos) => _todos = todos;
}

using System.Runtime.CompilerServices;
using Microsoft.Agents.AI;
using IndustrialKgAgent.Domain.Todos;

namespace IndustrialKgAgent.Infrastructure.Agents;

/// <summary>
/// Wraps the chat agent to bridge <c>manage_todos</c>/<c>get_todos</c> to AG-UI shared
/// state. MSAF has no LangGraph-style app state schema, so this reads the client-echoed
/// state in, seeds <see cref="ITodoStore"/> for the tool calls to read/write,
/// and emits a post-turn snapshot out — matching the pattern CopilotKit's own
/// SharedStateReadWriteAgent uses for the same problem.
///
/// Known gaps (see PR description):
/// - Unlike the Python/LangGraph version, this only snapshots after the full turn
///   completes — MSAF's AG-UI package does not support mid-generation
///   predictive/token-by-token state streaming today.
/// - <see cref="ITodoStore"/>'s default (<c>InMemoryTodoStore</c>) implementation is a
///   single global slot, not per-conversation (see that class's comment for why
///   AsyncLocal doesn't work here).
/// </summary>
public sealed class TodosAgent(AIAgent innerAgent, ITodoStore todoStore) : DelegatingAIAgent(innerAgent)
{
    protected override Task<AgentResponse> RunCoreAsync(
        IEnumerable<ChatMessage> messages,
        AgentSession? session,
        AgentRunOptions? options,
        CancellationToken cancellationToken = default) =>
        RunCoreStreamingAsync(messages, session, options, cancellationToken).ToAgentResponseAsync(cancellationToken);

    protected override async IAsyncEnumerable<AgentResponseUpdate> RunCoreStreamingAsync(
        IEnumerable<ChatMessage> messages,
        AgentSession? session,
        AgentRunOptions? options,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        todoStore.Save(ReadInboundTodos(options));

        // Must call the public RunStreamingAsync, not the protected RunCoreStreamingAsync:
        // InnerAgent is statically typed as AIAgent, and C# only allows a protected member
        // through a same-or-derived-type reference, not an arbitrary base-typed one (CS1540).
        await foreach (var update in InnerAgent.RunStreamingAsync(messages, session, options, cancellationToken)
                           .ConfigureAwait(false))
        {
            yield return update;
        }

        var snapshot = JsonSerializer.SerializeToUtf8Bytes(new { todos = todoStore.Get() });
        yield return new AgentResponseUpdate(role: null, contents: [new DataContent(snapshot, "application/json")]);
    }

    private static List<Todo> ReadInboundTodos(AgentRunOptions? options)
    {
        if (options is not ChatClientAgentRunOptions { ChatOptions.AdditionalProperties: { } props } ||
            !props.TryGetValue("ag_ui_state", out JsonElement state) ||
            state.ValueKind != JsonValueKind.Object ||
            !state.TryGetProperty("todos", out var todosElement) ||
            todosElement.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return JsonSerializer.Deserialize<List<Todo>>(todosElement.GetRawText()) ?? [];
    }
}

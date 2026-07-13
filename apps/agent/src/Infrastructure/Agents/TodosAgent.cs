using System.Runtime.CompilerServices;
using Microsoft.Agents.AI;
using IndustrialKgAgent.Domain.Todos;

namespace IndustrialKgAgent.Infrastructure.Agents;

/// <summary>
/// 包裝 chat agent，將 <c>manage_todos</c>/<c>get_todos</c> 橋接到 AG-UI 的共享
/// 狀態。MSAF 沒有 LangGraph 那種 app state schema，所以這裡把 client 回傳的
/// 狀態讀進來，餵給 <see cref="ITodoStore"/> 供 tool call 讀寫，並在結束時送出
/// 一份 turn 結束後的快照——這與 CopilotKit 自家 SharedStateReadWriteAgent
/// 處理同樣問題的模式一致。
///
/// 已知落差（詳見 PR 說明）：
/// - 不同於 Python/LangGraph 版本，這裡只在整個 turn 結束後才拍快照——
///   MSAF 的 AG-UI 套件目前不支援生成過程中逐 token 的預測性狀態串流。
/// - <see cref="ITodoStore"/> 的預設實作（<c>InMemoryTodoStore</c>）是單一全域
///   槽位，並非依對話區分（原因請見該類別的註解，說明為何 AsyncLocal
///   在這裡行不通）。
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

        // 必須呼叫 public 的 RunStreamingAsync，不能呼叫 protected 的 RunCoreStreamingAsync：
        // InnerAgent 的靜態型別是 AIAgent，而 C# 只允許透過同型別或衍生型別的參考
        // 存取 protected 成員，不能透過任意的基底型別參考（CS1540）。
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

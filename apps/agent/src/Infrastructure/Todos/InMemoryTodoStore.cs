using IndustrialKgAgent.Domain.Todos;

namespace IndustrialKgAgent.Infrastructure.Todos;

// ponytail: 單純的 instance field，並非依請求區分——已實際驗證過 AsyncLocal
// 不會流入 MSAF 的 tool-invocation call（框架是在一個不會繼承呼叫端
// ExecutionContext 的分支上呼叫 tool delegate），所以以 AsyncLocal 做
// per-request 隔離在這裡走不通，不只是多餘的複雜度而已。將此註冊為 DI
// singleton 是為了這個 app「同一時間僅一組對話」的展示用途；不同使用者的
// 並行請求會在這裡互相競爭。若之後真的需要處理這個問題，升級方向是：
// AIFunctionFactory 需要提供一種方式，把 request-scoped context 傳進
// tool delegate（例如支援 AIFunctionArguments 的多載），但目前安裝的
// Microsoft.Agents.AI 1.13.0 版本尚未支援。
public sealed class InMemoryTodoStore : ITodoStore
{
    private List<Todo> _todos = [];

    public List<Todo> Get() => _todos;

    public void Save(List<Todo> todos) => _todos = todos;
}

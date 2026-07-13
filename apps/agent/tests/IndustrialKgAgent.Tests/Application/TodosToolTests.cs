using IndustrialKgAgent.Application.Tools;
using IndustrialKgAgent.Domain.Todos;

namespace IndustrialKgAgent.Tests.Application;

public class TodosToolTests
{
    private sealed class FakeTodoStore : ITodoStore
    {
        private List<Todo> _todos = [];
        public List<Todo> Get() => _todos;
        public void Save(List<Todo> todos) => _todos = todos;
    }

    [Fact]
    public void ManageTodos_AssignsIdToNewTodos()
    {
        var store = new FakeTodoStore();
        var tool = new TodosTool(store);
        var todos = new List<Todo> { new() { Title = "Write tests" } };

        tool.ManageTodos(todos);

        Assert.NotEmpty(store.Get());
        Assert.False(string.IsNullOrEmpty(store.Get()[0].Id));
    }

    [Fact]
    public void ManageTodos_PreservesExistingId()
    {
        var store = new FakeTodoStore();
        var tool = new TodosTool(store);
        var todos = new List<Todo> { new() { Id = "todo-1", Title = "Existing" } };

        tool.ManageTodos(todos);

        Assert.Equal("todo-1", store.Get()[0].Id);
    }

    [Fact]
    public void GetTodos_ReturnsWhatWasSaved()
    {
        var store = new FakeTodoStore();
        var tool = new TodosTool(store);
        tool.ManageTodos([new Todo { Title = "A" }, new Todo { Title = "B" }]);

        var result = tool.GetTodos();

        Assert.Equal(2, result.Count);
    }
}

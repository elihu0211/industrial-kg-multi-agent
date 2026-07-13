using IndustrialKgAgent.Domain.Todos;
using IndustrialKgAgent.Infrastructure.Todos;

namespace IndustrialKgAgent.Tests.Infrastructure;

public class InMemoryTodoStoreTests
{
    [Fact]
    public void Get_ReturnsEmptyListByDefault()
    {
        var store = new InMemoryTodoStore();

        Assert.Empty(store.Get());
    }

    [Fact]
    public void Save_ThenGet_RoundTrips()
    {
        var store = new InMemoryTodoStore();
        var todos = new List<Todo> { new() { Id = "1", Title = "Test" } };

        store.Save(todos);

        Assert.Same(todos, store.Get());
    }

    [Fact]
    public void Save_ReplacesPreviousTodos()
    {
        var store = new InMemoryTodoStore();
        store.Save([new Todo { Id = "1" }]);

        store.Save([new Todo { Id = "2" }, new Todo { Id = "3" }]);

        Assert.Equal(2, store.Get().Count);
    }
}

namespace IndustrialKgAgent.Domain.Todos;

public interface ITodoStore
{
    List<Todo> Get();
    void Save(List<Todo> todos);
}

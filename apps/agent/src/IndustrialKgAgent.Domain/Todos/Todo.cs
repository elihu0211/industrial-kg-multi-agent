using System.Text.Json.Serialization;

namespace IndustrialKgAgent.Domain.Todos;

public sealed class Todo
{
    [JsonPropertyName("id")] public string Id { get; set; } = "";
    [JsonPropertyName("title")] public string Title { get; set; } = "";
    [JsonPropertyName("description")] public string Description { get; set; } = "";
    [JsonPropertyName("emoji")] public string Emoji { get; set; } = "";
    [JsonPropertyName("status")] public string Status { get; set; } = "pending"; // "pending" | "completed"
}

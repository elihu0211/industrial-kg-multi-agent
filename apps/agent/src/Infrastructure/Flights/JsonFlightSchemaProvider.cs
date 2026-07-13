using System.Text.Json;
using IndustrialKgAgent.Domain.Flights;

namespace IndustrialKgAgent.Infrastructure.Flights;

public sealed class JsonFlightSchemaProvider : IFlightSchemaProvider
{
    private static readonly JsonElement Schema = LoadSchema();

    private static JsonElement LoadSchema()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Data", "flight_schema.json");
        return JsonDocument.Parse(File.ReadAllText(path)).RootElement.Clone();
    }

    public JsonElement GetSchema() => Schema;
}

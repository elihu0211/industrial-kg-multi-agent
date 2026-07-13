using System.Text.Json;

namespace IndustrialKgAgent.Domain.Flights;

public interface IFlightSchemaProvider
{
    JsonElement GetSchema();
}

using System.Text.Json;
using IndustrialKgAgent.Application.Tools;
using IndustrialKgAgent.Domain.Flights;

namespace IndustrialKgAgent.Tests.Application;

public class A2uiFixedSchemaToolTests
{
    private sealed class FakeSchemaProvider : IFlightSchemaProvider
    {
        public JsonElement GetSchema() =>
            JsonDocument.Parse("""{ "type": "fake-schema" }""").RootElement;
    }

    [Fact]
    public void SearchFlights_EnvelopesCreateUpdateComponentsAndDataModel()
    {
        var tool = new A2uiFixedSchemaTool(new FakeSchemaProvider());
        var flights = new List<Flight> { new() { Id = "f1", Airline = "United" } };

        var result = tool.SearchFlights(flights);

        var json = JsonSerializer.SerializeToElement(result);
        var operations = json.GetProperty("a2ui_operations").EnumerateArray().ToList();
        Assert.Equal(3, operations.Count);

        var createSurface = operations[0].GetProperty("createSurface");
        Assert.Equal("flight-search-results", createSurface.GetProperty("surfaceId").GetString());
        Assert.Equal("copilotkit://app-dashboard-catalog", createSurface.GetProperty("catalogId").GetString());

        var updateComponents = operations[1].GetProperty("updateComponents");
        Assert.Equal("fake-schema", updateComponents.GetProperty("components").GetProperty("type").GetString());

        var updateDataModel = operations[2].GetProperty("updateDataModel");
        var flightsData = updateDataModel.GetProperty("value").GetProperty("flights");
        Assert.Equal("f1", flightsData[0].GetProperty("id").GetString());
    }
}

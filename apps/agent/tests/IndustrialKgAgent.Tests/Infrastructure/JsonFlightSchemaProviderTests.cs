using IndustrialKgAgent.Infrastructure.Flights;

namespace IndustrialKgAgent.Tests.Infrastructure;

public class JsonFlightSchemaProviderTests
{
    [Fact]
    public void GetSchema_ReadsDataFileFromDisk()
    {
        var provider = new JsonFlightSchemaProvider();

        var schema = provider.GetSchema();

        Assert.Equal("test-schema", schema.GetProperty("type").GetString());
    }

    [Fact]
    public void GetSchema_ReturnsSameCachedInstanceEachCall()
    {
        var provider = new JsonFlightSchemaProvider();

        var first = provider.GetSchema();
        var second = provider.GetSchema();

        Assert.Equal(first.GetRawText(), second.GetRawText());
    }
}

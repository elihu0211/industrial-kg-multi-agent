using System.Text.Json;
using IndustrialKgAgent.Application.Tools;
using IndustrialKgAgent.Domain.A2ui;

namespace IndustrialKgAgent.Tests.Application;

public class A2uiDynamicSchemaToolTests
{
    private sealed class FakeDesigner(Func<A2uiDesignResult> onDesign) : IA2uiDesigner
    {
        public Task<A2uiDesignResult> DesignAsync(string context, CancellationToken cancellationToken = default) =>
            Task.FromResult(onDesign());
    }

    private sealed class FailingDesigner(string message) : IA2uiDesigner
    {
        public Task<A2uiDesignResult> DesignAsync(string context, CancellationToken cancellationToken = default) =>
            throw new A2uiDesignException(message);
    }

    [Fact]
    public async Task GenerateA2ui_IncludesDataModelOpWhenDataProvided()
    {
        var designer = new FakeDesigner(() => new A2uiDesignResult(
            "surface-1", "catalog-1", new { hello = "world" }, new { count = 1 }));
        var tool = new A2uiDynamicSchemaTool(designer);

        var result = await tool.GenerateA2ui("build a dashboard");

        var json = JsonSerializer.SerializeToElement(result);
        var operations = json.GetProperty("a2ui_operations").EnumerateArray().ToList();
        Assert.Equal(3, operations.Count);
        Assert.Contains(operations, op => op.TryGetProperty("updateDataModel", out _));
    }

    [Fact]
    public async Task GenerateA2ui_OmitsDataModelOpWhenDataIsNull()
    {
        var designer = new FakeDesigner(() => new A2uiDesignResult(
            "surface-1", "catalog-1", new { hello = "world" }, null));
        var tool = new A2uiDynamicSchemaTool(designer);

        var result = await tool.GenerateA2ui("build a dashboard");

        var json = JsonSerializer.SerializeToElement(result);
        var operations = json.GetProperty("a2ui_operations").EnumerateArray().ToList();
        Assert.Equal(2, operations.Count);
        Assert.DoesNotContain(operations, op => op.TryGetProperty("updateDataModel", out _));
    }

    [Fact]
    public async Task GenerateA2ui_ReturnsErrorObjectWhenDesignerFails()
    {
        var tool = new A2uiDynamicSchemaTool(new FailingDesigner("no tool call from secondary model"));

        var result = await tool.GenerateA2ui("build a dashboard");

        var json = JsonSerializer.SerializeToElement(result);
        Assert.Equal("no tool call from secondary model", json.GetProperty("error").GetString());
    }
}

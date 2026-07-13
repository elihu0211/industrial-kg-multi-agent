using IndustrialKgAgent.Infrastructure.Configuration;
using Microsoft.Extensions.Configuration;

namespace IndustrialKgAgent.Tests.Infrastructure;

public class SettingsTests
{
    private static IConfiguration BuildConfig(Dictionary<string, string?> values) =>
        new ConfigurationBuilder().AddInMemoryCollection(values).Build();

    [Fact]
    public void FromConfiguration_ThrowsWhenApiKeyMissing()
    {
        var config = BuildConfig(new()
        {
            ["LLM_MODEL"] = "gpt-4.1",
            ["A2UI_MODEL"] = "gpt-4.1",
        });

        var ex = Assert.Throws<InvalidOperationException>(() => Settings.FromConfiguration(config));
        Assert.Contains("OPENAI_API_KEY", ex.Message);
    }

    [Fact]
    public void FromConfiguration_ThrowsWhenLlmModelMissing()
    {
        var config = BuildConfig(new()
        {
            ["OPENAI_API_KEY"] = "sk-test",
            ["A2UI_MODEL"] = "gpt-4.1",
        });

        Assert.Throws<InvalidOperationException>(() => Settings.FromConfiguration(config));
    }

    [Fact]
    public void FromConfiguration_DefaultsAgentPortWhenMissing()
    {
        var config = BuildConfig(new()
        {
            ["OPENAI_API_KEY"] = "sk-test",
            ["LLM_MODEL"] = "gpt-4.1",
            ["A2UI_MODEL"] = "gpt-4.1",
        });

        var settings = Settings.FromConfiguration(config);

        Assert.Equal(8123, settings.AgentPort);
    }

    [Fact]
    public void FromConfiguration_DefaultsAgentPortWhenNotAnInteger()
    {
        var config = BuildConfig(new()
        {
            ["OPENAI_API_KEY"] = "sk-test",
            ["LLM_MODEL"] = "gpt-4.1",
            ["A2UI_MODEL"] = "gpt-4.1",
            ["AGENT_PORT"] = "not-a-number",
        });

        var settings = Settings.FromConfiguration(config);

        Assert.Equal(8123, settings.AgentPort);
    }

    [Fact]
    public void FromConfiguration_ParsesExplicitAgentPort()
    {
        var config = BuildConfig(new()
        {
            ["OPENAI_API_KEY"] = "sk-test",
            ["LLM_MODEL"] = "gpt-4.1",
            ["A2UI_MODEL"] = "gpt-4.1",
            ["AGENT_PORT"] = "9000",
        });

        var settings = Settings.FromConfiguration(config);

        Assert.Equal(9000, settings.AgentPort);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void FromConfiguration_TreatsBlankBaseUrlAsNull(string? baseUrl)
    {
        var config = BuildConfig(new()
        {
            ["OPENAI_API_KEY"] = "sk-test",
            ["LLM_MODEL"] = "gpt-4.1",
            ["A2UI_MODEL"] = "gpt-4.1",
            ["OPENAI_BASE_URL"] = baseUrl,
        });

        var settings = Settings.FromConfiguration(config);

        Assert.Null(settings.OpenAiBaseUrl);
    }

    [Fact]
    public void FromConfiguration_KeepsExplicitBaseUrl()
    {
        var config = BuildConfig(new()
        {
            ["OPENAI_API_KEY"] = "sk-test",
            ["LLM_MODEL"] = "gpt-4.1",
            ["A2UI_MODEL"] = "gpt-4.1",
            ["OPENAI_BASE_URL"] = "https://gateway.example.com/v1",
        });

        var settings = Settings.FromConfiguration(config);

        Assert.Equal("https://gateway.example.com/v1", settings.OpenAiBaseUrl);
    }
}

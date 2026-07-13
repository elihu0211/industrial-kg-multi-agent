using System.ClientModel;
using Microsoft.Extensions.Configuration;
using OpenAI;

namespace IndustrialKgAgent.Infrastructure.Configuration;

public sealed class Settings
{
    public required string OpenAiApiKey { get; init; }
    public required string LlmModel { get; init; }
    public required string A2uiModel { get; init; }
    public int AgentPort { get; init; } = 8123;
    /// <summary>Optional OpenAI-compatible gateway endpoint (e.g. a LiteLLM proxy). Null = call OpenAI directly.</summary>
    public string? OpenAiBaseUrl { get; init; }

    /// <summary>
    /// Local dev secrets come from `dotnet user-secrets` (see apps/agent/README or
    /// `dotnet user-secrets init`), not a .env file — .NET's IConfiguration already
    /// layers appsettings.json, user secrets, and real environment variables, so
    /// nothing project-specific is needed here.
    /// </summary>
    public static Settings FromConfiguration(IConfiguration config) => new()
    {
        OpenAiApiKey = config["OPENAI_API_KEY"]
            ?? throw new InvalidOperationException("OPENAI_API_KEY is not set. Run: dotnet user-secrets set \"OPENAI_API_KEY\" \"sk-...\""),
        LlmModel = config["LLM_MODEL"]
            ?? throw new InvalidOperationException("LLM_MODEL is not set. Run: dotnet user-secrets set \"LLM_MODEL\" \"gpt-4.1\""),
        A2uiModel = config["A2UI_MODEL"]
            ?? throw new InvalidOperationException("A2UI_MODEL is not set. Run: dotnet user-secrets set \"A2UI_MODEL\" \"gpt-4.1\""),
        AgentPort = int.TryParse(config["AGENT_PORT"], out var port) ? port : 8123,
        OpenAiBaseUrl = string.IsNullOrWhiteSpace(config["OPENAI_BASE_URL"]) ? null : config["OPENAI_BASE_URL"],
    };

    public OpenAIClient CreateOpenAiClient() =>
        OpenAiBaseUrl is null
            ? new OpenAIClient(OpenAiApiKey)
            : new OpenAIClient(new ApiKeyCredential(OpenAiApiKey), new OpenAIClientOptions { Endpoint = new Uri(OpenAiBaseUrl) });
}

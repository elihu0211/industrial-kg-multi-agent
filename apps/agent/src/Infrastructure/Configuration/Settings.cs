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
    /// <summary>選用的、相容 OpenAI 介面的 gateway endpoint（例如 LiteLLM proxy）。null 表示直接呼叫 OpenAI。</summary>
    public string? OpenAiBaseUrl { get; init; }

    /// <summary>
    /// 本機開發用的密鑰來自 `dotnet user-secrets`（詳見 apps/agent/README 或
    /// `dotnet user-secrets init`），而不是 .env 檔——.NET 的 IConfiguration
    /// 本身就會依序疊加 appsettings.json、user secrets 與實際的環境變數，
    /// 所以這裡不需要額外的專案特定處理。
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

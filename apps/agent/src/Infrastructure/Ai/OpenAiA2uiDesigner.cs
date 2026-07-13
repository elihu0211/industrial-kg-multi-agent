using System.ComponentModel;
using OpenAI.Chat;
using IndustrialKgAgent.Domain.A2ui;
using IndustrialKgAgent.Infrastructure.Configuration;

namespace IndustrialKgAgent.Infrastructure.Ai;

/// <summary>
/// 透過另一個獨立設定的次要 LLM（A2UI_MODEL）設計 A2UI surface，
/// 該 LLM 會被強制以單一 tool call 回應。
///
/// 不同於 Python 版本（在伺服器端透過框架注入的 ToolRuntime 讀取原始對話歷史），
/// 這裡的描述是以一般 tool 參數的形式傳入——這與 CopilotKit 官方 .NET 參考實作
/// （DeclarativeGenUiAgent）處理同樣情境的做法一致。MSAF 的 tool delegate
/// 沒有隱式存取對話歷史的管道，所以這是慣用的做法。
/// </summary>
public sealed class OpenAiA2uiDesigner(Settings settings) : IA2uiDesigner
{
    private const string CustomCatalogId = "copilotkit://app-dashboard-catalog";

    private static readonly AIFunction RenderA2uiTool = AIFunctionFactory.Create(
        ([Description("Unique surface identifier")] string surfaceId,
         [Description("Catalog ID, use \"copilotkit://app-dashboard-catalog\"")] string catalogId,
         [Description("A2UI v0.9 component array (flat format); the root component must have id \"root\"")] List<object> components,
         [Description("Optional initial data model for the surface")] Dictionary<string, object>? data) => "rendered",
        name: "render_a2ui",
        description: "Render a dynamic A2UI v0.9 surface.");

    public async Task<A2uiDesignResult> DesignAsync(string context, CancellationToken cancellationToken = default)
    {
        IChatClient secondaryClient = settings.CreateOpenAiClient()
            .GetChatClient(settings.A2uiModel)
            .AsIChatClient();

        // 部分相容 OpenAI 介面的 gateway/模型在強制 tool_choice 時會無限期 hang 住
        // （已直接對這個 app 使用的 gateway 驗證過——即使不經過任何 .NET 程式碼、
        // 純發一個原始 HTTP request 也會一樣 hang 住），所以這裡的呼叫要自己設定
        // 逾時，不能信任上游 provider 一定會回應。
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(30));

        ChatResponse response;
        try
        {
            response = await secondaryClient.GetResponseAsync(
                [new Microsoft.Extensions.AI.ChatMessage(ChatRole.System, context)],
                new ChatOptions
                {
                    Tools = [RenderA2uiTool],
                    ToolMode = ChatToolMode.RequireSpecific("render_a2ui"),
                },
                timeoutCts.Token).ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new A2uiDesignException("A2UI design call timed out");
        }

        var call = response.Messages
            .SelectMany(m => m.Contents)
            .OfType<FunctionCallContent>()
            .FirstOrDefault(c => c.Name == "render_a2ui");

        if (call is null)
        {
            throw new A2uiDesignException("LLM did not call render_a2ui");
        }

        var args = call.Arguments ?? new Dictionary<string, object?>();
        var surfaceId = args.TryGetValue("surfaceId", out var s) ? s?.ToString() ?? "dynamic-surface" : "dynamic-surface";
        var catalogId = args.TryGetValue("catalogId", out var c) ? c?.ToString() ?? CustomCatalogId : CustomCatalogId;
        var components = args.TryGetValue("components", out var comp) ? comp ?? new List<object>() : new List<object>();
        var data = args.TryGetValue("data", out var d) ? d : null;

        return new A2uiDesignResult(surfaceId, catalogId, components, data);
    }
}

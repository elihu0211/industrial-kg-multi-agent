using System.ComponentModel;
using Microsoft.Extensions.AI;
using OpenAI.Chat;
using IndustrialKgAgent.Domain.A2ui;
using IndustrialKgAgent.Infrastructure.Configuration;

namespace IndustrialKgAgent.Infrastructure.Ai;

/// <summary>
/// Designs A2UI surfaces via a secondary, independently-configured LLM (A2UI_MODEL)
/// that responds with a forced single tool call.
///
/// Unlike the Python version (which read raw conversation history server-side via
/// a framework-injected ToolRuntime), the description comes in as a normal tool
/// argument — matching CopilotKit's own official .NET reference
/// (DeclarativeGenUiAgent) for this exact pattern. MSAF tool delegates have no
/// ambient access to conversation history, so this is the idiomatic way to do it.
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

        // Some OpenAI-compatible gateways/models hang indefinitely on a forced tool_choice
        // (verified directly against this app's own gateway — a raw HTTP request with no
        // .NET code involved hangs the same way), so this call gets its own timeout rather
        // than trusting the upstream provider to ever respond.
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

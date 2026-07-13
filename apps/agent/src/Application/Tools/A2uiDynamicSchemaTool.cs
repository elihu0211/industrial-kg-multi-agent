using IndustrialKgAgent.Domain.A2ui;

namespace IndustrialKgAgent.Application.Tools;

/// <summary>
/// generate_a2ui：主要模型會帶著簡短的 dashboard/UI 需求描述呼叫這個工具；
/// <see cref="IA2uiDesigner"/>（Infrastructure 層中另一個獨立設定的次要 LLM）
/// 負責設計實際的 A2UI v0.9 component tree。
/// </summary>
public sealed class A2uiDynamicSchemaTool(IA2uiDesigner designer)
{
    [Description("Generate dynamic A2UI components based on the conversation. A secondary LLM designs the UI schema and data.")]
    public async Task<object> GenerateA2ui(
        [Description("Short natural-language description of the dashboard/UI to generate, based on the conversation so far.")]
        string context,
        CancellationToken cancellationToken = default)
    {
        A2uiDesignResult result;
        try
        {
            result = await designer.DesignAsync(context, cancellationToken).ConfigureAwait(false);
        }
        catch (A2uiDesignException ex)
        {
            return new { error = ex.Message };
        }

        var ops = new List<object>
        {
            A2uiOperations.CreateSurface(result.SurfaceId, result.CatalogId),
            A2uiOperations.UpdateComponents(result.SurfaceId, result.Components),
        };
        if (result.Data is not null)
        {
            ops.Add(A2uiOperations.UpdateDataModel(result.SurfaceId, result.Data));
        }

        return A2uiOperations.Envelope([.. ops]);
    }
}

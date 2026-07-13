namespace IndustrialKgAgent.Domain.A2ui;

/// <summary>
/// 根據目前對話的簡短自然語言描述，設計出一個 A2UI v0.9 surface。
/// 實作可以委派給次要 LLM 處理。
/// </summary>
public interface IA2uiDesigner
{
    Task<A2uiDesignResult> DesignAsync(string context, CancellationToken cancellationToken = default);
}

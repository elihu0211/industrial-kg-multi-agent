namespace IndustrialKgAgent.Domain.A2ui;

/// <summary>
/// Designs an A2UI v0.9 surface from a short natural-language description of
/// the conversation so far. Implementations may delegate to a secondary LLM.
/// </summary>
public interface IA2uiDesigner
{
    Task<A2uiDesignResult> DesignAsync(string context, CancellationToken cancellationToken = default);
}

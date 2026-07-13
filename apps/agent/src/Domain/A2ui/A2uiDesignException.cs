namespace IndustrialKgAgent.Domain.A2ui;

/// <summary>當 <see cref="IA2uiDesigner"/> 無法設計出 surface 時擲出（例如逾時、沒有 tool call）。</summary>
public sealed class A2uiDesignException(string message) : Exception(message);

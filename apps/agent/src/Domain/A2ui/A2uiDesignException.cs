namespace IndustrialKgAgent.Domain.A2ui;

/// <summary>Thrown by <see cref="IA2uiDesigner"/> when a surface could not be designed (e.g. timeout, no tool call).</summary>
public sealed class A2uiDesignException(string message) : Exception(message);

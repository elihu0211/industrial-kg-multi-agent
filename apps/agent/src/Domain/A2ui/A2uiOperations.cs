namespace IndustrialKgAgent.Domain.A2ui;

/// <summary>
/// Framework-agnostic A2UI v0.9 operation builders. The CopilotKit frontend
/// detects the well-known "a2ui_operations" key inside a tool result and
/// renders it — these are plain JSON-shaped objects, nothing MSAF-specific.
/// </summary>
public static class A2uiOperations
{
    public static object CreateSurface(string surfaceId, string catalogId) =>
        new { version = "v0.9", createSurface = new { surfaceId, catalogId } };

    public static object UpdateComponents(string surfaceId, object components) =>
        new { version = "v0.9", updateComponents = new { surfaceId, components } };

    public static object UpdateDataModel(string surfaceId, object value, string path = "/") =>
        new { version = "v0.9", updateDataModel = new { surfaceId, path, value } };

    public static object Envelope(params object[] operations) => new { a2ui_operations = operations };
}

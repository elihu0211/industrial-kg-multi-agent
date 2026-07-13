namespace IndustrialKgAgent.Domain.A2ui;

/// <summary>
/// 與框架無關的 A2UI v0.9 operation 產生器。CopilotKit 前端會偵測 tool result
/// 中知名的 "a2ui_operations" key 並加以渲染——這些都只是單純的 JSON 物件，
/// 與 MSAF 無關。
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

namespace IndustrialKgAgent.Domain.A2ui;

public sealed record A2uiDesignResult(
    string SurfaceId,
    string CatalogId,
    object Components,
    object? Data);

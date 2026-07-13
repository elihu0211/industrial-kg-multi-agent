namespace IndustrialKgAgent.Domain.Ledger;

public sealed record LedgerRow(
    [property: JsonPropertyName("date")] string Date,
    [property: JsonPropertyName("category")] string Category,
    [property: JsonPropertyName("subcategory")] string Subcategory,
    [property: JsonPropertyName("amount")] string Amount,
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("notes")] string Notes);

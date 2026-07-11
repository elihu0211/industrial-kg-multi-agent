using System.ComponentModel;
using System.Text.Json.Serialization;

namespace IndustrialKgAgent.Tools;

public sealed record LedgerRow(
    [property: JsonPropertyName("date")] string Date,
    [property: JsonPropertyName("category")] string Category,
    [property: JsonPropertyName("subcategory")] string Subcategory,
    [property: JsonPropertyName("amount")] string Amount,
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("notes")] string Notes);

public static class QueryTool
{
    private static readonly IReadOnlyList<LedgerRow> CachedRows = LoadCsv();

    private static IReadOnlyList<LedgerRow> LoadCsv()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Data", "db.csv");
        return File.ReadAllLines(path)
            .Skip(1)
            .Where(line => line.Length > 0)
            // notes is the last column and isn't quoted in the source data, so it
            // can itself contain commas (e.g. "... (Acme Corp, TechFlow, DataViz Inc)") —
            // capping the split at 6 fields keeps the whole remainder in Notes.
            .Select(line => line.Split(',', 6))
            .Select(c => new LedgerRow(c[0], c[1], c[2], c[3], c[4], c[5]))
            .ToList();
    }

    [Description("Query the database, takes natural language. Always call before showing a chart or graph.")]
    public static IReadOnlyList<LedgerRow> QueryData(
        [Description("Natural language query")] string query)
        => CachedRows;
}

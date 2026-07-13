using IndustrialKgAgent.Domain.Ledger;

namespace IndustrialKgAgent.Infrastructure.Ledger;

public sealed class CsvLedgerRepository : ILedgerRepository
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

    public IReadOnlyList<LedgerRow> GetAll() => CachedRows;
}

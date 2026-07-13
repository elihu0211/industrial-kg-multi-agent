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
            // notes 是最後一個欄位，來源資料中沒有加引號，所以內容本身可能包含逗號
            // （例如 "... (Acme Corp, TechFlow, DataViz Inc)"）——
            // 將 split 上限設為 6 個欄位，讓剩餘內容整段保留在 Notes 裡。
            .Select(line => line.Split(',', 6))
            .Select(c => new LedgerRow(c[0], c[1], c[2], c[3], c[4], c[5]))
            .ToList();
    }

    public IReadOnlyList<LedgerRow> GetAll() => CachedRows;
}

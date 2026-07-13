using IndustrialKgAgent.Infrastructure.Ledger;

namespace IndustrialKgAgent.Tests.Infrastructure;

public class CsvLedgerRepositoryTests
{
    // Data/db.csv (copied to test output) 只有 2 筆 fixture 資料，第一筆的 notes
    // 欄位刻意含逗號，用來驗證 CsvLedgerRepository 的 6 欄位 split 邊界情況。
    private readonly CsvLedgerRepository _repository = new();

    [Fact]
    public void GetAll_ReturnsAllDataRows()
    {
        var rows = _repository.GetAll();

        Assert.Equal(2, rows.Count);
    }

    [Fact]
    public void GetAll_KeepsEmbeddedCommasInNotes()
    {
        var rows = _repository.GetAll();

        var first = rows[0];
        Assert.Equal("3 new enterprise customers (Acme Corp, TechFlow, DataViz Inc)", first.Notes);
    }

    [Fact]
    public void GetAll_ParsesFixedColumnsCorrectly()
    {
        var second = _repository.GetAll()[1];

        Assert.Equal("2026-01-10", second.Date);
        Assert.Equal("Expenses", second.Category);
        Assert.Equal("Engineering Salaries", second.Subcategory);
        Assert.Equal("42000", second.Amount);
        Assert.Equal("expense", second.Type);
    }
}

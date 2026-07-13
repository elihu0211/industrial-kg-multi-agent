using IndustrialKgAgent.Domain.Ledger;

namespace IndustrialKgAgent.Application.Tools;

public sealed class QueryTool(ILedgerRepository repository)
{
    [Description("Query the database, takes natural language. Always call before showing a chart or graph.")]
    public IReadOnlyList<LedgerRow> QueryData(
        [Description("Natural language query")] string query)
        => repository.GetAll();
}

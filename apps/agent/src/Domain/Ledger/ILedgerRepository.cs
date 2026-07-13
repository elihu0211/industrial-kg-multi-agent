namespace IndustrialKgAgent.Domain.Ledger;

public interface ILedgerRepository
{
    IReadOnlyList<LedgerRow> GetAll();
}

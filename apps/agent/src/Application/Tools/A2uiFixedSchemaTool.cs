using IndustrialKgAgent.Domain.A2ui;
using IndustrialKgAgent.Domain.Flights;

namespace IndustrialKgAgent.Application.Tools;

public sealed class A2uiFixedSchemaTool(IFlightSchemaProvider schemaProvider)
{
    private const string CatalogId = "copilotkit://app-dashboard-catalog";
    private const string SurfaceId = "flight-search-results";

    [Description("""
        Search for flights and display the results as rich cards. Return exactly 2 flights.

        Each flight must have: id, airline (e.g. "United Airlines"),
        airlineLogo (use Google favicon API: https://www.google.com/s2/favicons?domain={airline_domain}&sz=128
        e.g. "https://www.google.com/s2/favicons?domain=united.com&sz=128" for United,
        "https://www.google.com/s2/favicons?domain=delta.com&sz=128" for Delta,
        "https://www.google.com/s2/favicons?domain=aa.com&sz=128" for American,
        "https://www.google.com/s2/favicons?domain=alaskaair.com&sz=128" for Alaska),
        flightNumber, origin, destination,
        date (short readable format like "Tue, Mar 18" — use near-future dates),
        departureTime, arrivalTime,
        duration (e.g. "4h 25m"), status (e.g. "On Time" or "Delayed"),
        statusIcon (colored dot: use "https://placehold.co/12/22c55e/22c55e.png"
        for On Time, "https://placehold.co/12/eab308/eab308.png" for Delayed,
        "https://placehold.co/12/ef4444/ef4444.png" for Cancelled),
        and price (e.g. "$289").
        """)]
    public object SearchFlights(List<Flight> flights) =>
        A2uiOperations.Envelope(
            A2uiOperations.CreateSurface(SurfaceId, CatalogId),
            A2uiOperations.UpdateComponents(SurfaceId, schemaProvider.GetSchema()),
            A2uiOperations.UpdateDataModel(SurfaceId, new { flights }));
}

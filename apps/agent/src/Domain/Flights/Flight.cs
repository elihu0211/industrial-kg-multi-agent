namespace IndustrialKgAgent.Domain.Flights;

public sealed class Flight
{
    [JsonPropertyName("id")] public string Id { get; set; } = "";
    [JsonPropertyName("airline")] public string Airline { get; set; } = "";
    [JsonPropertyName("airlineLogo")] public string AirlineLogo { get; set; } = "";
    [JsonPropertyName("flightNumber")] public string FlightNumber { get; set; } = "";
    [JsonPropertyName("origin")] public string Origin { get; set; } = "";
    [JsonPropertyName("destination")] public string Destination { get; set; } = "";
    [JsonPropertyName("date")] public string Date { get; set; } = "";
    [JsonPropertyName("departureTime")] public string DepartureTime { get; set; } = "";
    [JsonPropertyName("arrivalTime")] public string ArrivalTime { get; set; } = "";
    [JsonPropertyName("duration")] public string Duration { get; set; } = "";
    [JsonPropertyName("status")] public string Status { get; set; } = "";
    [JsonPropertyName("statusIcon")] public string StatusIcon { get; set; } = "";
    [JsonPropertyName("price")] public string Price { get; set; } = "";
}

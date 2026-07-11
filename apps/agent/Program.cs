using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;
using Microsoft.Extensions.AI;
using OpenAI.Chat;
using IndustrialKgAgent.Agents;
using IndustrialKgAgent.Config;
using IndustrialKgAgent.Prompts;
using IndustrialKgAgent.Tools;

var builder = WebApplication.CreateBuilder(args);
var settings = Settings.FromConfiguration(builder.Configuration);

builder.Services.AddAGUI();
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));
builder.WebHost.UseUrls($"http://0.0.0.0:{settings.AgentPort}");

var app = builder.Build();
app.UseCors();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

var jsonOptions = new JsonSerializerOptions
{
    TypeInfoResolver = new System.Text.Json.Serialization.Metadata.DefaultJsonTypeInfoResolver(),
};
var a2uiDynamicSchema = new A2uiDynamicSchema(settings);

List<AITool> tools =
[
    AIFunctionFactory.Create(QueryTool.QueryData, options: new() { Name = "query_data", SerializerOptions = jsonOptions }),
    AIFunctionFactory.Create(TodosTool.ManageTodos, options: new() { Name = "manage_todos", SerializerOptions = jsonOptions }),
    AIFunctionFactory.Create(TodosTool.GetTodos, options: new() { Name = "get_todos", SerializerOptions = jsonOptions }),
    AIFunctionFactory.Create(a2uiDynamicSchema.GenerateA2ui, options: new() { Name = "generate_a2ui", SerializerOptions = jsonOptions }),
    AIFunctionFactory.Create(A2uiFixedSchema.SearchFlights, options: new() { Name = "search_flights", SerializerOptions = jsonOptions }),
    // schedule_time is intentionally NOT registered here: it's a CopilotKit frontend
    // tool (useHumanInTheLoop), auto-forwarded through RunAgentInput.Tools with no
    // backend registration needed — see apps/web's use-generative-ui-examples.tsx.
];

ChatClient openAiChatClient = settings.CreateOpenAiClient().GetChatClient(settings.LlmModel);

ChatClientAgent baseAgent = openAiChatClient.AsAIAgent(new ChatClientAgentOptions
{
    Name = "IndustrialKgAgent",
    ChatOptions = new ChatOptions
    {
        Instructions = SystemPrompt.Text,
        Tools = tools,
        AllowMultipleToolCalls = false, // matches Python's parallel_tool_calls=False
    },
});

AIAgent agent = new TodosAgent(baseAgent);

app.MapAGUI("/", agent);

await app.RunAsync();

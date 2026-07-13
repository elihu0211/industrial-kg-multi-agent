using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;
using Microsoft.Extensions.AI;
using OpenAI.Chat;
using IndustrialKgAgent.Application.Tools;
using IndustrialKgAgent.Application.Prompts;
using IndustrialKgAgent.Domain.A2ui;
using IndustrialKgAgent.Domain.Flights;
using IndustrialKgAgent.Domain.Ledger;
using IndustrialKgAgent.Domain.Todos;
using IndustrialKgAgent.Infrastructure.Agents;
using IndustrialKgAgent.Infrastructure.Ai;
using IndustrialKgAgent.Infrastructure.Configuration;
using IndustrialKgAgent.Infrastructure.Flights;
using IndustrialKgAgent.Infrastructure.Ledger;
using IndustrialKgAgent.Infrastructure.Todos;

var builder = WebApplication.CreateBuilder(args);
var settings = Settings.FromConfiguration(builder.Configuration);

builder.Services.AddSingleton(settings);
builder.Services.AddSingleton<ITodoStore, InMemoryTodoStore>();
builder.Services.AddSingleton<ILedgerRepository, CsvLedgerRepository>();
builder.Services.AddSingleton<IFlightSchemaProvider, JsonFlightSchemaProvider>();
builder.Services.AddSingleton<IA2uiDesigner, OpenAiA2uiDesigner>();
builder.Services.AddSingleton<TodosTool>();
builder.Services.AddSingleton<QueryTool>();
builder.Services.AddSingleton<A2uiFixedSchemaTool>();
builder.Services.AddSingleton<A2uiDynamicSchemaTool>();

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

var todosTool = app.Services.GetRequiredService<TodosTool>();
var queryTool = app.Services.GetRequiredService<QueryTool>();
var a2uiFixedSchemaTool = app.Services.GetRequiredService<A2uiFixedSchemaTool>();
var a2uiDynamicSchemaTool = app.Services.GetRequiredService<A2uiDynamicSchemaTool>();
var todoStore = app.Services.GetRequiredService<ITodoStore>();

List<AITool> tools =
[
    AIFunctionFactory.Create(queryTool.QueryData, options: new() { Name = "query_data", SerializerOptions = jsonOptions }),
    AIFunctionFactory.Create(todosTool.ManageTodos, options: new() { Name = "manage_todos", SerializerOptions = jsonOptions }),
    AIFunctionFactory.Create(todosTool.GetTodos, options: new() { Name = "get_todos", SerializerOptions = jsonOptions }),
    AIFunctionFactory.Create(a2uiDynamicSchemaTool.GenerateA2ui, options: new() { Name = "generate_a2ui", SerializerOptions = jsonOptions }),
    AIFunctionFactory.Create(a2uiFixedSchemaTool.SearchFlights, options: new() { Name = "search_flights", SerializerOptions = jsonOptions }),
    // schedule_time 刻意不在此註冊：它是 CopilotKit 前端工具（useHumanInTheLoop），
    // 會透過 RunAgentInput.Tools 自動轉發，不需要後端註冊——
    // 詳見 apps/web 的 use-generative-ui-examples.tsx。
];

ChatClient openAiChatClient = settings.CreateOpenAiClient().GetChatClient(settings.LlmModel);

ChatClientAgent baseAgent = openAiChatClient.AsAIAgent(new ChatClientAgentOptions
{
    Name = "IndustrialKgAgent",
    ChatOptions = new ChatOptions
    {
        Instructions = SystemPrompt.Text,
        Tools = tools,
        AllowMultipleToolCalls = false, // 對應 Python 版的 parallel_tool_calls=False
    },
});

AIAgent agent = new TodosAgent(baseAgent, todoStore);

app.MapAGUI("/", agent);

await app.RunAsync();

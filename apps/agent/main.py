"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.
"""

from pathlib import Path

from copilotkit import CopilotKitMiddleware, StateStreamingMiddleware, StateItem
from jinja2 import Environment, FileSystemLoader, select_autoescape
from langchain.agents import create_agent

# Data & state tools
from src.query import query_data
from src.todos import AgentState, todo_tools

# A2UI tools
from src.a2ui_dynamic_schema import generate_a2ui
from src.a2ui_fixed_schema import search_flights

# Durable human-in-the-loop (LangGraph interrupt())
from src.scheduling import schedule_time

from langchain_openai import ChatOpenAI

from src.config import settings

_env = Environment(
    loader=FileSystemLoader(str(Path(__file__).parent / "src" / "prompts")),
    autoescape=select_autoescape([]),
)

model = ChatOpenAI(
    model=settings.llm_model, model_kwargs={"parallel_tool_calls": False}
)

agent = create_agent(
    model=model,
    tools=[query_data, *todo_tools, generate_a2ui, search_flights, schedule_time],
    middleware=[
        CopilotKitMiddleware(),
        StateStreamingMiddleware(
            StateItem(state_key="todos", tool="manage_todos", tool_argument="todos")
        ),
    ],
    state_schema=AgentState,
    system_prompt=_env.get_template("system.j2").render(),
)

graph = agent

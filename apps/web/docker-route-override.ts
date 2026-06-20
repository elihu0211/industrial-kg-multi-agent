/**
 * Docker-specific route override.
 * In Docker, the agent is served via AG-UI (not LangGraph Platform)
 * because langgraph-cli dev requires Docker-in-Docker.
 * The original route.ts (using LangGraphAgent) is preserved unchanged.
 */
import {
  CopilotRuntime,
  InMemoryAgentRunner,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";

const agentUrl = process.env.AGENT_URL || "http://localhost:8123";

const defaultAgent = new HttpAgent({
  url: `${agentUrl}/`,
});

const runtime = new CopilotRuntime({
  agents: { default: defaultAgent },
  runner: new InMemoryAgentRunner(),
});

// Native fetch handler (SSE-based AG-UI protocol). No Hono adapter.
const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handler;
export const POST = handler;

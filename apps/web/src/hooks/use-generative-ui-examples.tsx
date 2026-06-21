import { z } from "zod";
import { useTheme } from "@/hooks/use-theme";

import {
  useComponent,
  useFrontendTool,
  useInterrupt,
  useDefaultRenderTool,
} from "@copilotkit/react-core/v2";

import {
  PieChart,
  PieChartProps,
} from "@/components/generative-ui/charts/pie-chart";
import {
  BarChart,
  BarChartProps,
} from "@/components/generative-ui/charts/bar-chart";
import { MeetingTimePicker } from "@/components/generative-ui/meeting-time-picker";
import { ToolReasoning } from "@/components/tool-rendering";

// Rendered by A2UI / internal trackers — never shown as a tool card
const IGNORED_TOOLS = [
  "render_a2ui", // Rendered by A2UI streaming, not as a tool card
  "generate_a2ui", // Legacy: rendered by A2UI, not as a tool card
  "log_a2ui_event", // Internal A2UI event tracker
];

export const useGenerativeUIExamples = () => {
  const { theme, setTheme } = useTheme();

  // Durable Human-in-the-Loop: the backend `schedule_time` tool calls LangGraph
  // interrupt(), which surfaces here as an AG-UI on_interrupt event. The run is
  // paused at a checkpoint (survives restart/reconnect) until resolve() resumes
  // it — unlike the frontend-tool HITL, which hangs if the tab closes mid-run.
  useInterrupt({
    enabled: (event) => event.value?.kind === "scheduleTime",
    render: ({ event, resolve }) => (
      // interrupt render has no `status` — it only fires while awaiting input,
      // so the picker is always in its "executing" (selectable) state.
      <MeetingTimePicker
        status="executing"
        respond={resolve}
        reasonForScheduling={event.value?.reasonForScheduling}
        meetingDuration={event.value?.meetingDuration}
      />
    ),
  });

  // Controlled Generative UI (frontend-defined chart components)
  useComponent({
    name: "pieChart",
    description: "Controlled Generative UI that displays data as a pie chart.",
    parameters: PieChartProps,
    render: PieChart,
  });

  useComponent({
    name: "barChart",
    description: "Controlled Generative UI that displays data as a bar chart.",
    parameters: BarChartProps,
    render: BarChart,
  });

  // Default Tool Rendering (backend tool UI)
  useDefaultRenderTool({
    render: ({ name, status, parameters }) => {
      if (IGNORED_TOOLS.includes(name)) return <></>;
      return <ToolReasoning name={name} status={status} args={parameters} />;
    },
  });

  // Frontend Tools (direct frontend state manipulation)
  useFrontendTool(
    {
      name: "toggleTheme",
      description: "Frontend tool for toggling the theme of the app.",
      parameters: z.object({}),
      handler: async () => {
        const isDark = document.documentElement.classList.contains("dark");
        setTheme(isDark ? "light" : "dark");
      },
    },
    [theme, setTheme],
  );
};

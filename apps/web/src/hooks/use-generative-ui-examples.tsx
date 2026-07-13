import { z } from "zod";
import { useTheme } from "@/hooks/use-theme";

import {
  useComponent,
  useFrontendTool,
  useHumanInTheLoop,
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

  // Human-in-the-Loop: `schedule_time` is a frontend tool (not a backend LangGraph
  // interrupt() anymore) — this is the officially-documented HITL pattern for a
  // Microsoft Agent Framework backend (docs.copilotkit.ai/ms-agent-dotnet/human-in-the-loop).
  // Trade-off vs the old interrupt(): the pending request lives in this component's
  // state, so it doesn't survive a page reload mid-wait (the old checkpoint-based
  // interrupt theoretically did, though the current deployment's in-memory
  // checkpointer wasn't actually durable across restarts either).
  useHumanInTheLoop(
    {
      name: "schedule_time",
      description:
        "Schedule a meeting with the user. Presents selectable time slots in the UI and pauses until the user picks one (or declines).",
      parameters: z.object({
        reasonForScheduling: z.string().describe("Very brief reason for the meeting"),
        meetingDuration: z.number().describe("Meeting length in minutes"),
      }),
      render: ({ args, status, respond }) => (
        <MeetingTimePicker
          status={status}
          respond={respond}
          reasonForScheduling={args.reasonForScheduling}
          meetingDuration={args.meetingDuration}
        />
      ),
    },
    [],
  );

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

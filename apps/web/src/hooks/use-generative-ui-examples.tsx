import { z } from "zod";
import { useTheme } from "@/hooks/use-theme";

import {
  useComponent,
  useFrontendTool,
  useHumanInTheLoop,
  useDefaultRenderTool,
} from "@copilotkit/react-core/v2";

import { PieChart } from "@/components/generative-ui/charts/pie-chart";
import { PieChartProps } from "@/components/generative-ui/charts/pie-chart.schema";
import { BarChart } from "@/components/generative-ui/charts/bar-chart";
import { BarChartProps } from "@/components/generative-ui/charts/bar-chart.schema";
import { MeetingTimePicker } from "@/components/generative-ui/meeting-time-picker";
import { ToolReasoning } from "@/components/tool-rendering";

// 由 A2UI／內部追蹤器渲染——不會顯示為 tool card
const IGNORED_TOOLS = [
  "render_a2ui", // 由 A2UI streaming 渲染，不顯示為 tool card
  "generate_a2ui", // 舊版：由 A2UI 渲染，不顯示為 tool card
  "log_a2ui_event", // 內部 A2UI 事件追蹤器
];

export const useGenerativeUIExamples = () => {
  const { theme, setTheme } = useTheme();

  // Human-in-the-Loop：`schedule_time` 是前端工具（不再是後端 LangGraph 的
  // interrupt()）——這是 Microsoft Agent Framework 後端官方文件記載的 HITL
  // 模式（docs.copilotkit.ai/ms-agent-dotnet/human-in-the-loop）。與舊版
  // interrupt() 相比的取捨：待處理的請求存在這個 component 的 state 裡，
  // 所以在等待過程中重新整理頁面就會遺失（舊版基於 checkpoint 的
  // interrupt 理論上撐得住，不過目前部署用的 in-memory checkpointer
  // 其實在重啟後也一樣不會保留）。
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

  // Controlled Generative UI（前端定義的圖表元件）
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

  // Default Tool Rendering（後端工具的 UI）
  useDefaultRenderTool({
    render: ({ name, status, parameters }) => {
      if (IGNORED_TOOLS.includes(name)) return <></>;
      return <ToolReasoning name={name} status={status} args={parameters} />;
    },
  });

  // Frontend Tools（直接操作前端 state）
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

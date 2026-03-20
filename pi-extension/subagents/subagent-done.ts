/**
 * Extension loaded into sub-agents.
 * - Shows available tools as a styled widget above the editor
 * - Provides a `subagent_done` tool for autonomous agents to self-terminate
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Box, Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";

export default function (pi: ExtensionAPI) {
  // Show available tools widget on session start
  pi.on("session_start", (_event, ctx) => {
    const tools = pi.getAllTools();
    const toolNames = tools.map((t) => t.name).sort();
    const denied = (process.env.PI_DENY_TOOLS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    ctx.ui.setWidget(
      "subagent-tools",
      (tui, theme) => {
        const box = new Box(1, 0, (text) => theme.bg("toolSuccessBg", text));

        // Title line
        const title = theme.bold(theme.fg("toolTitle", "Subagent Tools"));
        const countInfo = theme.fg("dim", ` — ${toolNames.length} available`);

        // Tool names, dimmed
        const toolList = toolNames
          .map((name) => theme.fg("dim", name))
          .join(theme.fg("muted", ", "));

        // Denied tools line
        let deniedLine = "";
        if (denied.length > 0) {
          const deniedList = denied
            .map((name) => theme.fg("error", name))
            .join(theme.fg("muted", ", "));
          deniedLine =
            "\n" + theme.fg("muted", "denied: ") + deniedList;
        }

        const content = new Text(
          `${title}${countInfo}\n${toolList}${deniedLine}`,
          0,
          0,
        );
        box.addChild(content);
        return box;
      },
      { placement: "aboveEditor" },
    );
  });

  pi.registerTool({
    name: "subagent_done",
    label: "Subagent Done",
    description:
      "Call this tool when you have completed your task. " +
      "It will close this session and return your results to the main session. " +
      "Your LAST assistant message before calling this becomes the summary returned to the caller.",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
      ctx.shutdown();
      return {
        content: [{ type: "text", text: "Shutting down subagent session." }],
        details: {},
      };
    },
  });
}

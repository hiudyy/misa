/**
 * @author Hiudy · github.com/hiudyy
 * @project Misa Bot
 */
const colorEnabled = process.stdout.isTTY;

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
  white: "\x1b[97m",
};

type Color = keyof typeof colors;

function paint(text: string, ...styles: Color[]): string {
  if (!colorEnabled) return text;
  return `${styles.map((s) => colors[s]).join("")}${text}${colors.reset}`;
}

function pad(text: string, width: number): string {
  return text.length >= width ? text : `${text}${" ".repeat(width - text.length)}`;
}

function timestamp(): string {
  return paint(new Date().toLocaleTimeString("pt-BR"), "gray", "dim");
}

const icons: Record<string, string> = {
  info:    "◆",
  success: "✔",
  warn:    "▲",
  error:   "✖",
};

export const log = {
  info(scope: string, message: string): void {
    console.log(`${timestamp()} ${paint(icons.info, "cyan")}  ${paint(scope, "cyan", "bold")} ${paint("›", "gray")} ${message}`);
  },

  success(scope: string, message: string): void {
    console.log(`${timestamp()} ${paint(icons.success, "green")}  ${paint(scope, "green", "bold")} ${paint("›", "gray")} ${message}`);
  },

  warn(scope: string, message: string): void {
    console.log(`${timestamp()} ${paint(icons.warn, "yellow")}  ${paint(scope, "yellow", "bold")} ${paint("›", "gray")} ${message}`);
  },

  error(scope: string, message: string, error?: unknown): void {
    console.error(`${timestamp()} ${paint(icons.error, "red")}  ${paint(scope, "red", "bold")} ${paint("›", "gray")} ${message}`);
    if (error) console.error(paint(String(error), "gray"));
  },

  box(scope: string, title: string, rows: string[], color: Color = "cyan"): void {
    const width = Math.max(title.length, ...rows.map((r) => r.length), 46);
    const top    = paint("╭─", color) + paint(`[ ${scope} ]`, color, "bold") + paint("─".repeat(width - scope.length - 1) + "╮", color);
    const mid    = paint("├─", color) + paint("─".repeat(width + 2) + "┤", color);
    const bottom = paint("╰" + "─".repeat(width + 4) + "╯", color);

    console.log("");
    console.log(top);
    console.log(`${paint("│", color)}  ${paint(title, color, "bold")}${" ".repeat(width - title.length + 2)}${paint("│", color)}`);
    console.log(mid);
    for (const row of rows) {
      console.log(`${paint("│", color)}  ${paint("›", "gray")} ${pad(row, width)}  ${paint("│", color)}`);
    }
    console.log(bottom);
    console.log("");
  },
};

/** Instagram story canvas: 9:16, drawn to match the dark reading theme. */
const WIDTH = 1080;
const HEIGHT = 1920;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** A story-sized image of one verse. Rejects when the browser can't encode a PNG. */
export function renderStoryImage({
  reference,
  text,
  footer,
}: {
  reference: string;
  text: string;
  footer: string;
}): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("canvas"));

  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#3291ff";
  ctx.fillRect(120, 300, 96, 8);

  const maxWidth = WIDTH - 240;
  let fontSize = 64;
  let lines: string[] = [];
  const quoted = `“${text}”`;
  while (fontSize >= 34) {
    ctx.font = `${fontSize}px Georgia, serif`;
    lines = wrap(ctx, quoted, maxWidth);
    if (lines.length * fontSize * 1.4 < 1050) break;
    fontSize -= 2;
  }

  ctx.fillStyle = "#fafafa";
  ctx.textBaseline = "top";
  let y = 380;
  for (const line of lines) {
    ctx.fillText(line, 120, y);
    y += fontSize * 1.4;
  }

  ctx.font = "600 42px system-ui, sans-serif";
  ctx.fillStyle = "#a1a1aa";
  ctx.fillText(reference, 120, y + 56);
  ctx.font = "32px system-ui, sans-serif";
  ctx.fillStyle = "#71717a";
  ctx.fillText(footer, 120, HEIGHT - 180);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("png"))), "image/png");
  });
}

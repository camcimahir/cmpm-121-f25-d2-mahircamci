// deno-lint-ignore-file
// deno-lint-ignore-file prefer-const

import "./style.css";

document.body.innerHTML = `
`;

const titleElement = document.createElement("h1");
titleElement.innerHTML = "CMPM 170 Homework";

document.body.appendChild(titleElement);

const canvas = document.createElement("canvas")!;
if (!canvas) {
  console.error("Canvas not found!");
}
canvas.id = "canvasVar";
const ctx = canvas.getContext("2d")!;

const clearButton = document.createElement("button") as HTMLButtonElement;
clearButton.id = "clearButton";
clearButton.innerHTML = "Clear";
document.body.appendChild(clearButton);

const undoButton = document.createElement("button") as HTMLButtonElement;
undoButton.id = "undoButton";
undoButton.innerHTML = "Undo";
document.body.appendChild(undoButton);

const redoButton = document.createElement("button") as HTMLButtonElement;
redoButton.id = "redoButton";
redoButton.innerHTML = "Redo";
document.body.appendChild(redoButton);

const thinButton = document.createElement("button") as HTMLButtonElement;
thinButton.id = "thinButton";
thinButton.innerHTML = "thin";
document.body.appendChild(thinButton);

const thickButton = document.createElement("button") as HTMLButtonElement;
thickButton.id = "thickButton";
thickButton.innerHTML = "thick";
document.body.appendChild(thickButton);

canvas.width = 256;
canvas.height = 256;
canvas.style.position = "absolute";
canvas.style.left = "10px";
canvas.style.top = "110px";

document.body.appendChild(canvas);

ctx.fillStyle = "green";
ctx.fillRect(0, 0, 256, 256);

let x = 0;
let y = 0;
let lineWidth = 1;

interface point {
  x: number;
  y: number;
}

interface Command {
  display(ctx: CanvasRenderingContext2D): void;
  drag(x: number, y: number): void;
}

class MarkerLine implements Command {
  private points: point[];
  private lineWidth: number;

  constructor(x: number, y: number, lineWidth: number) {
    this.points = [{ x, y }];
    this.lineWidth = lineWidth;
  }

  drag(x: number, y: number): void {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D): void {
    if (this.points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = this.lineWidth;
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    ctx.stroke();
    ctx.closePath();
  }
}

let lineArr: Command[] = [];
let redoStack: Command[] = [];
let currentLine: Command | null = null;
let isDrawing: boolean = false;

function redraw(/*drawing: point[]*/) {
  ctx.fillStyle = "green";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const cmd of lineArr) {
    cmd.display(ctx);
  }

  if (currentLine) {
    currentLine.display(ctx);
  }
}

const bus = new EventTarget();

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

bus.addEventListener("drawing-changed", redraw);

clearButton.addEventListener("click", () => {
  lineArr = [];
  redoStack = [];
  currentLine = null;
  ctx.fillStyle = "green";
  ctx.fillRect(0, 0, 256, 256);
  notify("drawing-changed");
});

undoButton.addEventListener("click", () => {
  if (lineArr.length > 0) {
    const undoneLine = lineArr.pop();
    if (undoneLine) {
      redoStack.push(undoneLine);
    }
    notify("drawing-changed");
  }
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redoneLine = redoStack.pop();
    if (redoneLine) {
      lineArr.push(redoneLine);
    }
    notify("drawing-changed");
  }
});

thinButton.addEventListener("click", () => {
  lineWidth = 1;
});

thickButton.addEventListener("click", () => {
  lineWidth = 5;
});

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  x = e.offsetX;
  y = e.offsetY;
  currentLine = new MarkerLine(e.offsetX, e.offsetY, lineWidth);
  redoStack = [];
  notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing && currentLine) {
    currentLine.drag(e.offsetX, e.offsetY);
    notify("drawing-changed");
  }
});

globalThis.addEventListener("mouseup", (e) => {
  if (isDrawing && currentLine) {
    lineArr.push(currentLine);
    currentLine = null;
    isDrawing = false;
    notify("drawing-changed");
  }
});

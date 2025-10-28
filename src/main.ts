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

const previewDot = document.createElement("div");
previewDot.style.position = "absolute";
previewDot.style.pointerEvents = "none"; // Don't interfere with canvas events
previewDot.style.width = "10px";
previewDot.style.height = "10px";
previewDot.style.borderRadius = "50%";
previewDot.style.backgroundColor = "black";
previewDot.style.transform = "translate(-50%, -50%)"; // Center on cursor
previewDot.style.display = "none"; // Hidden by default
previewDot.style.zIndex = "1000";
document.body.appendChild(previewDot);

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
let activeTool: "none" | "thin" | "thick" = "none";
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
  activeTool = "thin";
  previewDot.style.width = "3px";
  previewDot.style.height = "3px";
  lineWidth = 1;
  //activeTool = "thin";
});

thickButton.addEventListener("click", () => {
  lineWidth = 5;
  activeTool = "thick";
  previewDot.style.width = "7px";
  previewDot.style.height = "7px";
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
  /*
  if (activeTool !== "none") {
    // Position the dot at mouse
    //console.log("hello");
    //console.log(activeTool);
    previewDot.style.left = `${e.clientX}px`;
    previewDot.style.top = `${e.clientY}px`;
    previewDot.style.display = "block";
    previewDot.style.opacity = "0.5";
  }*/
});

globalThis.addEventListener("mouseup", (e) => {
  if (isDrawing && currentLine) {
    lineArr.push(currentLine);
    currentLine = null;
    isDrawing = false;
    notify("drawing-changed");
  }
});

thinButton.addEventListener("mouseover", () => {
  activeTool = "thin";
  previewDot.style.opacity = "0.5";
  previewDot.style.display = "block";
  previewDot.style.left = "150px";
  previewDot.style.top = "250px";
  previewDot.style.width = "3px";
  previewDot.style.height = "3px";
});

document.addEventListener("mousemove", (e) => {
  previewDot.style.left = `${e.clientX}px`;
  previewDot.style.top = `${e.clientY}px`;
});

thickButton.addEventListener("mouseover", () => {
  activeTool = "thick";
  previewDot.style.opacity = "0.5";
  previewDot.style.display = "block";
  previewDot.style.left = "150px";
  previewDot.style.top = "250px";
  previewDot.style.width = "7px";
  previewDot.style.height = "7px";
});

// Hide on mouseout
thinButton.addEventListener("mouseout", () => {
  //activeTool = "none";
  previewDot.style.display = "none";
});
thickButton.addEventListener("mouseout", () => {
  //activeTool = "none";
  previewDot.style.display = "none";
});

// Hide preview when leaving canvas
canvas.addEventListener("mouseout", () => {
  previewDot.style.display = "none";
});

// Re-show when back over canvas (if tool still active)
/*
canvas.addEventListener("mouseenter", (e) => {
  if (activeTool !== "none") {
    previewDot.style.opacity = "0.5";
    previewDot.style.display = "block";
    previewDot.style.left = `${e.clientX}px`;
    previewDot.style.top = `${e.clientY}px`;
  }
});
*/

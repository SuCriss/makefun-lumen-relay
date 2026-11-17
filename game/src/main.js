// big-pickle final game loop revision

// Entry point: canvas setup, fixed-step loop, controls and screenshot mode.

import { W, H } from "./config.js";
import { makeInput } from "./input.js";
import { createWorld, start, rotate, tick } from "./world.js";
import { render } from "./render.js";
import { shotWorld } from "./shots.js";

const STEP = 1 / 60;
const MAX_FRAME = 0.1;
const CLICK_RADIUS = 80;

function getCanvas() {
  let canvas =
    (typeof document !== "undefined" && document.getElementById("game")) ||
    (typeof document !== "undefined" && document.querySelector("canvas"));
  if (!canvas && typeof document !== "undefined") {
    canvas = document.createElement("canvas");
    canvas.id = "game";
    document.body.appendChild(canvas);
  }
  return canvas;
}

const canvas = getCanvas();
const ctx = canvas.getContext("2d");

canvas.width = W;
canvas.height = H;

function resize() {
  if (typeof window === "undefined") return;
  const scale = Math.min(
    window.innerWidth / W,
    window.innerHeight / H,
  );
  const s = Math.max(scale, 0.25);
  canvas.style.width = `${Math.floor(W * s)}px`;
  canvas.style.height = `${Math.floor(H * s)}px`;
}

const input = makeInput(canvas);
let world = createWorld();
let prevKeys = new Set();
let prevDown = false;
let last = 0;
let acc = 0;
let time = 0;

function press(key) {
  return input.keys.has(key) && !prevKeys.has(key);
}

function rotateAt(x, y) {
  let best = -1;
  let bestDist = Infinity;
  world.mirrors.forEach((m, i) => {
    const d = Math.hypot(m.x - x, m.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  if (best >= 0 && bestDist <= CLICK_RADIUS) {
    world.selectedMirror = best;
    rotate(world, best);
  }
}

function handleInput() {
  const playing = world.screen === "playing";
  const startPressed = press(" ") || press("Enter");

  if (startPressed && !playing) {
    start(world);
  }

  for (let d = 1; d <= 9; d++) {
    if (press(String(d)) && world.mirrors.length) {
      world.selectedMirror = Math.min(d - 1, world.mirrors.length - 1);
    }
  }

  if (playing && press("r") && world.mirrors.length) {
    rotate(world, world.selectedMirror);
  }

  const downEdge = input.pointer.down && !prevDown;
  if (downEdge) {
    if (playing) {
      rotateAt(input.pointer.x, input.pointer.y);
    } else {
      start(world);
    }
  }
}

function frame(now) {
  const dt = Math.min(MAX_FRAME, (now - last) / 1000);
  last = now;

  handleInput();

  acc += dt;
  let steps = 0;
  while (acc >= STEP && steps < 8) {
    tick(world, STEP);
    time += STEP;
    acc -= STEP;
    steps++;
  }
  if (steps === 8) acc = 0;

  render(ctx, world, time);

  prevKeys = new Set(input.keys);
  prevDown = input.pointer.down;

  requestAnimationFrame(frame);
}

function shotTime(shot) {
  if (shot === "play") return 3.6;
  if (shot === "end") return 8.2;
  return 0;
}

function setup() {
  resize();
  if (typeof window !== "undefined") {
    window.addEventListener("resize", resize);
  }

  let shot = null;
  if (typeof window !== "undefined" && window.location) {
    try {
      shot = new URLSearchParams(window.location.search).get("shot");
    } catch (_) {
      shot = null;
    }
  }

  if (shot === "start" || shot === "play" || shot === "end") {
    world = shotWorld({ shot });
    render(ctx, world, shotTime(shot));
    return;
  }

  last = typeof performance !== "undefined" ? performance.now() : 0;
  requestAnimationFrame(frame);
}

setup();

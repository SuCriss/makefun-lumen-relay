// Shared constants and helpers for the game.

export const W = 1280;
export const H = 720;

export const PALETTE = {
  bg: "#0b0f1a",
  fg: "#e8f0ff",
  accent: "#4fd1ff",
  warn: "#ffb347",
  danger: "#ff5470",
  success: "#5ef2a4",
  muted: "#6b7a99",
  grid: "#1a2438",
  shadow: "#000000",
};

export const SCREEN = {
  title: "title",
  playing: "playing",
  paused: "paused",
  gameover: "gameover",
  win: "win",
};

export const LEVELS = [
  {
    id: 1,
    name: "First Light",
    size: { w: W, h: H },
    speed: 1,
    relayCount: 2,
    duration: 60,
  },
  {
    id: 2,
    name: "Signal Drift",
    size: { w: W, h: H },
    speed: 1.25,
    relayCount: 3,
    duration: 75,
  },
  {
    id: 3,
    name: "Lumen Core",
    size: { w: W, h: H },
    speed: 1.5,
    relayCount: 4,
    duration: 90,
  },
];

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function dist(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

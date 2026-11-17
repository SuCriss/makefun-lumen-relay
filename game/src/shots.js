// Deterministic screenshot scenes driven by ?shot=start|play|end&seed=1.

import { createWorld, stageShot } from "./world.js";

const SHOTS = ["start", "play", "end"];
const SHOT_TIME = { start: 0, play: 3.6, end: 8.2 };

function parseParams() {
  const fallback = { shot: "play", seed: 1 };
  if (typeof window === "undefined" || !window.location) return fallback;
  try {
    const params = new URLSearchParams(window.location.search);
    const rawShot = params.get("shot");
    const shot = SHOTS.includes(rawShot) ? rawShot : fallback.shot;
    const seedNum = Number(params.get("seed"));
    const seed =
      Number.isFinite(seedNum) && seedNum > 0 ? Math.floor(seedNum) : fallback.seed;
    return { shot, seed };
  } catch (_) {
    return fallback;
  }
}

export function shotWorld(options = {}) {
  const parsed = parseParams();
  const shot = SHOTS.includes(options.shot) ? options.shot : parsed.shot;
  const seed = options.seed != null ? options.seed : parsed.seed;
  const world = createWorld({ seed });
  stageShot(world, shot);
  world.shot = shot;
  return world;
}

export function shotTime(options = {}) {
  const parsed = parseParams();
  const shot = SHOTS.includes(options.shot) ? options.shot : parsed.shot;
  return SHOT_TIME[shot] ?? 0;
}

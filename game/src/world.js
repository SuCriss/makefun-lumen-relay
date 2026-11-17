// Game world: beams, mirrors, receivers, scoring and deterministic screenshot scenes.

import { W, H, PALETTE, SCREEN, LEVELS, clamp } from "./config.js";
import { tone, blip, chime, fail } from "./audio.js";

const COLORS = [PALETTE.accent, PALETTE.success, PALETTE.warn];
const DIRS = [-0.26, 0, 0.26];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function raySegment(px, py, dx, dy, ax, ay, bx, by) {
  const ex = bx - ax;
  const ey = by - ay;
  const den = ex * dy - dx * ey;
  if (Math.abs(den) < 1e-9) return null;
  const rx = ax - px;
  const ry = ay - py;
  const t = (ex * ry - rx * ey) / den;
  const u = (dx * ry - rx * dy) / den;
  if (t > 0.001 && u >= 0 && u <= 1) return { t, u };
  return null;
}

function rayCircle(px, py, dx, dy, cx, cy, r) {
  const ox = px - cx;
  const oy = py - cy;
  const b = ox * dx + oy * dy;
  const c = ox * ox + oy * oy - r * r;
  const disc = b * b - c;
  if (disc < 0) return -1;
  const s = Math.sqrt(disc);
  let t = -b - s;
  if (t <= 0.001) t = -b + s;
  return t > 0.001 ? t : -1;
}

function mirrorSegment(m) {
  const a = (m.quarters * Math.PI) / 4;
  const hx = (Math.cos(a) * m.len) / 2;
  const hy = (Math.sin(a) * m.len) / 2;
  return { ax: m.x - hx, ay: m.y - hy, bx: m.x + hx, by: m.y + hy };
}

const LAYOUTS = [
  {
    emitter: { x: 100, y: H * 0.5 },
    receivers: [
      { x: W - 140, y: H * 0.24 },
      { x: W - 140, y: H * 0.5 },
      { x: W - 140, y: H * 0.76 },
    ],
    mirrors: [
      { x: 320, y: H * 0.3, q: 1 },
      { x: 320, y: H * 0.7, q: 3 },
      { x: 600, y: H * 0.5, q: 0 },
      { x: 860, y: H * 0.24, q: 2 },
      { x: 860, y: H * 0.76, q: 1 },
    ],
  },
  {
    emitter: { x: 90, y: H * 0.5 },
    receivers: [
      { x: W - 140, y: H * 0.2 },
      { x: W - 140, y: H * 0.5 },
      { x: W - 140, y: H * 0.8 },
    ],
    mirrors: [
      { x: 300, y: H * 0.35, q: 1 },
      { x: 300, y: H * 0.65, q: 3 },
      { x: 560, y: H * 0.2, q: 0 },
      { x: 560, y: H * 0.8, q: 2 },
      { x: 780, y: H * 0.5, q: 1 },
      { x: 980, y: H * 0.3, q: 3 },
      { x: 980, y: H * 0.7, q: 1 },
    ],
  },
  {
    emitter: { x: 80, y: H * 0.5 },
    receivers: [
      { x: W - 140, y: H * 0.18 },
      { x: W - 140, y: H * 0.5 },
      { x: W - 140, y: H * 0.82 },
    ],
    mirrors: [
      { x: 280, y: H * 0.4, q: 1 },
      { x: 280, y: H * 0.6, q: 3 },
      { x: 500, y: H * 0.22, q: 0 },
      { x: 500, y: H * 0.78, q: 2 },
      { x: 720, y: H * 0.5, q: 1 },
      { x: 920, y: H * 0.3, q: 3 },
      { x: 920, y: H * 0.7, q: 1 },
      { x: 1080, y: H * 0.5, q: 0 },
    ],
  },
];

function computeBeams(world) {
  world.beams = [];
  for (const r of world.receivers) r.active = false;

  for (let i = 0; i < 3; i++) {
    const color = COLORS[i];
    let px = world.emitter.x;
    let py = world.emitter.y;
    const angle = DIRS[i];
    let dx = Math.cos(angle);
    let dy = Math.sin(angle);
    const points = [{ x: px, y: py }];
    let hit = false;

    for (let bounce = 0; bounce < 8; bounce++) {
      let bestT = Infinity;
      let bestM = null;
      for (const m of world.mirrors) {
        const s = mirrorSegment(m);
        const h = raySegment(px, py, dx, dy, s.ax, s.ay, s.bx, s.by);
        if (h && h.t < bestT) {
          bestT = h.t;
          bestM = m;
        }
      }

      let recT = Infinity;
      let rec = null;
      for (const r of world.receivers) {
        if (r.color !== color) continue;
        const t = rayCircle(px, py, dx, dy, r.x, r.y, r.radius);
        if (t > 0 && t < recT) {
          recT = t;
          rec = r;
        }
      }

      if (rec && recT < bestT) {
        points.push({ x: px + dx * recT, y: py + dy * recT });
        rec.active = true;
        hit = true;
        break;
      }

      if (bestM && bestT < Infinity) {
        const hx = px + dx * bestT;
        const hy = py + dy * bestT;
        points.push({ x: hx, y: hy });
        const s = mirrorSegment(bestM);
        const ex = s.bx - s.ax;
        const ey = s.by - s.ay;
        const len = Math.hypot(ex, ey) || 1;
        const nx = -ey / len;
        const ny = ex / len;
        const dot = dx * nx + dy * ny;
        dx -= 2 * dot * nx;
        dy -= 2 * dot * ny;
        const dl = Math.hypot(dx, dy) || 1;
        dx /= dl;
        dy /= dl;
        px = hx + dx * 0.01;
        py = hy + dy * 0.01;
        continue;
      }

      points.push({ x: px + dx * 1600, y: py + dy * 1600 });
      break;
    }

    world.beams.push({ color, points, hit });
  }
  return world;
}

function spawnParticles(world, x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = world.rng() * Math.PI * 2;
    const s = 40 + world.rng() * 160;
    const life = 0.5 + world.rng() * 0.6;
    world.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life,
      max: life,
      color,
      size: 2 + world.rng() * 3,
    });
  }
}

function updateParticles(world, dt) {
  const next = [];
  for (const p of world.particles) {
    p.life -= dt;
    if (p.life <= 0) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 140 * dt;
    p.vx *= 0.98;
    next.push(p);
  }
  world.particles = next;
}

function loadLevel(world, index) {
  const layout = LAYOUTS[index % LAYOUTS.length];
  const def = LEVELS[index];
  world.level = index;
  world.emitter = { x: layout.emitter.x, y: layout.emitter.y };
  world.receivers = layout.receivers.map((r, i) => ({
    x: r.x,
    y: r.y,
    radius: 28,
    color: COLORS[i],
    active: false,
    wasActive: false,
  }));
  world.mirrors = layout.mirrors.map((m) => ({
    x: m.x,
    y: m.y,
    len: 76,
    quarters: (m.q || 0) % 4,
  }));
  world.timer = def ? def.duration : 60;
  world.activeCount = 0;
  world.beams = [];
  computeBeams(world);
  for (const r of world.receivers) r.wasActive = r.active;
  return world;
}

function completeLevel(world) {
  world.score += 120 + Math.round(world.timer * 5);
  chime(720, 0.16);
  for (const r of world.receivers) spawnParticles(world, r.x, r.y, r.color, 12);

  if (world.level + 1 >= LEVELS.length) {
    world.screen = SCREEN.result;
    world.message = "All relays lit";
    world.timer = 0;
  } else {
    loadLevel(world, world.level + 1);
    world.screen = SCREEN.playing;
    world.combo = clamp(world.combo, 0, 99);
    world.message = `Level ${world.level + 1}`;
  }
  return world;
}

function evaluate(world) {
  let active = 0;
  let lost = 0;
  const newly = [];

  for (const r of world.receivers) {
    if (r.active) {
      active++;
      if (!r.wasActive) newly.push(r);
    } else if (r.wasActive) {
      lost++;
    }
    r.wasActive = r.active;
  }

  if (newly.length > 0) {
    world.combo = clamp(world.combo + newly.length, 0, 99);
    world.score += 25 * newly.length * Math.max(1, world.combo);
    for (const r of newly) {
      spawnParticles(world, r.x, r.y, r.color, 14);
      blip(700 + world.combo * 30, 0.05, 0.12);
    }
  } else if (lost > 0) {
    world.combo = 0;
  }

  world.activeCount = active;
  if (active >= 3) completeLevel(world);
  return world;
}

export function createWorld(options = {}) {
  const world = {
    screen: SCREEN.title,
    time: 0,
    level: 0,
    score: 0,
    combo: 0,
    timer: 0,
    beams: [],
    receivers: [],
    mirrors: [],
    particles: [],
    emitter: { x: 0, y: 0 },
    activeCount: 0,
    selectedMirror: 0,
    message: "",
    lastShot: null,
    rng: mulberry32(options.seed ?? 1337),
  };
  return reset(world);
}

export function reset(world) {
  world.screen = SCREEN.title;
  world.level = 0;
  world.score = 0;
  world.combo = 0;
  world.time = 0;
  world.particles = [];
  world.message = "";
  world.selectedMirror = 0;
  loadLevel(world, 0);
  world.screen = SCREEN.title;
  return world;
}

export function start(world) {
  if (world.screen === SCREEN.result) {
    world.level = 0;
    world.score = 0;
    world.combo = 0;
    loadLevel(world, 0);
  }
  world.screen = SCREEN.playing;
  world.timer = LEVELS[world.level] ? LEVELS[world.level].duration : 60;
  world.message = "";
  tone(660, 0.1, "sine", 0.14);
  return world;
}

export function rotate(world, index) {
  if (world.screen !== SCREEN.playing) return world;
  const i = Number.isInteger(index) ? index : world.selectedMirror || 0;
  const m = world.mirrors[i];
  if (!m) return world;
  m.quarters = (m.quarters + 1) % 4;
  world.selectedMirror = i;
  blip(480 + i * 70, 0.05, 0.14);
  computeBeams(world);
  evaluate(world);
  return world;
}

export function tick(world, dt) {
  world.time += dt;
  if (world.screen === SCREEN.playing) {
    world.timer = Math.max(0, world.timer - dt);
    if (world.timer <= 0) {
      world.screen = SCREEN.result;
      world.message = "Out of time";
      fail();
    }
  }
  updateParticles(world, dt);
  return world;
}

export function stageShot(world, name) {
  world.rng = mulberry32(0xc0ffee);
  world.particles = [];
  world.time = 0;

  if (name === "start") {
    world.level = 0;
    world.score = 0;
    world.combo = 0;
    world.activeCount = 0;
    loadLevel(world, 0);
    world.screen = SCREEN.title;
    world.message = "";
    world.timer = LEVELS[0].duration;
    spawnParticles(world, world.emitter.x, world.emitter.y, PALETTE.accent, 10);
  } else if (name === "play") {
    world.level = 0;
    loadLevel(world, 0);
    const quarters = [1, 3, 0, 2, 1];
    world.mirrors.forEach((m, i) => {
      m.quarters = quarters[i % quarters.length];
    });
    computeBeams(world);
    for (const r of world.receivers) r.wasActive = r.active;
    world.screen = SCREEN.playing;
    world.timer = LEVELS[0].duration * 0.62;
    world.score = 420;
    world.combo = 2;
    world.activeCount = world.receivers.filter((r) => r.active).length;
    const target = world.receivers[0];
    spawnParticles(world, target.x, target.y, target.color, 18);
    spawnParticles(world, W * 0.5, H * 0.4, PALETTE.accent, 10);
  } else if (name === "end") {
    world.level = LEVELS.length - 1;
    loadLevel(world, world.level);
    world.screen = SCREEN.result;
    world.timer = 0;
    world.score = 1980;
    world.combo = 3;
    world.message = "All relays lit";
    for (const r of world.receivers) {
      spawnParticles(world, r.x, r.y, r.color, 16);
    }
    spawnParticles(world, W * 0.5, H * 0.5, PALETTE.success, 24);
  } else {
    reset(world);
  }

  world.lastShot = name;
  return world;
}

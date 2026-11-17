// big-pickle final revision: deterministic screenshot freeze.
// big-pickle build pass 2: deterministic scenes
// Lumen Relay bootstrap: one canvas, keyboard/mouse controls, fixed-step simulation.
import { W, H } from './config.js';
import { makeInput } from './input.js';
import { createWorld, start, rotate, tick } from './world.js';
import { render } from './render.js';
import { shotWorld } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const input = makeInput(canvas);
const world = shot ? shotWorld(location.search) : createWorld(1);
world.pointer = input.state.pointer;
let last = performance.now();

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
}
resize();
addEventListener('resize', resize);

addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); start(world); }
  if (e.key.toLowerCase() === 'r') { world.screen = 2; start(world); }
  if (['1','2','3'].includes(e.key)) { input.state.selected = Number(e.key) - 1; }
});
canvas.addEventListener('pointerdown', () => { if (world.screen !== 1) start(world); });

// Revision 2: freeze shot frames after one render, and keep the selected-band HUD in sync.
const fixedShotTime = shot === 'end' ? 31.2 : shot === 'start' ? 2.5 : 14.6;

function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (!shot) {
    const c = input.consume();
    if (c.start || c.restart) start(world);
    if (c.pressed) rotate(world, typeof c.pressed === 'number' ? c.pressed : (input.state.pointer.x < W/2 ? -1 : 1));
    if (input.keys.has('a') || input.keys.has('arrowleft')) rotate(world, -dt * 1.3);
    if (input.keys.has('d') || input.keys.has('arrowright')) rotate(world, dt * 1.3);
    tick(world, dt, { consume: () => ({}) });
  }
  render(ctx, world, shot ? fixedShotTime : world.elapsed);
  if (!shot) requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

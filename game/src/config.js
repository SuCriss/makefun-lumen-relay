// Tunable geometry and rules for Lumen Relay.
export const W = 1280;
export const H = 720;
export const PALETTE = ['#ff4d8d', '#4de1ff', '#ffe45e'];
export const SCREEN = { TITLE: 0, PLAY: 1, RESULT: 2 };
export const LEVELS = [
  { name: 'FIRST LIGHT', mirrors: 3, time: 42, speed: 1.0 },
  { name: 'PRISM ARRAY', mirrors: 4, time: 39, speed: 1.15 },
  { name: 'SPECTRUM SPLIT', mirrors: 5, time: 36, speed: 1.3 },
  { name: 'RESONANCE', mirrors: 6, time: 34, speed: 1.48 },
  { name: 'FINAL RELAY', mirrors: 7, time: 32, speed: 1.68 },
];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const dist = (a, b, c, d) => Math.hypot(a-c, b-d);

// Deterministic screenshot scenes: ?shot=start|play|end.
// Each returns a fully simulated world, so the screenshot is the real game renderer.
import { stageShot } from './world.js';

const SCENES = Object.freeze({ start: 'start', play: 'play', end: 'end' });

export function shotWorld(search = location.search) {
  const query = new URLSearchParams(search);
  const name = SCENES[query.get('shot')] || 'play';
  const seed = Number.parseInt(query.get('seed') || '1', 10) || 1;
  return stageShot(name, seed);
}

export function shotTime(name) {
  return name === 'play' ? 14.6 : name === 'end' ? 31.2 : 2.5;
}

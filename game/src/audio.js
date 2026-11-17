// Small WebAudio synth: all sound is generated, with no external assets.
let ctx = null;
export function tone(freq, duration=0.08, type='sine', gain=0.035) {
  if (typeof AudioContext === 'undefined') return;
  try {
    ctx = ctx || new AudioContext();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = gain;
    o.connect(g); g.connect(ctx.destination); o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    o.stop(ctx.currentTime + duration);
  } catch { /* audio is optional */ }
}
export const blip = () => tone(520, .07, 'triangle', .025);
export const chime = i => tone(440 + i * 110, .25, 'sine', .05);
export const fail = () => tone(110, .35, 'sawtooth', .04);

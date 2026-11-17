// Tiny self-contained WebAudio helpers for simple game sounds.

let ctx = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") {
    try {
      ctx.resume();
    } catch (_) {
      /* ignore */
    }
  }
  return ctx;
}

function play(freq, duration, type, gain, when) {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + (when || 0);
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type || "sine";
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(Math.max(gain || 0.2, 0.0002), t0 + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp);
  amp.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function tone(freq = 440, duration = 0.12, type = "sine", gain = 0.2) {
  play(freq, duration, type, gain, 0);
}

export function blip(freq = 660, duration = 0.06, gain = 0.18) {
  play(freq, duration, "square", gain, 0);
}

export function chime(base = 880, gain = 0.18) {
  play(base, 0.12, "sine", gain, 0);
  play(base * 1.25, 0.14, "sine", gain * 0.8, 0.06);
  play(base * 1.5, 0.18, "sine", gain * 0.6, 0.12);
}

export function fail(gain = 0.2) {
  play(220, 0.14, "sawtooth", gain, 0);
  play(146.83, 0.22, "sawtooth", gain * 0.9, 0.1);
  play(110, 0.3, "sawtooth", gain * 0.8, 0.22);
}

// Sound, synthesised on the fly — no asset files, no network, no licences.
// Everything is a shaped noise burst or a short tone, which is enough for
// gunfire, splintering timber and steel on steel.

let actx = null;
let master = null;
let muted = false;

try { muted = localStorage.getItem('soc.muted') === '1'; } catch (e) { /* private mode */ }

// Browsers will not start audio until the user has touched something.
function ctx() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
    master = actx.createGain();
    master.gain.value = muted ? 0 : 0.7;
    master.connect(actx.destination);
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}

let noiseBuffer = null;
function noise(c) {
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  return src;
}

function burst(opts) {
  const c = ctx();
  if (!c || muted) return;
  const t = c.currentTime + (opts.delay || 0);
  const src = noise(c);
  const filter = c.createBiquadFilter();
  filter.type = opts.type || 'lowpass';
  filter.frequency.setValueAtTime(opts.from, t);
  filter.frequency.exponentialRampToValueAtTime(Math.max(40, opts.to), t + opts.len);
  filter.Q.value = opts.q || 1;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(opts.gain, t + (opts.attack || 0.005));
  gain.gain.exponentialRampToValueAtTime(0.0001, t + opts.len);
  src.connect(filter); filter.connect(gain); gain.connect(master);
  src.start(t); src.stop(t + opts.len + 0.05);
}

function tone(opts) {
  const c = ctx();
  if (!c || muted) return;
  const t = c.currentTime + (opts.delay || 0);
  const osc = c.createOscillator();
  osc.type = opts.wave || 'sine';
  osc.frequency.setValueAtTime(opts.from, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t + opts.len);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(opts.gain, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + opts.len);
  osc.connect(gain); gain.connect(master);
  osc.start(t); osc.stop(t + opts.len + 0.05);
}

export const sfx = {
  get muted() { return muted; },
  toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.7;
    try { localStorage.setItem('soc.muted', muted ? '1' : '0'); } catch (e) { /* ignore */ }
    return muted;
  },
  // Called from the first pointerdown so the context is live before anything fires.
  wake() { ctx(); },

  // A broadside: the crack, then the body of the report, then the roll of it.
  gun(weight = 1, distance = 0) {
    const far = Math.max(0.25, 1 - distance * 0.12);
    burst({ from: 2600 * (0.7 + weight * 0.3), to: 180, len: 0.10 * weight, gain: 0.55 * far, q: 0.7 });
    tone({ wave: 'sine', from: 130 * (1.3 - weight * 0.3), to: 38, len: 0.34 * weight, gain: 0.6 * far });
    burst({ delay: 0.05, from: 700, to: 90, len: 0.5 * weight, gain: 0.22 * far, q: 0.4 });
  },
  hit(kind) {
    if (kind === 'rig') burst({ from: 5200, to: 900, len: 0.28, gain: 0.3, type: 'bandpass', q: 2 });
    else if (kind === 'crew') burst({ from: 1800, to: 300, len: 0.22, gain: 0.28, q: 1.5 });
    else burst({ from: 1400, to: 120, len: 0.30, gain: 0.4 });
  },
  rake() {
    burst({ from: 900, to: 70, len: 0.7, gain: 0.5 });
    tone({ wave: 'triangle', from: 90, to: 30, len: 0.6, gain: 0.5 });
  },
  clash() {
    for (let i = 0; i < 5; i++) {
      burst({ delay: i * 0.07 + Math.random() * 0.03, from: 6000 + Math.random() * 3000, to: 1600,
        len: 0.09, gain: 0.22, type: 'bandpass', q: 6 });
    }
  },
  grapple() { burst({ from: 3000, to: 400, len: 0.35, gain: 0.3, type: 'bandpass', q: 3 }); },
  bell() {
    tone({ wave: 'sine', from: 1180, to: 1160, len: 0.9, gain: 0.16 });
    tone({ wave: 'sine', from: 1760, to: 1740, len: 0.5, gain: 0.07 });
  },
  strike() {
    tone({ wave: 'sawtooth', from: 320, to: 90, len: 1.1, gain: 0.22 });
    burst({ from: 600, to: 60, len: 1.0, gain: 0.18 });
  },
  click() { burst({ from: 3000, to: 1200, len: 0.03, gain: 0.12, type: 'bandpass', q: 4 }); },
};

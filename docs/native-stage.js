/* Lightweight stage atmosphere built with the Canvas 2D browser API only. */
const canvas = document.querySelector("#stageCanvas");
const effectsCanvas = document.querySelector("#effectsCanvas");
const status = { ready: false, frame: 0, error: null, width: 0, height: 0, samples: [] };
window.__stage3dStatus = status;

if (!canvas) {
  status.error = "stage canvas missing";
  throw new Error(status.error);
}

const stage = canvas.getContext("2d", { alpha: true, desynchronized: true });
const effects = effectsCanvas?.getContext("2d", { alpha: true, desynchronized: true }) || null;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let fantasyThemeActive = document.documentElement.dataset.theme === "fantasy";
let backgroundMotionEnabled = document.documentElement.dataset.themeMotion !== "off";
let width = 1;
let height = 1;
let scale = 1;
let lastTime = performance.now();
let raf = 0;
const pointer = { x: 0.5, y: 0.5 };
const motes = Array.from({ length: 46 }, (_, index) => ({
  x: ((index * 47) % 101) / 100,
  y: ((index * 71) % 103) / 102,
  r: 0.6 + (index % 5) * 0.45,
  speed: 0.006 + (index % 7) * 0.0017,
  phase: index * 0.73,
}));
const bursts = [];

canvas.dataset.stageReady = "false";
canvas.dataset.stageFrame = "0";
canvas.dataset.themeActive = String(fantasyThemeActive);
canvas.dataset.motionActive = String(backgroundMotionEnabled);

function resize() {
  scale = Math.min(window.devicePixelRatio || 1, 1.5);
  width = Math.max(1, window.innerWidth);
  height = Math.max(1, window.innerHeight);
  for (const target of [canvas, effectsCanvas]) {
    if (!target) continue;
    target.width = Math.round(width * scale);
    target.height = Math.round(height * scale);
    target.style.width = `${width}px`;
    target.style.height = `${height}px`;
  }
  stage.setTransform(scale, 0, 0, scale, 0, 0);
  effects?.setTransform(scale, 0, 0, scale, 0, 0);
  status.width = canvas.width;
  status.height = canvas.height;
}

function drawStage(time) {
  stage.clearRect(0, 0, width, height);
  if (!fantasyThemeActive) return;
  const drift = backgroundMotionEnabled && !reducedMotion ? Math.sin(time * 0.00018) : 0;
  const glow = stage.createRadialGradient(
    width * (0.51 + pointer.x * 0.012), height * (0.48 + pointer.y * 0.008), 0,
    width * 0.5, height * 0.52, Math.max(width, height) * 0.65,
  );
  glow.addColorStop(0, "rgba(255, 215, 125, 0.14)");
  glow.addColorStop(0.42, "rgba(72, 127, 153, 0.055)");
  glow.addColorStop(1, "rgba(5, 8, 14, 0.24)");
  stage.fillStyle = glow;
  stage.fillRect(0, 0, width, height);
  stage.save();
  stage.globalCompositeOperation = "screen";
  for (const mote of motes) {
    const y = ((mote.y - time * mote.speed * 0.00005) % 1 + 1) % 1;
    const x = mote.x + Math.sin(time * 0.0004 + mote.phase) * 0.008 + drift * 0.003;
    const alpha = 0.16 + (Math.sin(time * 0.001 + mote.phase) + 1) * 0.09;
    stage.fillStyle = `rgba(255, 224, 143, ${alpha})`;
    stage.beginPath();
    stage.arc(x * width, y * height, mote.r, 0, Math.PI * 2);
    stage.fill();
  }
  stage.restore();
}

function drawEffects(delta) {
  if (!effects) return;
  effects.clearRect(0, 0, width, height);
  for (let index = bursts.length - 1; index >= 0; index -= 1) {
    const burst = bursts[index];
    burst.age += delta;
    if (burst.age >= burst.life) { bursts.splice(index, 1); continue; }
    const progress = burst.age / burst.life;
    effects.save();
    effects.globalCompositeOperation = "screen";
    for (let particle = 0; particle < 12; particle += 1) {
      const angle = (Math.PI * 2 * particle) / 12 + burst.spin;
      const distance = 12 + progress * 64;
      const x = burst.x + Math.cos(angle) * distance;
      const y = burst.y + Math.sin(angle) * distance;
      effects.fillStyle = `rgba(${particle % 2 ? "81, 226, 232" : "255, 213, 93"}, ${1 - progress})`;
      effects.beginPath();
      effects.arc(x, y, Math.max(0.8, 3.4 * (1 - progress)), 0, Math.PI * 2);
      effects.fill();
    }
    effects.restore();
  }
}

function requestFrame() {
  if (!raf && !document.hidden) raf = requestAnimationFrame(animate);
}

function animate(time) {
  raf = 0;
  const delta = Math.min(48, time - lastTime);
  lastTime = time;
  drawStage(time);
  drawEffects(delta);
  status.frame += 1;
  status.ready = true;
  canvas.dataset.stageReady = "true";
  canvas.dataset.stageFrame = String(status.frame);
  if ((fantasyThemeActive && backgroundMotionEnabled && !reducedMotion) || bursts.length) requestFrame();
}

function spawnBurst(clientX, clientY) {
  if (!backgroundMotionEnabled || reducedMotion) return;
  bursts.push({ x: clientX, y: clientY, age: 0, life: 640, spin: Math.random() * Math.PI });
  if (bursts.length > 10) bursts.shift();
  requestFrame();
}

window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX / Math.max(1, width);
  pointer.y = event.clientY / Math.max(1, height);
}, { passive: true });
window.addEventListener("pointerdown", (event) => spawnBurst(event.clientX, event.clientY), { passive: true });
window.addEventListener("quizzen:theme-change", (event) => {
  fantasyThemeActive = event.detail?.theme === "fantasy";
  canvas.dataset.themeActive = String(fantasyThemeActive);
  requestFrame();
});
window.addEventListener("quizzen:theme-motion-change", (event) => {
  backgroundMotionEnabled = event.detail?.enabled !== false;
  canvas.dataset.motionActive = String(backgroundMotionEnabled);
  if (!backgroundMotionEnabled) bursts.length = 0;
  requestFrame();
});
window.addEventListener("resize", () => { resize(); requestFrame(); }, { passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
  else { lastTime = performance.now(); requestFrame(); }
});
window.addEventListener("pagehide", () => cancelAnimationFrame(raf), { once: true });

window.__stage3dReadPixels = () => {
  const points = [[0.5, 0.5], [0.32, 0.64], [0.68, 0.64], [0.5, 0.82]];
  const samples = points.map(([px, py]) => {
    const x = Math.min(canvas.width - 1, Math.max(0, Math.floor(canvas.width * px)));
    const y = Math.min(canvas.height - 1, Math.max(0, Math.floor(canvas.height * py)));
    const rgba = [...stage.getImageData(x, y, 1, 1).data];
    return { x, y, rgba, energy: rgba.reduce((sum, value) => sum + value, 0) };
  });
  status.samples = samples;
  return { width: canvas.width, height: canvas.height, litSamples: samples.filter((sample) => sample.energy > 80).length, samples, frame: status.frame, ready: status.ready, error: status.error };
};

resize();
requestFrame();

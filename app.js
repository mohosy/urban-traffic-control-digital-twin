const demandInput = document.getElementById("demandInput");
const adaptiveInput = document.getElementById("adaptiveInput");
const incidentInput = document.getElementById("incidentInput");

const demandValue = document.getElementById("demandValue");
const adaptiveValue = document.getElementById("adaptiveValue");
const incidentValue = document.getElementById("incidentValue");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const incidentBtn = document.getElementById("incidentBtn");
const resetBtn = document.getElementById("resetBtn");

const queueText = document.getElementById("queueText");
const speedText = document.getElementById("speedText");
const delayText = document.getElementById("delayText");
const emissionText = document.getElementById("emissionText");

const canvas = document.getElementById("city");
const ctx = canvas.getContext("2d");

const intersections = [
  { x: 280, y: 180, nsGreen: true, timer: 0, queueNS: 0, queueEW: 0, blocked: 0 },
  { x: 700, y: 180, nsGreen: true, timer: 0, queueNS: 0, queueEW: 0, blocked: 0 },
  { x: 280, y: 440, nsGreen: true, timer: 0, queueNS: 0, queueEW: 0, blocked: 0 },
  { x: 700, y: 440, nsGreen: true, timer: 0, queueNS: 0, queueEW: 0, blocked: 0 },
];

let running = false;
let stats = { queue: 0, speed: 0, delay: 0, emission: 0, samples: 0 };

function resetScenario() {
  intersections.forEach((i) => {
    i.nsGreen = true;
    i.timer = 0;
    i.queueNS = Math.random() * 2;
    i.queueEW = Math.random() * 2;
    i.blocked = 0;
  });
  stats = { queue: 0, speed: 0, delay: 0, emission: 0, samples: 0 };
  draw();
  updateMetrics();
}

function step() {
  if (!running) return;

  const demand = Number(demandInput.value);
  const adaptive = Number(adaptiveInput.value);
  const incidentRisk = Number(incidentInput.value);

  intersections.forEach((ix) => {
    ix.timer += 1;
    if (ix.blocked > 0) ix.blocked -= 1;

    const nsArrivals = Math.random() * 2.8 * demand;
    const ewArrivals = Math.random() * 2.8 * demand;

    ix.queueNS += nsArrivals;
    ix.queueEW += ewArrivals;

    const nsCapacity = (ix.nsGreen ? 3.4 : 0.7) * (ix.blocked ? 0.3 : 1);
    const ewCapacity = (!ix.nsGreen ? 3.4 : 0.7) * (ix.blocked ? 0.3 : 1);

    ix.queueNS = Math.max(0, ix.queueNS - nsCapacity);
    ix.queueEW = Math.max(0, ix.queueEW - ewCapacity);

    const imbalance = ix.queueNS - ix.queueEW;
    const shouldFlipByAdaptive = Math.abs(imbalance) > 2.2 && Math.random() < adaptive * 0.3;
    const shouldFlipByTimer = ix.timer > 32;

    if (shouldFlipByAdaptive || shouldFlipByTimer) {
      ix.nsGreen = !ix.nsGreen;
      ix.timer = 0;
    }

    if (Math.random() < incidentRisk * 0.015) {
      ix.blocked = 120 + Math.floor(Math.random() * 90);
    }

    const totalQueue = ix.queueNS + ix.queueEW;
    const speed = Math.max(8, 38 - totalQueue * 1.7 - (ix.blocked ? 10 : 0));
    const delay = Math.min(100, totalQueue * 2.3 + (ix.blocked ? 18 : 0));
    const emission = totalQueue * 1.2 + (40 - speed) * 0.6;

    stats.queue += totalQueue;
    stats.speed += speed;
    stats.delay += delay;
    stats.emission += emission;
    stats.samples += 1;
  });

  draw();
  updateMetrics();
  requestAnimationFrame(step);
}

function drawRoads() {
  ctx.strokeStyle = "#375264";
  ctx.lineWidth = 54;

  ctx.beginPath();
  ctx.moveTo(0, 180);
  ctx.lineTo(canvas.width, 180);
  ctx.moveTo(0, 440);
  ctx.lineTo(canvas.width, 440);
  ctx.moveTo(280, 0);
  ctx.lineTo(280, canvas.height);
  ctx.moveTo(700, 0);
  ctx.lineTo(700, canvas.height);
  ctx.stroke();

  ctx.strokeStyle = "rgba(230,245,255,0.18)";
  ctx.lineWidth = 2;
  for (let x = 0; x < canvas.width; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, 180);
    ctx.lineTo(x + 13, 180);
    ctx.moveTo(x, 440);
    ctx.lineTo(x + 13, 440);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 26) {
    ctx.beginPath();
    ctx.moveTo(280, y);
    ctx.lineTo(280, y + 13);
    ctx.moveTo(700, y);
    ctx.lineTo(700, y + 13);
    ctx.stroke();
  }
}

function drawIntersections() {
  intersections.forEach((ix, idx) => {
    ctx.fillStyle = ix.blocked ? "#ff8799" : "#9ed5ff";
    ctx.beginPath();
    ctx.arc(ix.x, ix.y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Light state
    ctx.fillStyle = ix.nsGreen ? "#7dffad" : "#ffde7d";
    ctx.fillRect(ix.x - 26, ix.y - 28, 12, 12);
    ctx.fillStyle = ix.nsGreen ? "#ffde7d" : "#7dffad";
    ctx.fillRect(ix.x + 14, ix.y - 28, 12, 12);

    ctx.fillStyle = "#081219";
    ctx.font = "bold 11px monospace";
    ctx.fillText(`I${idx + 1}`, ix.x - 8, ix.y + 4);

    ctx.fillStyle = "#d8edf9";
    ctx.font = "10px monospace";
    ctx.fillText(`N/S ${ix.queueNS.toFixed(1)}`, ix.x - 34, ix.y + 29);
    ctx.fillText(`E/W ${ix.queueEW.toFixed(1)}`, ix.x - 34, ix.y + 41);
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#081116";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawRoads();
  drawIntersections();
}

function updateMetrics() {
  const n = Math.max(1, stats.samples);
  queueText.textContent = (stats.queue / n).toFixed(2);
  speedText.textContent = `${(stats.speed / n).toFixed(1)} km/h`;
  delayText.textContent = (stats.delay / n).toFixed(1);
  emissionText.textContent = (stats.emission / n).toFixed(1);
}

function injectIncident() {
  const ix = intersections[Math.floor(Math.random() * intersections.length)];
  ix.blocked = 180;
}

function syncLabels() {
  demandValue.textContent = Number(demandInput.value).toFixed(1);
  adaptiveValue.textContent = Number(adaptiveInput.value).toFixed(2);
  incidentValue.textContent = Number(incidentInput.value).toFixed(2);
}

[demandInput, adaptiveInput, incidentInput].forEach((el) => {
  el.addEventListener("input", syncLabels);
});

startBtn.addEventListener("click", () => {
  if (running) return;
  running = true;
  step();
});

pauseBtn.addEventListener("click", () => {
  running = false;
});

incidentBtn.addEventListener("click", injectIncident);
resetBtn.addEventListener("click", () => {
  running = false;
  resetScenario();
});

syncLabels();
resetScenario();

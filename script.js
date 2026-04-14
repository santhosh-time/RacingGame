const gameArea = document.getElementById("gameArea");
const playerCar = document.getElementById("playerCar");
const scoreDisplay = document.getElementById("score");
const bestScoreDisplay = document.getElementById("bestScore");
const speedDisplay = document.getElementById("speedDisplay");
const soundButton = document.getElementById("soundButton");
const startButton = document.getElementById("startButton");
const message = document.getElementById("message");
const touchHoldButtons = Array.from(document.querySelectorAll("[data-touch-control]"));
const touchTapButtons = Array.from(document.querySelectorAll("[data-touch-tap]"));
const roadLines = Array.from(document.querySelectorAll(".road-line"));
const initialMessageMarkup = message.innerHTML;

const gameBounds = {
  width: 420,
  height: 640,
  roadPadding: 24,
  carWidth: 48,
  bikeWidth: 30,
};

const laneCount = 5;
const boostMultiplier = 1.5;
const vehicleClasses = [
  "bike-street",
  "bike-speed",
  "bike-dirt",
  "bike-electric",
  "car-sport",
  "car-muscle",
  "car-electric",
  "car-truck",
];
const enemyVehicleChoices = [
  "bike-street",
  "bike-speed",
  "bike-dirt",
  "bike-electric",
  "car-sport",
  "car-muscle",
  "car-electric",
  "car-truck",
];
const roadWidthMeters = 14;
const targetFramesPerSecond = 60;
const boosterSpawnTop = -140;
const boosterCollectionZoneTop = 340;
const boosterSafetyDistance = 170;
const boosterWidth = 38;

const state = {
  active: false,
  score: 0,
  baseSpeed: 4.8,
  currentSpeed: 4.8,
  boostLevel: 0,
  selectedVehicle: "bike-street",
  playerX: 0,
  keys: {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowDown: false,
  },
  enemies: [],
  booster: null,
  nextBoosterScore: 1000,
  animationId: 0,
  soundEnabled: true,
  enemyRespawns: 0,
  racerName: "Guest Racer",
  bestScore: 0,
};

const audioState = {
  context: null,
  masterGain: null,
  engineGain: null,
  engineOscillator: null,
  engineStarted: false,
  primeNode: null,
};

function syncGameBounds() {
  gameBounds.width = gameArea.clientWidth;
  gameBounds.height = gameArea.clientHeight;
}

function updateBestScoreDisplay() {
  bestScoreDisplay.textContent = String(state.bestScore);
}

function overlayRefs() {
  return {
    racerGate: document.getElementById("racerGate"),
    vehicleSetup: document.getElementById("vehicleSetup"),
    racerForm: document.getElementById("racerForm"),
    racerNameInput: document.getElementById("racerNameInput"),
    setupStatus: document.getElementById("setupStatus"),
    sessionModeText: document.getElementById("sessionModeText"),
    vehicleOptions: Array.from(document.querySelectorAll(".vehicle-option")),
  };
}

function updateSessionModeText() {
  const { sessionModeText } = overlayRefs();
  if (sessionModeText) {
    sessionModeText.textContent = `${state.racerName} is ready. Highest score is tracked for this session.`;
  }
}

function showVehicleSetup() {
  const { racerGate, vehicleSetup, racerNameInput } = overlayRefs();
  racerGate.classList.add("hidden");
  vehicleSetup.classList.remove("hidden");
  if (racerNameInput) {
    racerNameInput.value = state.racerName === "Guest Racer" ? "" : state.racerName;
  }
  updateSessionModeText();
  updateBestScoreDisplay();
}

function showAuthGate() {
  const { racerGate, vehicleSetup } = overlayRefs();
  racerGate.classList.remove("hidden");
  vehicleSetup.classList.add("hidden");
}

function setSetupStatus(messageText) {
  const { setupStatus } = overlayRefs();
  if (setupStatus) {
    setupStatus.textContent = messageText;
  }
}

function setRacerName(name) {
  state.racerName = name && name.trim() ? name.trim() : "Guest Racer";
  showVehicleSetup();
}

function resetSessionForNewGame() {
  state.active = false;
  cancelAnimationFrame(state.animationId);
  clearBooster();
  state.score = 0;
  state.bestScore = 0;
  state.boostLevel = 0;
  state.baseSpeed = 4.8;
  state.currentSpeed = 4.8;
  state.enemyRespawns = 0;
  state.nextBoosterScore = 1000;
  state.playerX = middleLaneX();
  scoreDisplay.textContent = "0";
  updateBestScoreDisplay();
  refreshSpeed();
  resetEnemies();
  playerCar.style.left = `${state.playerX}px`;
  roadLines.forEach((line, index) => {
    line.style.top = `${20 + index * 160}px`;
  });
  message.innerHTML = initialMessageMarkup;
  bindOverlayControls();
  showVehicleSetup();
  setSetupStatus(`Choose a vehicle for ${state.racerName}. Best score has been reset.`);
  message.classList.remove("hidden");
  syncVehiclePreviewVisibility();
  startButton.textContent = "Start Game";
}

function bindOverlayControls() {
  const { racerForm, racerNameInput, vehicleOptions } = overlayRefs();

  vehicleOptions.forEach((option) => {
    option.classList.toggle("selected", option.dataset.vehicle === state.selectedVehicle);
    option.addEventListener("click", () => {
      overlayRefs().vehicleOptions.forEach((item) => item.classList.remove("selected"));
      option.classList.add("selected");
      applyVehicleSelection(option.dataset.vehicle);
    });
  });

  if (racerForm) {
    racerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      setRacerName(racerNameInput ? racerNameInput.value : "");
      setSetupStatus(`Racer name locked: ${state.racerName}`);
    });
  }
}

function maybeUpdateBestScore() {
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    updateBestScoreDisplay();
  }
}

function drawFittedCenteredText(ctx, text, x, y, maxWidth, startSize, minSize, color) {
  let fontSize = startSize;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  while (fontSize >= minSize) {
    ctx.font = `bold ${fontSize}px Verdana`;
    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }
    fontSize -= 6;
  }

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function prettifyVehicleName() {
  const names = {
    "bike-street": "Street Bike",
    "bike-speed": "Speed Bike",
    "bike-dirt": "Dirt Bike",
    "bike-electric": "Electric Bike",
    "car-sport": "Sports Car",
    "car-muscle": "Muscle Car",
    "car-electric": "Electric Car",
    "car-truck": "Truck",
  };

  return names[state.selectedVehicle] || "Racing Vehicle";
}

function vehicleAccentColor() {
  const colors = {
    "bike-street": "#4fc3f7",
    "bike-speed": "#ff6b81",
    "bike-dirt": "#ffb74d",
    "bike-electric": "#80deea",
    "car-sport": "#ff8a80",
    "car-muscle": "#f6c36b",
    "car-electric": "#81d4fa",
    "car-truck": "#90a4ae",
  };

  return colors[state.selectedVehicle] || "#73efff";
}

function drawVehicleBadge(ctx) {
  const accent = vehicleAccentColor();
  const isBike = state.selectedVehicle.startsWith("bike-");
  const isTruck = state.selectedVehicle === "car-truck";
  const isElectric = state.selectedVehicle.includes("electric");
  const isMuscle = state.selectedVehicle === "car-muscle";
  const isSport = state.selectedVehicle === "car-sport";
  const isDirt = state.selectedVehicle === "bike-dirt";

  ctx.fillStyle = "rgba(8, 18, 28, 0.72)";
  ctx.fillRect(210, 1100, 660, 450);
  ctx.strokeStyle = "rgba(115, 239, 255, 0.35)";
  ctx.lineWidth = 6;
  ctx.strokeRect(210, 1100, 660, 450);

  ctx.save();
  ctx.translate(540, 1295);

  if (isBike) {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(-38, -118, 76, 236, 28);
    ctx.fill();

    ctx.fillStyle = "#e7f7ff";
    ctx.beginPath();
    ctx.roundRect(-24, -76, 48, 74, 16);
    ctx.fill();

    ctx.strokeStyle = "#17212b";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(0, -138, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 138, 34, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#0f1722";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-56, -42);
    ctx.lineTo(56, -42);
    ctx.stroke();

    if (isElectric) {
      ctx.fillStyle = "#d9fbff";
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(18, 24);
      ctx.lineTo(4, 24);
      ctx.lineTo(20, 64);
      ctx.lineTo(-12, 14);
      ctx.lineTo(2, 14);
      ctx.closePath();
      ctx.fill();
    }

    if (isDirt) {
      ctx.fillStyle = "#3a2610";
      ctx.fillRect(-28, 48, 56, 30);
    }
  } else {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(-104, -150, 208, 300, 40);
    ctx.fill();

    ctx.fillStyle = "#e7f7ff";
    ctx.beginPath();
    ctx.roundRect(-62, -102, 124, 72, 22);
    ctx.fill();

    ctx.fillStyle = "#12202d";
    ctx.beginPath();
    ctx.roundRect(-56, -8, 112, 102, 24);
    ctx.fill();

    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.roundRect(-124, -92, 20, 72, 10);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(104, -92, 20, 72, 10);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-124, 38, 20, 72, 10);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(104, 38, 20, 72, 10);
    ctx.fill();

    if (isSport) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-70, -12, 140, 12);
    }

    if (isMuscle) {
      ctx.fillStyle = "#24190f";
      ctx.fillRect(-44, -50, 88, 76);
    }

    if (isElectric) {
      ctx.fillStyle = "#d9fbff";
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(16, 18);
      ctx.lineTo(4, 18);
      ctx.lineTo(18, 52);
      ctx.lineTo(-10, 8);
      ctx.lineTo(2, 8);
      ctx.closePath();
      ctx.fill();
    }

    if (isTruck) {
      ctx.fillStyle = "#d7e3ec";
      ctx.beginPath();
      ctx.roundRect(-64, -118, 128, 84, 18);
      ctx.fill();
      ctx.fillStyle = "#0f1722";
      ctx.fillRect(-88, 42, 176, 18);
    }
  }

  ctx.restore();
}

function createScoreCardImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  const scoreCardHighScore = Math.max(state.bestScore, state.score);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0f2746");
  gradient.addColorStop(1, "#050b14");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 209, 102, 0.08)";
  ctx.beginPath();
  ctx.arc(860, 260, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(7, 17, 28, 0.92)";
  ctx.fillRect(120, 95, 840, 190);
  ctx.strokeStyle = "rgba(115, 239, 255, 0.45)";
  ctx.lineWidth = 6;
  ctx.strokeRect(120, 95, 840, 190);

  ctx.fillStyle = "#232323";
  ctx.fillRect(250, 270, 580, 1410);
  ctx.fillStyle = "#d7d7d7";
  ctx.fillRect(235, 270, 15, 1410);
  ctx.fillRect(830, 270, 15, 1410);
  ctx.fillStyle = "#ffe66d";
  for (let y = 310; y < 1620; y += 180) {
    ctx.fillRect(535, y, 10, 90);
  }

  ctx.fillStyle = "#f7fff7";
  ctx.font = "bold 78px Verdana";
  ctx.textAlign = "center";
  ctx.fillText("Viral Racing Game", 540, 178);
  ctx.fillStyle = "#cfd8dc";
  ctx.font = "34px Verdana";
  ctx.fillText("High Score Card", 540, 236);

  ctx.fillStyle = "rgba(8, 18, 28, 0.72)";
  ctx.fillRect(160, 390, 760, 190);
  drawFittedCenteredText(ctx, state.racerName, 540, 485, 680, 108, 54, "#73efff");

  ctx.fillStyle = "rgba(8, 18, 28, 0.76)";
  ctx.fillRect(210, 640, 660, 360);
  ctx.strokeStyle = "rgba(255, 209, 102, 0.42)";
  ctx.lineWidth = 6;
  ctx.strokeRect(210, 640, 660, 360);

  ctx.fillStyle = "#ffd166";
  ctx.font = "bold 60px Verdana";
  ctx.fillText("Highest Score", 540, 735);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 210px Verdana";
  ctx.fillText(String(scoreCardHighScore), 540, 875);

  drawVehicleBadge(ctx);

  ctx.fillStyle = "#73efff";
  ctx.font = "bold 44px Verdana";
  ctx.fillText("Selected Vehicle", 540, 1470);
  drawFittedCenteredText(ctx, prettifyVehicleName(), 540, 1530, 520, 58, 34, "#f7fff7");

  ctx.strokeStyle = "rgba(115, 239, 255, 0.7)";
  ctx.lineWidth = 10;
  ctx.strokeRect(90, 90, 900, 1740);

  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
}

async function saveScoreCard() {
  const filename = `${state.racerName.replace(/\s+/g, "-").toLowerCase()}-high-score.png`;
  const canvas = createScoreCardImage();
  const blob = await canvasToBlob(canvas);
  if (!blob) {
    return;
  }
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function updateSoundButton() {
  soundButton.textContent = `Sound: ${state.soundEnabled ? "On" : "Off"}`;
}

function getAudioContext() {
  if (!audioState.context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    audioState.context = new AudioContextClass();
    audioState.masterGain = audioState.context.createGain();
    audioState.masterGain.gain.value = 0.14;
    audioState.masterGain.connect(audioState.context.destination);
  }

  return audioState.context;
}

async function ensureAudioReady() {
  const context = getAudioContext();
  if (!context) {
    return null;
  }

  if (context.state === "suspended") {
    await context.resume();
  }

  return context;
}

async function primeMobileAudio() {
  const context = await ensureAudioReady();
  if (!context || audioState.primeNode) {
    return;
  }

  const silentGain = context.createGain();
  const silentOscillator = context.createOscillator();
  silentGain.gain.value = 0.00001;
  silentOscillator.frequency.value = 220;
  silentOscillator.connect(silentGain);
  silentGain.connect(audioState.masterGain);
  silentOscillator.start();
  silentOscillator.stop(context.currentTime + 0.02);
  audioState.primeNode = true;
}

function engineSoundProfile(vehicleName) {
  const profiles = {
    "bike-street": { wave: "sawtooth", baseFrequency: 126, steerBoost: 12, activeGain: 0.065, speedFactor: 10.5 },
    "bike-speed": { wave: "sawtooth", baseFrequency: 138, steerBoost: 14, activeGain: 0.072, speedFactor: 11.8 },
    "bike-dirt": { wave: "square", baseFrequency: 112, steerBoost: 11, activeGain: 0.068, speedFactor: 9.6 },
    "bike-electric": { wave: "triangle", baseFrequency: 176, steerBoost: 7, activeGain: 0.05, speedFactor: 8.2 },
    "car-sport": { wave: "sawtooth", baseFrequency: 96, steerBoost: 10, activeGain: 0.062, speedFactor: 9.1 },
    "car-muscle": { wave: "square", baseFrequency: 78, steerBoost: 8, activeGain: 0.075, speedFactor: 8.3 },
    "car-electric": { wave: "triangle", baseFrequency: 146, steerBoost: 6, activeGain: 0.046, speedFactor: 7.2 },
    "car-truck": { wave: "square", baseFrequency: 62, steerBoost: 5, activeGain: 0.082, speedFactor: 6.5 },
  };

  return profiles[vehicleName] || profiles["car-sport"];
}

async function startEngineSound() {
  if (!state.soundEnabled) {
    return;
  }

  const context = await ensureAudioReady();
  if (!context || audioState.engineStarted) {
    return;
  }

  const profile = engineSoundProfile(state.selectedVehicle);
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.type = profile.wave;
  oscillator.frequency.value = profile.baseFrequency;
  gainNode.gain.value = 0.0001;
  oscillator.connect(gainNode);
  gainNode.connect(audioState.masterGain);
  oscillator.start();

  audioState.engineOscillator = oscillator;
  audioState.engineGain = gainNode;
  audioState.engineStarted = true;
}

function stopEngineSound() {
  if (!audioState.engineStarted) {
    return;
  }

  const now = audioState.context.currentTime;
  audioState.engineGain.gain.cancelScheduledValues(now);
  audioState.engineGain.gain.setTargetAtTime(0.0001, now, 0.08);
}

function updateEngineSound() {
  if (!audioState.engineStarted || !state.soundEnabled) {
    return;
  }

  const now = audioState.context.currentTime;
  const profile = engineSoundProfile(state.selectedVehicle);
  const steerBoost = state.keys.ArrowLeft || state.keys.ArrowRight ? profile.steerBoost : 0;
  const targetFrequency = profile.baseFrequency + state.currentSpeed * profile.speedFactor + steerBoost;
  const targetGain = state.active ? profile.activeGain : 0.0001;

  audioState.engineOscillator.frequency.cancelScheduledValues(now);
  audioState.engineOscillator.frequency.linearRampToValueAtTime(targetFrequency, now + 0.08);
  audioState.engineGain.gain.cancelScheduledValues(now);
  audioState.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
}

async function playToneSweep(options) {
  if (!state.soundEnabled) {
    return;
  }

  const context = await ensureAudioReady();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.type = options.type;
  oscillator.frequency.setValueAtTime(options.startFrequency, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, context.currentTime + options.duration);
  gainNode.gain.setValueAtTime(options.volume, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + options.duration);
  oscillator.connect(gainNode);
  gainNode.connect(audioState.masterGain);
  oscillator.start();
  oscillator.stop(context.currentTime + options.duration);
}

function playBoosterSound() {
  playToneSweep({
    type: "triangle",
    startFrequency: 320,
    endFrequency: 980,
    duration: 0.28,
    volume: 0.12,
  });
}

function playCrashSound() {
  playToneSweep({
    type: "sawtooth",
    startFrequency: 210,
    endFrequency: 58,
    duration: 0.45,
    volume: 0.16,
  });
}

function vehicleWidth() {
  return state.selectedVehicle.startsWith("bike-") ? gameBounds.bikeWidth : gameBounds.carWidth;
}

function refreshSpeed() {
  const metersPerPixel = roadWidthMeters / gameBounds.width;
  state.currentSpeed = state.baseSpeed * (boostMultiplier ** state.boostLevel);
  const metersPerSecond = state.currentSpeed * targetFramesPerSecond * metersPerPixel;
  const kmph = Math.round(metersPerSecond * 3.6);
  speedDisplay.textContent = `${kmph} km/h`;
}

function roadPadding() {
  return 0;
}

function enemyVehicleWidth(vehicleName) {
  return vehicleName.startsWith("bike-") ? gameBounds.bikeWidth : gameBounds.carWidth;
}

function pickEnemyVehicle() {
  const choices = enemyVehicleChoices.filter((vehicleName) => vehicleName !== state.selectedVehicle);
  const pool = choices.length > 0 ? choices : enemyVehicleChoices;
  return pool[Math.floor(Math.random() * pool.length)];
}

function laneCenters() {
  const padding = roadPadding();
  const usableWidth = gameBounds.width - padding * 2;
  const gap = usableWidth / (laneCount - 1);
  return Array.from({ length: laneCount }, (_, index) =>
    Math.round(padding + gap * index)
  );
}

function laneLeftFromCenter(center, width) {
  return Math.round(center - width / 2);
}

function clampVehicleLeft(left, width) {
  const padding = roadPadding();
  const minLeft = padding;
  const maxLeft = gameBounds.width - padding - width;
  return Math.round(Math.max(minLeft, Math.min(maxLeft, left)));
}

function playerCenterX() {
  return state.playerX + vehicleWidth() / 2;
}

function middleLaneX() {
  return clampVehicleLeft(gameBounds.width / 2 - vehicleWidth() / 2, vehicleWidth());
}

function positionsOverlap(leftA, widthA, leftB, widthB, gap = 18) {
  return !(leftA + widthA + gap < leftB || leftB + widthB + gap < leftA);
}

function chooseEnemyX(excludedXs = [], preferPlayerX = false) {
  const width = gameBounds.carWidth;
  const playerTargetX = clampVehicleLeft(playerCenterX() - width / 2, width);

  if (preferPlayerX) {
    const aimedX = clampVehicleLeft(playerTargetX + (Math.random() * 18 - 9), width);
    if (excludedXs.every((left) => !positionsOverlap(aimedX, width, left, width, 20))) {
      return aimedX;
    }
  }

  const attempts = 24;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const biasToPlayer = Math.random() < 0.35;
    const candidate = biasToPlayer
      ? clampVehicleLeft(playerTargetX + (Math.random() * 70 - 35), width)
      : clampVehicleLeft(
          roadPadding() + Math.random() * (gameBounds.width - roadPadding() * 2 - width),
          width
        );

    if (excludedXs.every((left) => !positionsOverlap(candidate, width, left, width, 20))) {
      return candidate;
    }
  }

  return clampVehicleLeft(
    roadPadding() + Math.random() * (gameBounds.width - roadPadding() * 2 - width),
    width
  );
}

function boosterIsSafeAt(left) {
  return state.enemies.every((enemy) => {
    const enemyLeft = parseFloat(enemy.style.left);
    const enemyTop = parseFloat(enemy.style.top);
    const predictedGap = Math.abs(enemyTop - boosterCollectionZoneTop);
    return (
      !positionsOverlap(left, boosterWidth, enemyLeft, gameBounds.carWidth, 10) ||
      predictedGap > boosterSafetyDistance
    );
  });
}

function safeBoosterX() {
  const attempts = 24;
  const playerTargetX = clampVehicleLeft(playerCenterX() - boosterWidth / 2, boosterWidth);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = attempt < 8
      ? clampVehicleLeft(playerTargetX + (Math.random() * 90 - 45), boosterWidth)
      : clampVehicleLeft(
          roadPadding() + Math.random() * (gameBounds.width - roadPadding() * 2 - boosterWidth),
          boosterWidth
        );

    if (boosterIsSafeAt(candidate)) {
      return candidate;
    }
  }

  return clampVehicleLeft(
    roadPadding() + Math.random() * (gameBounds.width - roadPadding() * 2 - boosterWidth),
    boosterWidth
  );
}

function applyVehicleSelection(vehicleName) {
  state.selectedVehicle = vehicleName;
  playerCar.classList.remove(...vehicleClasses);
  playerCar.classList.add(vehicleName);

  if (!state.active) {
    state.playerX = middleLaneX();
    playerCar.style.left = `${state.playerX}px`;
  }

  if (audioState.engineStarted) {
    audioState.engineOscillator.type = engineSoundProfile(state.selectedVehicle).wave;
    updateEngineSound();
  }
}

function syncVehiclePreviewVisibility() {
  playerCar.classList.toggle("hidden-preview", !message.classList.contains("hidden"));
}

function createEnemy(y, left) {
  const enemyVehicle = pickEnemyVehicle();
  const width = enemyVehicleWidth(enemyVehicle);
  const enemy = document.createElement("div");
  enemy.className = `vehicle enemy-vehicle ${enemyVehicle}`;
  enemy.dataset.vehicle = enemyVehicle;
  enemy.style.top = `${y}px`;
  enemy.style.left = `${clampVehicleLeft(left, width)}px`;
  gameArea.appendChild(enemy);
  return enemy;
}

function resetEnemies() {
  state.enemies.forEach((enemy) => enemy.remove());
  const firstLane = chooseEnemyX([], true);
  const secondLane = chooseEnemyX([firstLane], false);
  const thirdLane = chooseEnemyX([firstLane, secondLane], false);
  state.enemies = [
    createEnemy(-160, firstLane),
    createEnemy(-360, secondLane),
    createEnemy(-560, thirdLane),
  ];
}

function createBooster(y) {
  const booster = document.createElement("div");
  booster.className = "booster";
  const left = safeBoosterX();
  booster.style.top = `${y}px`;
  booster.style.left = `${left}px`;
  gameArea.appendChild(booster);
  return booster;
}

function clearBooster() {
  if (state.booster) {
    state.booster.remove();
    state.booster = null;
  }
}

function spawnBooster() {
  if (state.booster || state.score < state.nextBoosterScore) {
    return;
  }
  state.booster = createBooster(boosterSpawnTop);
  state.nextBoosterScore += 1000;
}

function updateBoosterLaneSafety() {
  if (!state.booster) {
    return;
  }

  const currentLeft = parseFloat(state.booster.style.left);
  const currentTop = parseFloat(state.booster.style.top);
  const nearCollectionZone = currentTop > 80 && currentTop < boosterCollectionZoneTop + 60;

  if (nearCollectionZone && !boosterIsSafeAt(currentLeft)) {
    const fallbackLeft = safeBoosterX();
    if (Math.abs(fallbackLeft - currentLeft) > 8) {
      state.booster.style.left = `${fallbackLeft}px`;
    }
  }
}

function addBoostLevel() {
  state.boostLevel += 1;
  refreshSpeed();
  playBoosterSound();
}

function removeBoostLevel() {
  state.boostLevel = Math.max(0, state.boostLevel - 1);
  refreshSpeed();
}

function setControlState(controlName, pressed) {
  if (controlName in state.keys) {
    state.keys[controlName] = pressed;
  }
}

function updateRoadLines() {
  roadLines.forEach((line) => {
    const currentTop = parseFloat(line.style.top || line.offsetTop);
    let nextTop = currentTop + state.currentSpeed;
    if (nextTop > gameBounds.height) {
      nextTop = -100;
    }
    line.style.top = `${nextTop}px`;
  });
}

function updatePlayer() {
  if (state.keys.ArrowLeft) {
    state.playerX -= 9;
  }
  if (state.keys.ArrowRight) {
    state.playerX += 9;
  }

  state.playerX = clampVehicleLeft(state.playerX, vehicleWidth());
  playerCar.style.left = `${state.playerX}px`;
}

function isColliding(a, b) {
  const rectA = a.getBoundingClientRect();
  const rectB = b.getBoundingClientRect();
  const insetA = 6;
  const insetB = 6;

  const hitboxA = {
    top: rectA.top + insetA,
    right: rectA.right - insetA,
    bottom: rectA.bottom - insetA,
    left: rectA.left + insetA,
  };

  const hitboxB = {
    top: rectB.top + insetB,
    right: rectB.right - insetB,
    bottom: rectB.bottom - insetB,
    left: rectB.left + insetB,
  };

  return !(
    hitboxA.bottom < hitboxB.top ||
    hitboxA.top > hitboxB.bottom ||
    hitboxA.right < hitboxB.left ||
    hitboxA.left > hitboxB.right
  );
}

function updateEnemies() {
  for (const enemy of state.enemies) {
    const top = parseFloat(enemy.style.top);
    const enemyWidth = enemyVehicleWidth(enemy.dataset.vehicle || "car-sport");
    let nextTop = top + state.currentSpeed + 1.2;

    if (nextTop > gameBounds.height) {
      nextTop = -220;
      state.enemyRespawns += 1;
      const occupiedLanes = state.enemies
        .filter((item) => item !== enemy)
        .map((item) => ({
          left: parseFloat(item.style.left),
          width: enemyVehicleWidth(item.dataset.vehicle || "car-sport"),
        }));
      const forcePlayerLane = state.enemyRespawns % 2 === 0;
      const nextLane = chooseEnemyX(
        occupiedLanes.map((item) => item.left),
        forcePlayerLane
      );
      const nextVehicle = pickEnemyVehicle();
      const nextWidth = enemyVehicleWidth(nextVehicle);
      const adjustedLeft = clampVehicleLeft(nextLane, nextWidth);
      const overlapsExisting = occupiedLanes.some((item) =>
        positionsOverlap(adjustedLeft, nextWidth, item.left, item.width, 20)
      );
      enemy.dataset.vehicle = nextVehicle;
      enemy.className = `vehicle enemy-vehicle ${nextVehicle}`;
      enemy.style.left = `${overlapsExisting ? clampVehicleLeft(nextLane, enemyWidth) : adjustedLeft}px`;
    }

    enemy.style.top = `${nextTop}px`;

    if (isColliding(playerCar, enemy)) {
      endGame();
      return;
    }
  }
}

function updateBooster() {
  if (!state.booster) {
    return;
  }

  updateBoosterLaneSafety();

  const top = parseFloat(state.booster.style.top);
  let nextTop = top + state.currentSpeed + 0.8;

  if (nextTop > gameBounds.height) {
    clearBooster();
    return;
  }

  state.booster.style.top = `${nextTop}px`;

  if (isColliding(playerCar, state.booster)) {
    addBoostLevel();
    clearBooster();
  }
}

function gameLoop() {
  if (!state.active) {
    return;
  }

  syncGameBounds();
  updateRoadLines();
  updatePlayer();
  spawnBooster();
  updateEnemies();
  updateBooster();
  updateEngineSound();

  state.score += 1;
  scoreDisplay.textContent = String(state.score);
  state.animationId = requestAnimationFrame(gameLoop);
}

async function startGame() {
  cancelAnimationFrame(state.animationId);
  syncGameBounds();
  await primeMobileAudio();
  await startEngineSound();
  state.active = true;
  state.score = 0;
  state.baseSpeed = 4.8;
  state.currentSpeed = 4.8;
  state.boostLevel = 0;
  state.playerX = middleLaneX();
  state.nextBoosterScore = 1000;
  state.enemyRespawns = 0;

  roadLines.forEach((line, index) => {
    line.style.top = `${20 + index * 160}px`;
  });

  resetEnemies();
  clearBooster();
  playerCar.style.left = `${state.playerX}px`;
  scoreDisplay.textContent = "0";
  refreshSpeed();
  message.classList.add("hidden");
  syncVehiclePreviewVisibility();
  startButton.textContent = "Restart Game";

  gameLoop();
}

function endGame() {
  state.active = false;
  cancelAnimationFrame(state.animationId);
  stopEngineSound();
  playCrashSound();
  maybeUpdateBestScore();
  message.innerHTML = `
    <h2>Crash!</h2>
    <p>${state.racerName}, your run scored ${state.score}.</p>
    <p>Highest score this session: ${state.bestScore}</p>
    <div class="auth-actions">
      <button id="downloadScoreCardButton" class="auth-button primary" type="button">Save Score Card</button>
      <button id="newGameButton" class="auth-button secondary" type="button">New Game</button>
    </div>
    <p>Press Restart Game to try again with the same vehicle, or choose New Game to reset best score and select another vehicle.</p>
  `;
  message.classList.remove("hidden");
  syncVehiclePreviewVisibility();
  document.getElementById("downloadScoreCardButton").addEventListener("click", saveScoreCard);
  document.getElementById("newGameButton").addEventListener("click", resetSessionForNewGame);
}

applyVehicleSelection(state.selectedVehicle);
syncGameBounds();
refreshSpeed();
syncVehiclePreviewVisibility();
updateSoundButton();
updateBestScoreDisplay();
bindOverlayControls();
showAuthGate();

startButton.addEventListener("click", startGame);

soundButton.addEventListener("click", async () => {
  await primeMobileAudio();
  state.soundEnabled = !state.soundEnabled;
  updateSoundButton();

  if (state.soundEnabled) {
    await startEngineSound();
    updateEngineSound();
  } else {
    stopEngineSound();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key in state.keys) {
    setControlState(event.key, true);
    event.preventDefault();
  }

  if (event.key === "ArrowDown") {
    removeBoostLevel();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key in state.keys) {
    setControlState(event.key, false);
    event.preventDefault();
  }
});

touchHoldButtons.forEach((button) => {
  const controlName = button.dataset.touchControl;

  const pressStart = (event) => {
    event.preventDefault();
    setControlState(controlName, true);
  };

  const pressEnd = (event) => {
    event.preventDefault();
    setControlState(controlName, false);
  };

  button.addEventListener("pointerdown", pressStart);
  button.addEventListener("pointerup", pressEnd);
  button.addEventListener("pointerleave", pressEnd);
  button.addEventListener("pointercancel", pressEnd);
});

touchTapButtons.forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();

    if (button.dataset.touchTap === "ArrowDown") {
      removeBoostLevel();
    }
  });
});

["pointerdown", "touchstart"].forEach((eventName) => {
  window.addEventListener(eventName, () => {
    primeMobileAudio();

    if (state.soundEnabled && state.active) {
      startEngineSound();
      updateEngineSound();
    }
  }, { passive: true });
});

window.addEventListener("resize", () => {
  syncGameBounds();
  if (!state.active) {
    state.playerX = middleLaneX();
    playerCar.style.left = `${state.playerX}px`;
  } else {
    state.playerX = clampVehicleLeft(state.playerX, vehicleWidth());
    playerCar.style.left = `${state.playerX}px`;
  }
  refreshSpeed();
});

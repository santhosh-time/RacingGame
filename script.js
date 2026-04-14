const gameArea = document.getElementById("gameArea");
const playerCar = document.getElementById("playerCar");
const scoreDisplay = document.getElementById("score");
const speedDisplay = document.getElementById("speedDisplay");
const soundButton = document.getElementById("soundButton");
const startButton = document.getElementById("startButton");
const message = document.getElementById("message");
const vehicleOptions = Array.from(document.querySelectorAll(".vehicle-option"));
const touchHoldButtons = Array.from(document.querySelectorAll("[data-touch-control]"));
const touchTapButtons = Array.from(document.querySelectorAll("[data-touch-tap]"));
const roadLines = Array.from(document.querySelectorAll(".road-line"));

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
const roadWidthMeters = 14;
const targetFramesPerSecond = 60;
const boosterSpawnTop = -140;
const boosterCollectionZoneTop = 340;
const boosterSafetyDistance = 170;

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

async function startEngineSound() {
  if (!state.soundEnabled) {
    return;
  }

  const context = await ensureAudioReady();
  if (!context || audioState.engineStarted) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.type = state.selectedVehicle.startsWith("bike-") ? "sawtooth" : "square";
  oscillator.frequency.value = state.selectedVehicle.startsWith("bike-") ? 120 : 82;
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
  const baseFrequency = state.selectedVehicle.startsWith("bike-") ? 120 : 82;
  const steerBoost = state.keys.ArrowLeft || state.keys.ArrowRight ? 10 : 0;
  const targetFrequency = baseFrequency + state.currentSpeed * 10 + steerBoost;
  const targetGain = state.active ? 0.065 : 0.0001;

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

function lanePositions(width = gameBounds.carWidth) {
  const roadPadding = Math.min(gameBounds.roadPadding, Math.max(14, gameBounds.width * 0.06));
  const usableWidth = gameBounds.width - roadPadding * 2 - width;
  const gap = usableWidth / (laneCount - 1);
  return Array.from({ length: laneCount }, (_, index) =>
    Math.round(roadPadding + gap * index)
  );
}

function middleLaneX() {
  const lanes = lanePositions(vehicleWidth());
  return lanes[Math.floor(lanes.length / 2) - 1];
}

function playerLaneX() {
  const lanes = lanePositions();
  return lanes.reduce((closest, lane) =>
    Math.abs(lane - state.playerX) < Math.abs(closest - state.playerX) ? lane : closest
  );
}

function randomLane(excludedLanes = []) {
  const lanes = lanePositions().filter((lane) => !excludedLanes.includes(lane));
  const choices = lanes.length > 0 ? lanes : lanePositions();
  return choices[Math.floor(Math.random() * choices.length)];
}

function chooseEnemyLane(excludedLanes = [], preferPlayerLane = false) {
  const lanes = lanePositions();
  const availableLanes = lanes.filter((lane) => !excludedLanes.includes(lane));
  const choices = availableLanes.length > 0 ? availableLanes : lanes;
  const targetLane = playerLaneX();

  if (preferPlayerLane && choices.includes(targetLane)) {
    return targetLane;
  }

  if (choices.includes(targetLane) && Math.random() < 0.45) {
    return targetLane;
  }

  return choices[Math.floor(Math.random() * choices.length)];
}

function laneIsSafeForBooster(lane) {
  return state.enemies.every((enemy) => {
    const enemyLane = parseFloat(enemy.style.left);
    const enemyTop = parseFloat(enemy.style.top);
    const predictedGap = Math.abs(enemyTop - boosterCollectionZoneTop);
    return enemyLane !== lane || predictedGap > boosterSafetyDistance;
  });
}

function safeBoosterLane() {
  const lanes = lanePositions();
  const safeLanes = lanes.filter((lane) => laneIsSafeForBooster(lane));
  const choices = safeLanes.length > 0 ? safeLanes : lanes;
  return choices[Math.floor(Math.random() * choices.length)];
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
    audioState.engineOscillator.type = state.selectedVehicle.startsWith("bike-") ? "sawtooth" : "square";
  }
}

function syncVehiclePreviewVisibility() {
  playerCar.classList.toggle("hidden-preview", !message.classList.contains("hidden"));
}

function createEnemy(y, left) {
  const enemy = document.createElement("div");
  enemy.className = "vehicle enemy-car";
  enemy.style.top = `${y}px`;
  enemy.style.left = `${left}px`;
  gameArea.appendChild(enemy);
  return enemy;
}

function resetEnemies() {
  state.enemies.forEach((enemy) => enemy.remove());
  const firstLane = chooseEnemyLane([], true);
  const secondLane = chooseEnemyLane([firstLane], false);
  const thirdLane = chooseEnemyLane([firstLane, secondLane], false);
  state.enemies = [
    createEnemy(-160, firstLane),
    createEnemy(-360, secondLane),
    createEnemy(-560, thirdLane),
  ];
}

function createBooster(y) {
  const booster = document.createElement("div");
  booster.className = "booster";
  booster.style.top = `${y}px`;
  booster.style.left = `${safeBoosterLane()}px`;
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

  const currentLane = parseFloat(state.booster.style.left);
  const currentTop = parseFloat(state.booster.style.top);
  const nearCollectionZone = currentTop > 80 && currentTop < boosterCollectionZoneTop + 60;

  if (nearCollectionZone && !laneIsSafeForBooster(currentLane)) {
    const fallbackLane = safeBoosterLane();
    if (fallbackLane !== currentLane) {
      state.booster.style.left = `${fallbackLane}px`;
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

  const maxX = gameBounds.width - vehicleWidth();
  state.playerX = Math.max(0, Math.min(maxX, state.playerX));
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
    let nextTop = top + state.currentSpeed + 1.2;

    if (nextTop > gameBounds.height) {
      nextTop = -220;
      state.enemyRespawns += 1;
      const occupiedLanes = state.enemies
        .filter((item) => item !== enemy)
        .map((item) => parseFloat(item.style.left));
      const forcePlayerLane = state.enemyRespawns % 2 === 0;
      enemy.style.left = `${chooseEnemyLane(occupiedLanes, forcePlayerLane)}px`;
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
  message.innerHTML = `
    <h2>Crash!</h2>
    <p>Your score: ${state.score}</p>
    <p>Keep your selected vehicle and press Restart Game to try again.</p>
  `;
  message.classList.remove("hidden");
  syncVehiclePreviewVisibility();
}

vehicleOptions.forEach((option) => {
  option.addEventListener("click", () => {
    vehicleOptions.forEach((item) => item.classList.remove("selected"));
    option.classList.add("selected");
    applyVehicleSelection(option.dataset.vehicle);
  });
});

applyVehicleSelection(state.selectedVehicle);
syncGameBounds();
refreshSpeed();
syncVehiclePreviewVisibility();
updateSoundButton();

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
    const maxX = gameBounds.width - vehicleWidth();
    state.playerX = Math.max(0, Math.min(maxX, state.playerX));
    playerCar.style.left = `${state.playerX}px`;
  }
  refreshSpeed();
});

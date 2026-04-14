const gameArea = document.getElementById("gameArea");
const playerCar = document.getElementById("playerCar");
const scoreDisplay = document.getElementById("score");
const speedDisplay = document.getElementById("speedDisplay");
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

const laneCount = 4;
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
const metersPerPixel = roadWidthMeters / gameBounds.width;
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
};

function vehicleWidth() {
  return state.selectedVehicle.startsWith("bike-") ? gameBounds.bikeWidth : gameBounds.carWidth;
}

function refreshSpeed() {
  state.currentSpeed = state.baseSpeed * (boostMultiplier ** state.boostLevel);
  const metersPerSecond = state.currentSpeed * targetFramesPerSecond * metersPerPixel;
  const kmph = Math.round(metersPerSecond * 3.6);
  speedDisplay.textContent = `${kmph} km/h`;
}

function lanePositions(width = gameBounds.carWidth) {
  const usableWidth = gameBounds.width - gameBounds.roadPadding * 2 - width;
  const gap = usableWidth / (laneCount - 1);
  return Array.from({ length: laneCount }, (_, index) =>
    Math.round(gameBounds.roadPadding + gap * index)
  );
}

function middleLaneX() {
  const lanes = lanePositions(vehicleWidth());
  return lanes[Math.floor(lanes.length / 2) - 1];
}

function randomLane(excludedLanes = []) {
  const lanes = lanePositions().filter((lane) => !excludedLanes.includes(lane));
  const choices = lanes.length > 0 ? lanes : lanePositions();
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
  const firstLane = randomLane();
  const secondLane = randomLane([firstLane]);
  state.enemies = [
    createEnemy(-160, firstLane),
    createEnemy(-390, secondLane),
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
      const occupiedLanes = state.enemies
        .filter((item) => item !== enemy)
        .map((item) => parseFloat(item.style.left));
      enemy.style.left = `${randomLane(occupiedLanes)}px`;
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

  updateRoadLines();
  updatePlayer();
  spawnBooster();
  updateEnemies();
  updateBooster();

  state.score += 1;
  scoreDisplay.textContent = String(state.score);
  state.animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
  cancelAnimationFrame(state.animationId);
  state.active = true;
  state.score = 0;
  state.baseSpeed = 4.8;
  state.currentSpeed = 4.8;
  state.boostLevel = 0;
  state.playerX = middleLaneX();
  state.nextBoosterScore = 1000;

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
refreshSpeed();
syncVehiclePreviewVisibility();

startButton.addEventListener("click", startGame);

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

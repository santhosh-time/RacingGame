const gameArea = document.getElementById("gameArea");
const playerCar = document.getElementById("playerCar");
const boostMeter = document.getElementById("boostMeter");
const boostMeterFill = document.getElementById("boostMeterFill");
const scoreDisplay = document.getElementById("score");
const bestScoreDisplay = document.getElementById("bestScore");
const speedDisplay = document.getElementById("speedDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const livesDisplay = document.getElementById("livesDisplay");
const fuelCard = document.getElementById("fuelCard");
const fuelDisplay = document.getElementById("fuelDisplay");
const vehicleSoundButton = document.getElementById("vehicleSoundButton");
const backgroundSoundButton = document.getElementById("backgroundSoundButton");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const message = document.getElementById("message");
const welcomeModal = document.getElementById("welcomeModal");
const welcomeStartButton = document.getElementById("welcomeStartButton");
const welcomeLogo = document.querySelector(".welcome-logo");
const skyCloudLayer = document.getElementById("skyCloudLayer");
const laserPointer = document.getElementById("laserPointer");
const touchHoldButtons = Array.from(document.querySelectorAll("[data-touch-control]"));
const roadLines = Array.from(document.querySelectorAll(".road-line"));
const initialMessageMarkup = message.innerHTML;
const initialPageUrl = window.location.href;
const supabaseProjectUrl = "https://tvmvkjoubttuqnlkdciv.supabase.co";
const supabasePublishableKey = "sb_publishable__allj6AeZXUn1xrfDU317A_f5B01zau";
const supabaseClient = window.supabase?.createClient
  ? window.supabase.createClient(supabaseProjectUrl, supabasePublishableKey)
  : null;

const gameBounds = {
  width: 420,
  height: 640,
  roadPadding: 24,
  carWidth: 48,
  bikeWidth: 30,
  jetWidth: 48,
  birdWidth: 46,
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
  "jet-silver",
  "jet-gold",
  "jet-stealth",
  "plane-private",
  "plane-golden",
  "plane-stealth",
  "ufo-metal",
  "ufo-mercury",
];
const roadEnemyVehicleChoices = [
  "bike-street",
  "bike-speed",
  "bike-dirt",
  "bike-electric",
  "car-sport",
  "car-muscle",
  "car-electric",
  "car-truck",
];
const birdEnemyChoices = [
  "bird-eagle",
  "bird-falcon",
  "bird-gull",
];
const planeEnemyChoices = [
  "plane-private",
  "plane-golden",
  "plane-stealth",
];
const skyCloudAssets = [
  "assets/cloud-realistic-1.svg",
  "assets/cloud-realistic-2.svg",
];
const visibleRoadLengthMeters = 21.33;
const targetFramesPerSecond = 60;
const boosterSpawnTop = -140;
const boosterCollectionZoneTop = 340;
const boosterSafetyDistance = 170;
const boosterWidth = 38;
const missileWidth = 14;
const missileHeight = 30;
const missileLaunchIntervalMs = 260;
const adminSessionKey = "viral-racing-admin";
const adminAccessCode = "viraladmin";
const accessWindowHours = 24;
const maxAccessHours = 48;
const levelOneBaseSpeed = 4.8;
const levelTwoBaseSpeed = 6.94;
const levelTwoTargetSpeed = 11.11;
const levelTwoEndScore = 15000;
const levelTwoWarmupDurationMs = 5000;
const levelThreeTargetBaseSpeed = Number((levelOneBaseSpeed * 2).toFixed(2));
const levelThreeStartSpeed = levelTwoBaseSpeed;
const levelFourStartScore = 25000;
const levelFourBaseSpeed = 9.03;
const levelFourTargetSpeed = 12.5;
const levelFourEndScore = 35000;
const levelFiveStartScore = 35000;
const levelSixStartScore = 45000;
const levelFiveEndScore = levelSixStartScore;
const levelSixEndScore = 70000;
const levelOneEndScore = 8000;
const levelOneTargetKmph = 70;
const levelOneWarmupDurationMs = 5000;
const levelOneWarmupKmph = 25;
const levelTwoWarmupKmph = 35;
const levelTwoTargetKmph = 75;
const levelThreeWarmupDurationMs = 7000;
const levelThreeWarmupKmph = 50;
const levelThreeTargetKmph = 80;
const levelFourWarmupDurationMs = 10000;
const levelFourWarmupKmph = 60;
const levelFourTargetKmph = 85;
const levelFiveWarmupDurationMs = 10000;
const levelFiveWarmupKmph = 65;
const levelFiveTargetKmph = 90;
const finalLevelWarmupKmph = 60;
const finalLevelTargetKmph = 90;
const boostDurationMs = 5000;
const laserDurationMs = 5000;
const laserSpeedMultiplier = 1.5;
const fuelDrainStep = 10;
const fuelPickupRestore = 10;
const airKillBonusScore = 100;
const barricadeSpawnTop = -140;
const barricadeSpawnGap = 1200;

const state = {
  active: false,
  score: 0,
  baseSpeed: 0,
  baseSpeedTarget: 0,
  currentSpeed: 0,
  boostLevel: 0,
  boostActiveUntil: 0,
  selectedVehicle: "bike-street",
  playerX: 0,
  keys: {
    ArrowLeft: false,
    ArrowRight: false,
  },
  enemies: [],
  skyClouds: [],
  nextBoosterScore: 2000,
  animationId: 0,
  vehicleSoundEnabled: false,
  backgroundSoundEnabled: false,
  uiSoundEnabled: false,
  supabaseReady: false,
  user: null,
  cloudSyncActive: false,
  enemyRespawns: 0,
  racerName: "Guest Racer",
  bestScore: 0,
  bestScoreVehicle: "bike-street",
  bestScoreLevel: 1,
  level: 1,
  livesRemaining: 0,
  pickup: null,
  pickupType: "",
  missiles: [],
  barricades: [],
  nextLevelScore: 8000,
  levelStartScore: 0,
  nextLaserScore: 1000,
  nextFuelScore: 8700,
  nextFuelDrainScore: 9000,
  nextBarricadeScore: 9200,
  levelTwoWarmupStartAt: 0,
  levelTwoWarmupUntil: 0,
  levelOneWarmupStartAt: 0,
  levelOneWarmupUntil: 0,
  levelWarmupStartAt: 0,
  levelWarmupUntil: 0,
  laserActiveUntil: 0,
  nextMissileAt: 0,
  invincibleUntil: 0,
  levelFourSelectionOpen: false,
  pointer: {
    x: 210,
    y: 320,
  },
  fuelPercent: 100,
  countdownRunning: false,
  pendingTransition: false,
  reviveRunning: false,
  paused: false,
  accessActive: false,
  accessValidUntil: "",
  accessBusy: false,
  pendingPaymentOrderId: "",
  pendingDonationOrderId: "",
  adminUnlocked: false,
  adminSelectedLevel: 1,
  restartLevel: 1,
  restartVehicle: "bike-street",
  passwordRecoveryMode: false,
  authView: "choice",
  guestReadyVehicle: "",
  entryReady: false,
  lastFrameTime: 0,
};

const audioState = {
  context: null,
  masterGain: null,
  engineGain: null,
  engineOscillator: null,
  engineLowpass: null,
  engineSecondaryGain: null,
  engineSecondaryOscillator: null,
  engineSecondaryFilter: null,
  engineStarted: false,
  waterNoiseSource: null,
  waterNoiseGain: null,
  waterFilter: null,
  waterStarted: false,
  musicTimer: null,
  musicThemeLevel: 0,
  gameOverMusicTimer: null,
  gameOverMusicActive: false,
  primeNode: null,
};

function syncGameBounds() {
  gameBounds.width = gameArea.clientWidth;
  gameBounds.height = gameArea.clientHeight;
}

function updateBestScoreDisplay() {
  bestScoreDisplay.textContent = String(Math.floor(state.bestScore));
}

function updateLevelDisplay() {
  if (levelDisplay) {
    levelDisplay.textContent = String(state.level);
  }
}

function getLivesAwardForLevel(levelNumber = state.level) {
  if (levelNumber === 1) {
    return 5;
  }
  if (levelNumber === 2) {
    return 2;
  }
  if (levelNumber === 3) {
    return 1;
  }
  if (levelNumber === 4) {
    return 2;
  }
  if (levelNumber === 6) {
    return 3;
  }
  if (levelNumber >= 7) {
    return 2;
  }
  return 0;
}

function updateLivesDisplay() {
  if (livesDisplay) {
    livesDisplay.textContent = String(Math.max(0, state.livesRemaining));
  }
}

function laserPickupGap(levelNumber = state.level) {
  return levelNumber >= 6 ? 800 : 1000;
}

function updateFuelDisplay() {
  if (!fuelCard || !fuelDisplay) {
    return;
  }

  const showFuel = state.level >= 3;
  fuelCard.classList.toggle("hidden", !showFuel);
  if (showFuel) {
    fuelDisplay.textContent = `${Math.max(0, Math.round(state.fuelPercent))}%`;
  }
}

function applyLevelTheme() {
  const levelClass = state.level >= 7 ? "level-7" : state.level >= 6 ? "level-6" : state.level >= 5 ? "level-5" : state.level >= 4 ? "level-4" : `level-${state.level}`;
  document.body.classList.remove("level-1", "level-2", "level-3", "level-4", "level-5", "level-6", "level-7");
  gameArea.classList.remove("level-1", "level-2", "level-3", "level-4", "level-5", "level-6", "level-7");
  document.body.classList.add(levelClass);
  gameArea.classList.add(levelClass);
  if (state.level === 6) {
    ensureSkyClouds(true);
  } else {
    clearSkyClouds();
  }
}

function isWaterLevel(levelNumber = state.level) {
  return levelNumber === 4 || levelNumber === 5;
}

function isSkyLevel(levelNumber = state.level) {
  return levelNumber >= 6;
}

function clearSkyClouds() {
  state.skyClouds.forEach((cloud) => cloud.element.remove());
  state.skyClouds = [];
}

function randomSkyCloudMetrics() {
  const sizeBand = Math.random();
  let width = 110;
  if (sizeBand < 0.34) {
    width = 84 + Math.random() * 46;
  } else if (sizeBand < 0.74) {
    width = 130 + Math.random() * 70;
  } else {
    width = 200 + Math.random() * 80;
  }

  return {
    width,
    height: width * (0.34 + Math.random() * 0.08),
    speedFactor: 0.24 + Math.random() * 0.22,
    opacity: 0.45 + Math.random() * 0.35,
    asset: skyCloudAssets[Math.floor(Math.random() * skyCloudAssets.length)],
  };
}

function createSkyCloud(startAbove = false) {
  if (!skyCloudLayer) {
    return null;
  }

  const metrics = randomSkyCloudMetrics();
  const element = document.createElement("div");
  element.className = "sky-cloud";
  element.style.width = `${metrics.width}px`;
  element.style.height = `${metrics.height}px`;
  element.style.opacity = String(metrics.opacity);
  element.style.backgroundImage = `url("${metrics.asset}")`;

  const x = Math.random() * Math.max(12, gameBounds.width - metrics.width - 12);
  const y = startAbove
    ? -metrics.height - Math.random() * gameBounds.height
    : Math.random() * (gameBounds.height - metrics.height);

  element.style.transform = `translate(${x}px, ${y}px)`;
  skyCloudLayer.appendChild(element);

  return {
    element,
    x,
    y,
    width: metrics.width,
    height: metrics.height,
    speedFactor: metrics.speedFactor,
  };
}

function ensureSkyClouds(reset = false) {
  if (!isSkyLevel() || !skyCloudLayer) {
    clearSkyClouds();
    return;
  }

  if (reset) {
    clearSkyClouds();
  }

  while (state.skyClouds.length < 10) {
    const cloud = createSkyCloud(state.skyClouds.length >= 4);
    if (!cloud) {
      break;
    }
    state.skyClouds.push(cloud);
  }
}

function recycleSkyCloud(cloud) {
  const metrics = randomSkyCloudMetrics();
  cloud.width = metrics.width;
  cloud.height = metrics.height;
  cloud.speedFactor = metrics.speedFactor;
  cloud.x = Math.random() * Math.max(12, gameBounds.width - metrics.width - 12);
  cloud.y = -metrics.height - Math.random() * 180;
  cloud.element.style.width = `${metrics.width}px`;
  cloud.element.style.height = `${metrics.height}px`;
  cloud.element.style.opacity = String(metrics.opacity);
  cloud.element.style.backgroundImage = `url("${metrics.asset}")`;
  cloud.element.style.transform = `translate(${cloud.x}px, ${cloud.y}px)`;
}

function updateSkyClouds(deltaFrames = 1) {
  if (!isSkyLevel()) {
    clearSkyClouds();
    return;
  }

  ensureSkyClouds();

  const baseDrift = Math.max(0.55, state.currentSpeed * 0.14);
  state.skyClouds.forEach((cloud) => {
    cloud.y += baseDrift * cloud.speedFactor * deltaFrames;
    cloud.element.style.transform = `translate(${cloud.x}px, ${cloud.y}px)`;
    if (cloud.y > gameBounds.height + 24) {
      recycleSkyCloud(cloud);
    }
  });
}

function updatePlayerInvincibility() {
  const invincible = Date.now() < state.invincibleUntil;
  playerCar.classList.toggle("is-invincible", invincible);
}

function getCurrentKmph() {
  const metersPerPixel = visibleRoadLengthMeters / gameBounds.height;
  const metersPerSecond = state.currentSpeed * targetFramesPerSecond * metersPerPixel;
  const realKmph = Math.round(metersPerSecond * 3.6);
  if (state.level === 6) {
    return realKmph * 10;
  }
  if (state.level >= 7) {
    return realKmph * 1000;
  }
  return realKmph;
}

function gameSpeedForKmph(targetKmph) {
  const trackHeight = Math.max(gameBounds.height || 0, 640);
  const metersPerPixel = visibleRoadLengthMeters / trackHeight;
  const pixelsPerSecond = (targetKmph / 3.6) / Math.max(metersPerPixel, 0.0001);
  return pixelsPerSecond / targetFramesPerSecond;
}

function levelWarmupDuration(levelNumber) {
  if (levelNumber === 1 || levelNumber === 2) {
    return 5000;
  }
  if (levelNumber === 3) {
    return levelThreeWarmupDurationMs;
  }
  if (levelNumber === 4) {
    return levelFourWarmupDurationMs;
  }
  if (levelNumber >= 5) {
    return levelFiveWarmupDurationMs;
  }
  return levelOneWarmupDurationMs;
}

function levelWarmupKmph(levelNumber) {
  if (levelNumber === 1) {
    return levelOneWarmupKmph;
  }
  if (levelNumber === 2) {
    return levelTwoWarmupKmph;
  }
  if (levelNumber === 3) {
    return levelThreeWarmupKmph;
  }
  if (levelNumber === 4) {
    return levelFourWarmupKmph;
  }
  if (levelNumber === 6) {
    return levelFiveWarmupKmph;
  }
  if (levelNumber >= 7) {
    return finalLevelWarmupKmph;
  }
  if (levelNumber >= 5) {
    return levelFiveWarmupKmph;
  }
  return levelOneWarmupKmph;
}

function levelMaxKmph(levelNumber) {
  if (levelNumber === 1) {
    return levelOneTargetKmph;
  }
  if (levelNumber === 2) {
    return levelTwoTargetKmph;
  }
  if (levelNumber === 3) {
    return levelThreeTargetKmph;
  }
  if (levelNumber === 4) {
    return levelFourTargetKmph;
  }
  if (levelNumber === 6) {
    return levelFiveTargetKmph;
  }
  if (levelNumber >= 7) {
    return finalLevelTargetKmph;
  }
  if (levelNumber >= 5) {
    return levelFiveTargetKmph;
  }
  return levelOneTargetKmph;
}

function levelEndScore(levelNumber) {
  if (levelNumber === 1) {
    return levelOneEndScore;
  }
  if (levelNumber === 2) {
    return levelTwoEndScore;
  }
  if (levelNumber === 3) {
    return levelFourStartScore;
  }
  if (levelNumber === 4) {
    return levelFiveStartScore;
  }
  if (levelNumber === 5) {
    return levelFiveEndScore;
  }
  if (levelNumber === 6) {
    return levelSixEndScore;
  }
  if (levelNumber >= 7) {
    return 0;
  }
  return 0;
}

function getDeltaFrames(frameTime) {
  if (!state.lastFrameTime) {
    state.lastFrameTime = frameTime;
    return 1;
  }

  const elapsedMs = Math.max(0, frameTime - state.lastFrameTime);
  state.lastFrameTime = frameTime;
  return Math.max(0.5, Math.min(2.5, elapsedMs / (1000 / targetFramesPerSecond)));
}

function overlayRefs() {
  return {
    racerGate: document.getElementById("racerGate"),
    vehicleSetup: document.getElementById("vehicleSetup"),
    guestRaceReady: document.getElementById("guestRaceReady"),
    guestRaceReadyText: document.getElementById("guestRaceReadyText"),
    authChoicePanel: document.getElementById("authChoicePanel"),
    authForm: document.getElementById("authForm"),
    authEmailInput: document.getElementById("authEmailInput"),
    authPasswordInput: document.getElementById("authPasswordInput"),
    authRacerNameInput: document.getElementById("authRacerNameInput"),
    authStatus: document.getElementById("authStatus"),
    showSignInButton: document.getElementById("showSignInButton"),
    backToChoiceButton: document.getElementById("backToChoiceButton"),
    forgotPasswordButton: document.getElementById("forgotPasswordButton"),
    passwordResetPanel: document.getElementById("passwordResetPanel"),
    resetPasswordInput: document.getElementById("resetPasswordInput"),
    resetPasswordConfirmInput: document.getElementById("resetPasswordConfirmInput"),
    resetPasswordButton: document.getElementById("resetPasswordButton"),
    cancelResetPasswordButton: document.getElementById("cancelResetPasswordButton"),
    sessionModeText: document.getElementById("sessionModeText"),
    cloudStatus: document.getElementById("cloudStatus"),
    supportPanel: document.getElementById("supportPanel"),
    supportDonationAmountInput: document.getElementById("supportDonationAmountInput"),
    supportDonationButton: document.getElementById("supportDonationButton"),
    profileNameInput: document.getElementById("profileNameInput"),
    saveProfileButton: document.getElementById("saveProfileButton"),
    signOutButton: document.getElementById("signOutButton"),
    deleteProfileButton: document.getElementById("deleteProfileButton"),
    feedbackToggleButton: document.getElementById("feedbackToggleButton"),
    feedbackPanel: document.getElementById("feedbackPanel"),
    feedbackRatingInput: document.getElementById("feedbackRatingInput"),
    feedbackMessageInput: document.getElementById("feedbackMessageInput"),
    feedbackEmailInput: document.getElementById("feedbackEmailInput"),
    feedbackStatus: document.getElementById("feedbackStatus"),
    sendFeedbackButton: document.getElementById("sendFeedbackButton"),
    cancelFeedbackButton: document.getElementById("cancelFeedbackButton"),
    adminToggleButton: document.getElementById("adminToggleButton"),
    adminPanel: document.getElementById("adminPanel"),
    adminLoginSection: document.getElementById("adminLoginSection"),
    adminLevelSection: document.getElementById("adminLevelSection"),
    adminPasswordInput: document.getElementById("adminPasswordInput"),
    adminUnlockButton: document.getElementById("adminUnlockButton"),
    adminCloseButton: document.getElementById("adminCloseButton"),
    adminLevelButtons: Array.from(document.querySelectorAll(".admin-level-button")),
    adminPlayButton: document.getElementById("adminPlayButton"),
    adminLockButton: document.getElementById("adminLockButton"),
    adminStatus: document.getElementById("adminStatus"),
    signInButton: document.getElementById("signInButton"),
    signUpButton: document.getElementById("signUpButton"),
    guestButton: document.getElementById("guestButton"),
    guestRaceStartButton: document.getElementById("guestRaceStartButton"),
    guestRaceBackButton: document.getElementById("guestRaceBackButton"),
    vehicleOptions: Array.from(document.querySelectorAll(".vehicle-option")),
  };
}

function dismissWelcomeModal() {
  welcomeModal?.classList.add("hidden");
}

function anySoundEnabled() {
  return state.vehicleSoundEnabled || state.backgroundSoundEnabled || state.uiSoundEnabled;
}

function triggerWelcomeStart() {
  if (welcomeModal?.classList.contains("hidden")) {
    return;
  }

  state.entryReady = true;
  dismissWelcomeModal();
  playUiWhooshSound();
  window.setTimeout(() => {
    showAuthGate();
  }, 120);
}

function setAuthView(viewName = "choice") {
  state.authView = viewName;
  const {
    racerGate,
    authChoicePanel,
    authForm,
    authEmailInput,
    showSignInButton,
    guestButton,
  } = overlayRefs();

  const showChoice = viewName === "choice";
  message.classList.toggle("choice-mode", showChoice);
  racerGate?.classList.toggle("choice-view", showChoice);
  authChoicePanel?.classList.toggle("hidden", !showChoice);
  authForm?.classList.toggle("hidden", showChoice);

  window.setTimeout(() => {
    if (showChoice) {
      guestButton?.focus();
    } else {
      authEmailInput?.focus();
      if (!authEmailInput) {
        showSignInButton?.focus();
      }
    }
  }, 40);
}

function bindElementOnce(element, bindingKey, eventName, handler) {
  if (!element) {
    return;
  }

  const marker = `bound${bindingKey}`;
  if (element.dataset[marker] === "true") {
    return;
  }

  element.addEventListener(eventName, handler);
  element.dataset[marker] = "true";
}

function updateCloudStatus(messageText, isReady = false) {
  const { cloudStatus } = overlayRefs();
  if (!cloudStatus) {
    return;
  }

  cloudStatus.textContent = messageText;
  cloudStatus.classList.toggle("is-connected", isReady);
  cloudStatus.classList.toggle("is-error", !isReady);
}

function isGuestRacerName(name = state.racerName) {
  return !name || name.trim().toLowerCase() === "guest racer";
}

function hasAdminAccess() {
  try {
    return window.sessionStorage.getItem(adminSessionKey) === "true";
  } catch {
    return false;
  }
}

function setAdminAccess(enabled) {
  try {
    if (enabled) {
      window.sessionStorage.setItem(adminSessionKey, "true");
    } else {
      window.sessionStorage.removeItem(adminSessionKey);
    }
  } catch {
    // Keep local admin testing available only when storage works.
  }
  state.adminUnlocked = enabled;
}

function defaultRacerNameForUser(user = state.user) {
  const metadataName = user?.user_metadata?.racer_name;
  if (metadataName && String(metadataName).trim()) {
    return String(metadataName).trim();
  }

  const emailName = user?.email?.split("@")[0];
  if (emailName && emailName.trim()) {
    return emailName.trim().slice(0, 18);
  }

  return "Road Rider";
}

function updateAuthStatus(messageText, isReady = false) {
  const { authStatus } = overlayRefs();
  if (!authStatus) {
    return;
  }

  authStatus.textContent = messageText;
  authStatus.classList.toggle("is-connected", isReady);
}

function getAuthRedirectUrl() {
  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    return `${window.location.origin}${window.location.pathname}`;
  }

  return "https://santhosh-time.github.io/RacingGame/";
}

function hasPasswordRecoveryHash() {
  const rawHash = initialPageUrl.includes("#") ? initialPageUrl.slice(initialPageUrl.indexOf("#")) : "";
  const rawSearchStart = initialPageUrl.indexOf("?");
  const rawSearchEnd = initialPageUrl.includes("#") ? initialPageUrl.indexOf("#") : initialPageUrl.length;
  const rawSearch = rawSearchStart >= 0 ? initialPageUrl.slice(rawSearchStart, rawSearchEnd) : "";
  const hash = rawHash || window.location.hash || "";
  const search = rawSearch || window.location.search || "";

  if (hash.includes("type=recovery") || search.includes("type=recovery")) {
    return true;
  }

  return hash.includes("access_token=") && hash.includes("refresh_token=");
}

function setPasswordRecoveryMode(isActive) {
  state.passwordRecoveryMode = isActive;
  const {
    authChoicePanel,
    authPasswordInput,
    authRacerNameInput,
    signInButton,
    signUpButton,
    backToChoiceButton,
    forgotPasswordButton,
    passwordResetPanel,
    resetPasswordInput,
    resetPasswordConfirmInput,
  } = overlayRefs();

  authPasswordInput?.closest(".field")?.classList.toggle("hidden", isActive);
  authRacerNameInput?.closest(".field")?.classList.toggle("hidden", isActive);
  signInButton?.classList.toggle("hidden", isActive);
  signUpButton?.classList.toggle("hidden", isActive);
  backToChoiceButton?.classList.toggle("hidden", isActive);
  forgotPasswordButton?.classList.toggle("hidden", isActive);
  passwordResetPanel?.classList.toggle("hidden", !isActive);
  authChoicePanel?.classList.toggle("hidden", isActive || state.authView !== "choice");

  if (isActive) {
    state.authView = "signin";
    if (resetPasswordInput) {
      resetPasswordInput.value = "";
    }
    if (resetPasswordConfirmInput) {
      resetPasswordConfirmInput.value = "";
    }
  }
}

function updateGuestAccessUI() {
  const { guestButton, authStatus } = overlayRefs();
  if (!guestButton) {
    return;
  }

  guestButton.disabled = false;
  guestButton.textContent = "Play As Guest";
  if (!state.user && authStatus && state.authView === "choice") {
    updateAuthStatus("Choose guest mode for a quick ride, or sign in to save your progress.", true);
  }
}

function updateFeedbackStatus(messageText, isReady = false) {
  const { feedbackStatus } = overlayRefs();
  if (!feedbackStatus) {
    return;
  }

  feedbackStatus.textContent = messageText;
  feedbackStatus.classList.toggle("is-connected", isReady);
}

function updateAdminStatus(messageText, isReady = false) {
  const { adminStatus } = overlayRefs();
  if (!adminStatus) {
    return;
  }

  adminStatus.textContent = messageText;
  adminStatus.classList.toggle("is-connected", isReady);
}

function updateAdminUI() {
  const {
    adminPanel,
    adminLoginSection,
    adminLevelSection,
    adminPasswordInput,
    adminLevelButtons,
  } = overlayRefs();

  if (!adminPanel) {
    return;
  }

  adminLoginSection?.classList.toggle("hidden", state.adminUnlocked);
  adminLevelSection?.classList.toggle("hidden", !state.adminUnlocked);

  adminLevelButtons.forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.adminLevel) === state.adminSelectedLevel);
  });

  if (!state.adminUnlocked && adminPasswordInput) {
    adminPasswordInput.value = "";
    updateAdminStatus("Admin level jump is for local testing.", false);
  } else {
    updateAdminStatus(`Admin ready. Level ${state.adminSelectedLevel} is selected.`, true);
  }
}

function toggleAdminPanel(showPanel) {
  const { adminPanel, adminPasswordInput } = overlayRefs();
  if (!adminPanel) {
    return;
  }

  adminPanel.classList.toggle("hidden", !showPanel);
  updateAdminUI();
  if (showPanel && !state.adminUnlocked) {
    adminPasswordInput?.focus();
  }
}

function unlockAdminMode() {
  const { adminPasswordInput } = overlayRefs();
  const enteredCode = adminPasswordInput?.value?.trim() || "";

  if (!enteredCode) {
    updateAdminStatus("Enter the admin code to unlock level jump.", false);
    return;
  }

  if (enteredCode !== adminAccessCode) {
    updateAdminStatus("That admin code did not match.", false);
    return;
  }

  setAdminAccess(true);
  updateAdminUI();
}

function closeAdminPanel() {
  toggleAdminPanel(false);
}

function lockAdminPanel() {
  toggleAdminPanel(false);
}

function formatAccessExpiry(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getAccessExpiryMs() {
  if (!state.accessValidUntil) {
    return 0;
  }

  const expiryMs = new Date(state.accessValidUntil).getTime();
  return Number.isNaN(expiryMs) ? 0 : expiryMs;
}

function getRenewalAvailableAtMs() {
  if (!state.accessActive) {
    return 0;
  }

  const expiryMs = getAccessExpiryMs();
  if (!expiryMs) {
    return 0;
  }

  return expiryMs - accessWindowHours * 60 * 60 * 1000;
}

function hasReachedAccessExtensionLimit() {
  if (!state.accessActive) {
    return false;
  }

  return getRenewalAvailableAtMs() > Date.now() + 1000;
}

function updateAccessUI() {
  const { accessPanel, accessStatus, payAccessButton, refreshAccessButton } = overlayRefs();
  if (!accessPanel || !accessStatus || !payAccessButton || !refreshAccessButton) {
    return;
  }

  if (!state.user) {
    accessPanel.classList.add("hidden");
    startButton.disabled = false;
    return;
  }

  accessPanel.classList.remove("hidden");
  const expiryText = formatAccessExpiry(state.accessValidUntil);
  const renewalAvailableText = formatAccessExpiry(new Date(getRenewalAvailableAtMs()).toISOString());
  accessStatus.textContent = state.accessActive
    ? hasReachedAccessExtensionLimit()
      ? `${state.racerName}, your pass is active until ${expiryText}. You can renew again after ${renewalAvailableText}.`
      : `${state.racerName}, your paid pass is active until ${expiryText}.`
    : expiryText
      ? `${state.racerName}, your last pass expired. Pay Rs.1 to reactivate until 24 hours from payment.`
      : `${state.racerName}, pay Rs.1 to unlock 24 hours of signed-in play. Your scores and profile stay saved either way.`;

  payAccessButton.disabled = state.accessBusy;
  refreshAccessButton.disabled = state.accessBusy;
  if (hasReachedAccessExtensionLimit()) {
    payAccessButton.disabled = true;
    payAccessButton.textContent = "Renew Later";
  } else {
    payAccessButton.textContent = state.accessActive ? "Extend Another 24 Hours" : "Pay Rs.1 for 24 Hours";
  }
  startButton.disabled = false;
}

function formatPaymentError(error) {
  const message = String(error?.message || "").toLowerCase();

  if (message.includes("failed to send a request to the edge function")) {
    return "The payment lane is not live yet. Give it a moment and try again.";
  }

  if (message.includes("payment cancelled")) {
    return "Payment was cancelled before the pass was activated.";
  }

  return "We could not activate your 24-hour pass right now. Try again in a moment.";
}

function formatDonationError(error) {
  const message = String(error?.message || "").toLowerCase();

  if (message.includes("failed to send a request to the edge function")) {
    return "The donation lane is not live yet. Give it a moment and try again.";
  }

  if (message.includes("payment cancelled")) {
    return "Donation was cancelled before it was completed.";
  }

  return "We could not complete the donation right now. Try again in a moment.";
}

async function readFunctionErrorMessage(error, fallbackMessage) {
  const context = error?.context;
  if (!context || typeof context.clone !== "function") {
    return formatPaymentError(error) || fallbackMessage;
  }

  try {
    const payload = await context.clone().json();
    if (payload?.error) {
      return String(payload.error);
    }
  } catch {
    try {
      const text = await context.clone().text();
      if (text && text.trim()) {
        return text.trim();
      }
    } catch {
      return formatPaymentError(error) || fallbackMessage;
    }
  }

  return formatPaymentError(error) || fallbackMessage;
}

function resetFeedbackForm() {
  const {
    feedbackRatingInput,
    feedbackMessageInput,
    feedbackEmailInput,
  } = overlayRefs();

  if (feedbackRatingInput) {
    feedbackRatingInput.value = "5";
  }
  if (feedbackMessageInput) {
    feedbackMessageInput.value = "";
  }
  if (feedbackEmailInput) {
    feedbackEmailInput.value = state.user?.email || "";
  }

  updateFeedbackStatus("Your feedback helps us tune the next ride.", true);
}

function toggleFeedbackPanel(showPanel) {
  const { feedbackPanel, feedbackToggleButton } = overlayRefs();
  if (!feedbackPanel || !feedbackToggleButton) {
    return;
  }

  feedbackPanel.classList.toggle("hidden", !showPanel);
  feedbackToggleButton.classList.toggle("hidden", showPanel);

  if (showPanel) {
    resetFeedbackForm();
  }
}

function formatFeedbackError(error) {
  const message = String(error?.message || "").toLowerCase();
  const name = String(error?.name || "").toLowerCase();

  if (message.includes("failed to send a request to the edge function")) {
    return "The feedback garage is not live yet. Give it another moment and try again.";
  }

  if (name.includes("function") || message.includes("function")) {
    return "We could not deliver your feedback just yet. Try again in a moment.";
  }

  return "We could not send your feedback right now. Try again in a moment.";
}

function withTimeout(promise, timeoutMs = 6000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error("Timed out while connecting to Supabase.")), timeoutMs);
    }),
  ]);
}

function formatSupabaseError(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage;
  }

  const message = String(error.message || "").toLowerCase();
  const code = String(error.code || "").toLowerCase();

  if (message.includes("invalid login credentials") || code === "invalid_credentials") {
    return "That email or password does not match. Try again and we'll get you back on the road.";
  }

  if (message.includes("email not confirmed")) {
    return "Check your email and confirm your account before signing in.";
  }

  if (message.includes("user already registered")) {
    return "That email is already in the garage. Try signing in instead.";
  }

  if (message.includes("password should be at least")) {
    return "Pick a stronger password with at least 6 characters.";
  }

  if (message.includes("invalid email")) {
    return "That email address does not look right. Please check it and try again.";
  }

  const parts = [error.message, error.details, error.hint, error.code]
    .filter(Boolean)
    .map((part) => String(part).trim())
    .filter(Boolean);

  return parts.length > 0 ? `We hit a cloud save issue: ${parts.join(" | ")}` : fallbackMessage;
}

async function initializeSupabase() {
  if (!supabaseClient) {
    updateCloudStatus("Cloud save is not available right now.", false);
    return;
  }

  state.passwordRecoveryMode = hasPasswordRecoveryHash();
  updateCloudStatus("Cloud save is ready whenever you want to sign in.", true);

  try {
    const { data, error } = await withTimeout(supabaseClient.auth.getSession());

    if (error) {
      throw error;
    }

    state.supabaseReady = true;
    updateCloudStatus("Your cloud garage is ready.", true);

    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        state.user = session?.user || null;
        state.cloudSyncActive = Boolean(state.user);
        showAuthGate();
        setPasswordRecoveryMode(true);
        updateAuthStatus("Set your new password below to get back into your garage.", false);
        const { resetPasswordInput } = overlayRefs();
        window.setTimeout(() => resetPasswordInput?.focus(), 120);
        return;
      }

      handleSessionChange(session);
    });

    if (data?.session && state.passwordRecoveryMode) {
      state.user = data.session.user || null;
      state.cloudSyncActive = Boolean(state.user);
      showAuthGate();
      setPasswordRecoveryMode(true);
      updateAuthStatus("Set your new password below to get back into your garage.", false);
      const { resetPasswordInput } = overlayRefs();
      window.setTimeout(() => resetPasswordInput?.focus(), 120);
      if (window.history?.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
    } else if (data?.session) {
      await handleSessionChange(data.session);
    } else {
      state.user = null;
      state.cloudSyncActive = false;
      updateAuthStatus("Sign in to keep your racer profile and best score updated, or play as a guest.", true);
      showAuthGate();
      showGuestProfileEditor();
    }
  } catch (error) {
    state.supabaseReady = false;
    state.cloudSyncActive = false;
    updateCloudStatus(
      formatSupabaseError(error, "We could not connect to cloud save yet."),
      false
    );
    console.error("Supabase initialization error:", error);
  }
}

async function loadProfile() {
  if (!state.supabaseReady || !supabaseClient || !state.user) {
    return;
  }

  updateCloudStatus(`Checking ${state.racerName}'s garage...`, false);

  try {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("racer_name, best_score, favorite_vehicle, best_score_vehicle, best_score_level")
      .eq("user_id", state.user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      const starterName = defaultRacerNameForUser();
      const { error: upsertError } = await supabaseClient
        .from("profiles")
        .upsert({
          user_id: state.user.id,
          racer_name: starterName,
          best_score: 0,
          favorite_vehicle: state.selectedVehicle,
          best_score_vehicle: state.selectedVehicle,
          best_score_level: 1,
        }, { onConflict: "user_id" });

      if (upsertError) {
        throw upsertError;
      }

      const { data: createdProfile, error: createdProfileError } = await supabaseClient
        .from("profiles")
        .select("racer_name, best_score, favorite_vehicle, best_score_vehicle, best_score_level")
        .eq("user_id", state.user.id)
        .maybeSingle();

      if (createdProfileError) {
        throw createdProfileError;
      }

      state.racerName = createdProfile?.racer_name || starterName;
      state.bestScore = Number(createdProfile?.best_score) || 0;
      state.bestScoreVehicle = vehicleClasses.includes(createdProfile?.best_score_vehicle)
        ? createdProfile.best_score_vehicle
        : (vehicleClasses.includes(createdProfile?.favorite_vehicle) ? createdProfile.favorite_vehicle : state.selectedVehicle);
      state.bestScoreLevel = Math.max(1, Number(createdProfile?.best_score_level) || 1);
      if (createdProfile?.favorite_vehicle && vehicleClasses.includes(createdProfile.favorite_vehicle)) {
        applyVehicleSelection(createdProfile.favorite_vehicle);
      }
      updateBestScoreDisplay();
      updateProfileInputs();
      updateSessionModeText();
      updateCloudStatus(`${state.racerName}, your best score is ${state.bestScore} for now. Let's set a new record.`, true);
      return;
    }

    state.racerName = data.racer_name || defaultRacerNameForUser();
    state.bestScore = Number(data.best_score) || 0;
    state.bestScoreVehicle = vehicleClasses.includes(data.best_score_vehicle)
      ? data.best_score_vehicle
      : (vehicleClasses.includes(data.favorite_vehicle) ? data.favorite_vehicle : state.selectedVehicle);
    state.bestScoreLevel = Math.max(1, Number(data.best_score_level) || 1);
    if (data.favorite_vehicle && vehicleClasses.includes(data.favorite_vehicle)) {
      applyVehicleSelection(data.favorite_vehicle);
    }
    updateBestScoreDisplay();
    updateProfileInputs();
    updateSessionModeText();
    updateCloudStatus(`${state.racerName}, your best score is ${state.bestScore}.`, true);
  } catch (error) {
    updateCloudStatus(
      formatSupabaseError(error, "We could not load your profile yet."),
      false
    );
    updateAuthStatus("We could not open your saved progress yet. You can still play as a guest for now.", false);
    console.error("Supabase profile load error:", error);
  }
}

async function saveCloudBestScore() {
  if (!state.supabaseReady || !supabaseClient || !state.cloudSyncActive || !state.user) {
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("profiles")
      .upsert({
        user_id: state.user.id,
        racer_name: state.racerName,
        best_score: state.bestScore,
        best_score_vehicle: state.bestScoreVehicle,
        best_score_level: state.bestScoreLevel,
        favorite_vehicle: state.selectedVehicle,
      }, { onConflict: "user_id" });

    if (error) {
      throw error;
    }

    updateCloudStatus(`${state.racerName}, your new best score ${state.bestScore} has been saved.`, true);
  } catch (error) {
    updateCloudStatus(
      formatSupabaseError(error, "We could not save your best score right now."),
      false
    );
    console.error("Supabase save error:", error);
  }
}

async function saveProfileName() {
  if (!state.user || !supabaseClient) {
    return;
  }

  const { profileNameInput } = overlayRefs();
  const nextName = profileNameInput?.value?.trim();

  if (!nextName) {
    updateCloudStatus("Enter a racer name before saving your profile.", false);
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("profiles")
      .upsert({
        user_id: state.user.id,
        racer_name: nextName,
        best_score: state.bestScore,
        best_score_vehicle: state.bestScoreVehicle,
        best_score_level: state.bestScoreLevel,
        favorite_vehicle: state.selectedVehicle,
      }, { onConflict: "user_id" });

    if (error) {
      throw error;
    }

    state.racerName = nextName;
    updateSessionModeText();
    updateCloudStatus(`Your racer name is now ${state.racerName}.`, true);
  } catch (error) {
    updateCloudStatus(formatSupabaseError(error, "We could not save your racer name."), false);
    console.error("Supabase profile name save error:", error);
  }
}

async function loadAccessPass() {
  if (!state.user || !supabaseClient) {
    state.accessActive = false;
    state.accessValidUntil = "";
    updateAccessUI();
    return;
  }

  state.accessBusy = true;
  updateAccessUI();

  try {
    const { data, error } = await supabaseClient
      .from("access_passes")
      .select("payment_status, valid_until")
      .eq("user_id", state.user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const validUntil = data?.valid_until || "";
    const validDate = validUntil ? new Date(validUntil) : null;
    state.accessValidUntil = validUntil;
    state.accessActive = Boolean(
      data &&
      data.payment_status === "paid" &&
      validDate &&
      !Number.isNaN(validDate.getTime()) &&
      validDate.getTime() > Date.now()
    );
  } catch (error) {
    state.accessActive = false;
    updateCloudStatus(formatSupabaseError(error, "We could not check your paid access yet."), false);
    console.error("Supabase access pass load error:", error);
  } finally {
    state.accessBusy = false;
    updateAccessUI();
  }
}

async function openPaidAccessCheckout() {
  if (!state.user || !supabaseClient || state.accessBusy) {
    return;
  }

  if (hasReachedAccessExtensionLimit()) {
    const renewalAvailableText = formatAccessExpiry(new Date(getRenewalAvailableAtMs()).toISOString());
    updateCloudStatus(`Your pass is already stacked ahead. You can renew again after ${renewalAvailableText}.`, false);
    updateAccessUI();
    return;
  }

  if (typeof window.Razorpay !== "function") {
    updateCloudStatus("The payment gate is not ready yet. Reload and try again.", false);
    return;
  }

  state.accessBusy = true;
  updateAccessUI();
  updateCloudStatus("Opening the Rs.1 access gate...", false);

  try {
    const { data, error } = await supabaseClient.functions.invoke("create-payment-order", {
      body: {
        amountPaise: 100,
      },
    });

    if (error) {
      throw error;
    }

    const checkout = new window.Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      name: "Viral Racing Game",
      description: "24-hour play access",
      order_id: data.orderId,
      handler: async (response) => {
        state.pendingPaymentOrderId = "";
        try {
          const { error: verifyError } = await supabaseClient.functions.invoke("verify-payment", {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
          });

          if (verifyError) {
            throw verifyError;
          }

          await loadAccessPass();
          updateCloudStatus("Payment received. Your 24-hour pass is now live.", true);
        } catch (verificationError) {
          updateCloudStatus(
            await readFunctionErrorMessage(
              verificationError,
              "We could not activate your 24-hour pass right now. Try again in a moment.",
            ),
            false,
          );
          console.error("Razorpay verify error:", verificationError);
        }
      },
      prefill: {
        email: state.user.email || "",
        name: state.racerName,
      },
      theme: {
        color: "#ffd166",
      },
      modal: {
        ondismiss: async () => {
          if (state.pendingPaymentOrderId) {
            try {
              await supabaseClient.functions.invoke("cancel-payment-order", {
                body: {
                  razorpay_order_id: state.pendingPaymentOrderId,
                },
              });
            } catch (cancelError) {
              console.error("Razorpay cancel tracking error:", cancelError);
            }
            state.pendingPaymentOrderId = "";
          }
          state.accessBusy = false;
          updateAccessUI();
          updateCloudStatus("Payment window closed. Your pass has not changed.", true);
        },
      },
    });

    state.pendingPaymentOrderId = data.orderId;
    checkout.open();
  } catch (error) {
    state.pendingPaymentOrderId = "";
    updateCloudStatus(
      await readFunctionErrorMessage(
        error,
        "We could not activate your 24-hour pass right now. Try again in a moment.",
      ),
      false,
    );
    console.error("Razorpay create order error:", error);
    state.accessBusy = false;
    updateAccessUI();
  }
}

async function openDonationCheckout(options = {}) {
  if (!supabaseClient) {
    if (options.signedIn) {
      updateCloudStatus("Donation is not ready yet. Reload the game and try again.", false);
    } else {
      updateAuthStatus("Donation is not ready yet. Reload the game and try again.", false);
    }
    return;
  }

  if (typeof window.Razorpay !== "function") {
    if (options.signedIn) {
      updateCloudStatus("The donation gate is not ready yet. Reload and try again.", false);
    } else {
      updateAuthStatus("The donation gate is not ready yet. Reload and try again.", false);
    }
    return;
  }

  const {
    guestDonationAmountInput,
    supportDonationAmountInput,
    authEmailInput,
    authRacerNameInput,
  } = overlayRefs();
  const isSignedInSupport = Boolean(options.signedIn);
  const donationAmountInput = options.amountInputOverride
    || (isSignedInSupport ? supportDonationAmountInput : guestDonationAmountInput);
  const donationButton = options.buttonOverride
    || document.getElementById(isSignedInSupport ? "supportDonationButton" : "guestDonationButton");
  const updateDonationStatus = (messageText, isReady = false) => {
    if (isSignedInSupport) {
      updateCloudStatus(messageText, isReady);
    } else {
      updateAuthStatus(messageText, isReady);
    }
  };
  const amountRupees = Number(donationAmountInput?.value || 0);
  const amountPaise = Math.round(amountRupees * 100);
  const donorEmail = state.user?.email || authEmailInput?.value?.trim() || "";
  const donorName = isSignedInSupport
    ? (state.racerName || "Road Rider")
    : (authRacerNameInput?.value?.trim() || "Guest Racer");

  if (!Number.isFinite(amountRupees) || amountRupees < 1) {
    updateDonationStatus("Enter a donation amount of at least Rs.1.", false);
    return;
  }

  if (donationButton) {
    donationButton.disabled = true;
  }

  updateDonationStatus("Opening the donation lane...", false);

  try {
    const { data, error } = await supabaseClient.functions.invoke("create-donation-order", {
      body: {
        amountPaise,
        donorName,
        donorEmail,
      },
    });

    if (error) {
      throw error;
    }

    const checkout = new window.Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      name: "Viral Racing Game",
      description: "Support donation",
      order_id: data.orderId,
      handler: async (response) => {
        state.pendingDonationOrderId = "";
        try {
          const { error: verifyError } = await supabaseClient.functions.invoke("verify-donation-payment", {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
          });

          if (verifyError) {
            throw verifyError;
          }

          updateDonationStatus(`Thank you, ${donorName}. Your donation helps keep the game moving.`, true);
        } catch (verificationError) {
          updateDonationStatus(
            await readFunctionErrorMessage(
              verificationError,
              "We received the donation attempt, but could not confirm it just yet.",
            ),
            false,
          );
          console.error("Razorpay donation verify error:", verificationError);
        } finally {
          if (donationButton) {
            donationButton.disabled = false;
          }
        }
      },
      prefill: {
        email: donorEmail,
        name: donorName,
      },
      theme: {
        color: "#83f0b2",
      },
      modal: {
        ondismiss: () => {
          state.pendingDonationOrderId = "";
          if (donationButton) {
            donationButton.disabled = false;
          }
          updateDonationStatus(
            isSignedInSupport
              ? "Donation window closed. You can keep racing anytime."
              : "Donation window closed. You can still jump in as a guest anytime.",
            true,
          );
        },
      },
    });

    state.pendingDonationOrderId = data.orderId;
    checkout.open();
  } catch (error) {
    updateDonationStatus(
      await readFunctionErrorMessage(
        error,
        formatDonationError(error),
      ),
      false,
    );
    console.error("Razorpay donation create order error:", error);
    if (donationButton) {
      donationButton.disabled = false;
    }
  }
}

async function deletePlayerData() {
  if (!state.user || !supabaseClient) {
    return;
  }

  const wantsToDelete = window.confirm(
    "Last chance, racer.\n\nIf you wipe this garage, your saved best score, racer name, and access passes will disappear from The Viral Alien game.\n\nAre you sure you want to delete everything?",
  );

  if (!wantsToDelete) {
    updateCloudStatus("Your saved progress is still safe in the garage.", true);
    return;
  }

  try {
    updateCloudStatus("Wiping your garage and closing your account...", false);

    const { error } = await supabaseClient.functions.invoke("delete-account", {
      body: {
        confirmDelete: true,
      },
    });

    if (error) {
      throw error;
    }

    updateCloudStatus("Your saved game data has been cleared.", true);
    updateAuthStatus("Your garage has been wiped. If you want back in, build a fresh racer and hit the road again.", true);
    await supabaseClient.auth.signOut();
  } catch (error) {
    updateCloudStatus(
      formatSupabaseError(error, "We could not delete your saved data right now."),
      false,
    );
    console.error("Supabase delete profile error:", error);
  }
}

async function submitFeedback() {
  if (!supabaseClient) {
    updateFeedbackStatus("Feedback is not ready yet. Reload the game and try again.", false);
    return;
  }

  const {
    feedbackRatingInput,
    feedbackMessageInput,
    feedbackEmailInput,
    sendFeedbackButton,
    cancelFeedbackButton,
  } = overlayRefs();

  const rating = Number(feedbackRatingInput?.value || 5);
  const feedbackText = feedbackMessageInput?.value?.trim() || "";
  const email = feedbackEmailInput?.value?.trim() || state.user?.email || "";

  if (!feedbackText) {
    updateFeedbackStatus("Tell us a little about your ride before sending feedback.", false);
    return;
  }

  sendFeedbackButton.disabled = true;
  if (cancelFeedbackButton) {
    cancelFeedbackButton.disabled = true;
  }
  updateFeedbackStatus("Sending your feedback to the garage team...", false);

  try {
    const { error } = await supabaseClient.functions.invoke("submit-feedback", {
      body: {
        racerName: state.racerName,
        email,
        rating,
        message: feedbackText,
        vehicle: state.selectedVehicle,
        bestScore: state.bestScore,
        playMode: state.user ? "signed-in" : "guest",
      },
    });

    if (error) {
      throw error;
    }

    updateFeedbackStatus("Thanks for the feedback. The garage team has it now.", true);
    if (feedbackMessageInput) {
      feedbackMessageInput.value = "";
    }
  } catch (error) {
    updateFeedbackStatus(formatFeedbackError(error), false);
    console.error("Supabase feedback submit error:", error);
  } finally {
    sendFeedbackButton.disabled = false;
    if (cancelFeedbackButton) {
      cancelFeedbackButton.disabled = false;
    }
  }
}

function updateSessionModeText() {
  const { sessionModeText } = overlayRefs();
  if (sessionModeText) {
    if (state.user) {
      sessionModeText.textContent = `${state.racerName} is signed in. Highest score is tracked in The Viral Alien game.`;
      sessionModeText.classList.remove("hidden");
    } else {
      sessionModeText.textContent = "";
      sessionModeText.classList.add("hidden");
    }
  }
}

function isLevelFourVehicleUnlocked() {
  return state.level >= 4;
}

function isLevelSixVehicleUnlocked() {
  return state.level >= 6;
}

function isLevelSevenVehicleUnlocked() {
  return state.level >= 7;
}

function updateVehicleUnlockUI() {
  const { vehicleOptions } = overlayRefs();
  const levelFourUnlocked = isLevelFourVehicleUnlocked();
  const levelSixUnlocked = isLevelSixVehicleUnlocked();
  const levelSevenUnlocked = isLevelSevenVehicleUnlocked();

  vehicleOptions.forEach((option) => {
    const isLevelFourOnly = option.dataset.levelFourOnly === "true";
    const isLevelSixOnly = option.dataset.levelSixOnly === "true";
    const isLevelSevenOnly = option.dataset.levelSevenOnly === "true";

    if (isLevelFourOnly) {
      option.disabled = !levelFourUnlocked;
      option.classList.toggle("is-locked", !levelFourUnlocked);
      return;
    }

    if (isLevelSixOnly) {
      option.disabled = !levelSixUnlocked;
      option.classList.toggle("is-locked", !levelSixUnlocked);
      return;
    }

    if (isLevelSevenOnly) {
      option.disabled = !levelSevenUnlocked;
      option.classList.toggle("is-locked", !levelSevenUnlocked);
    }
  });
}

function updateProfileInputs() {
  const {
    signOutButton,
    deleteProfileButton,
  } = overlayRefs();
  if (signOutButton) {
    signOutButton.disabled = false;
    signOutButton.textContent = "Go Back";
  }
  if (deleteProfileButton) {
    deleteProfileButton.disabled = !state.user;
  }
}

function showVehicleSetup() {
  const { racerGate, vehicleSetup, guestRaceReady, authRacerNameInput, startButton, vehicleOptions } = overlayRefs();
  stopGameOverMusic();
  message.classList.remove("game-over");
  message.classList.remove("choice-mode");
  message.classList.remove("guest-race-mode");
  racerGate.classList.add("hidden");
  vehicleSetup.classList.remove("hidden");
  vehicleSetup.classList.add("selection-mode");
  guestRaceReady?.classList.add("hidden");
  message.scrollTop = 0;
  setPasswordRecoveryMode(false);
  if (authRacerNameInput) {
    authRacerNameInput.value = isGuestRacerName() ? "" : state.racerName;
  }
  if (startButton) {
    startButton.classList.add("hidden");
  }
  updateProfileInputs();
  updateSessionModeText();
  updateBestScoreDisplay();
  updateAccessUI();
  updateGuestAccessUI();
  updateVehicleUnlockUI();
  toggleFeedbackPanel(false);
  playUiWhooshSound();
  syncGameplayChrome();
  window.setTimeout(() => {
    const selectedVehicle = vehicleOptions.find((option) => option.dataset.vehicle === state.selectedVehicle && !option.disabled);
    selectedVehicle?.focus();
  }, 40);
}

function showAuthGate() {
  const { racerGate, vehicleSetup, guestRaceReady } = overlayRefs();
  stopGameOverMusic();
  message.classList.remove("game-over");
  message.classList.remove("choice-mode");
  message.classList.remove("guest-race-mode");
  racerGate.classList.remove("hidden");
  vehicleSetup.classList.add("hidden");
  guestRaceReady?.classList.add("hidden");
  message.scrollTop = 0;
  setPasswordRecoveryMode(state.passwordRecoveryMode);
  if (!state.passwordRecoveryMode) {
    setAuthView("choice");
  }
  updateAccessUI();
  updateGuestAccessUI();
  toggleFeedbackPanel(false);
  playUiWhooshSound();
  syncGameplayChrome();
}

function showSignInForm() {
  showAuthGate();
  setAuthView("signin");
  playUiWhooshSound();
  updateAuthStatus("Sign in to save your progress and keep racing with your account.", true);
}

function showGuestRaceReady() {
  const { racerGate, vehicleSetup, guestRaceReady, guestRaceReadyText } = overlayRefs();
  message.classList.remove("game-over");
  message.classList.remove("choice-mode");
  message.classList.add("guest-race-mode");
  racerGate.classList.add("hidden");
  vehicleSetup.classList.add("hidden");
  guestRaceReady?.classList.remove("hidden");
  message.scrollTop = 0;
  if (guestRaceReadyText) {
    guestRaceReadyText.textContent = `${state.racerName}, your ${prettifyVehicleName(state.selectedVehicle)} is ready. Tap Start Race when you want to begin.`;
  }
  playUiWhooshSound();
  syncGameplayChrome();
}

function startGuestMode(name = "") {
  state.user = null;
  state.racerName = name && name.trim() ? name.trim() : "Guest Racer";
  state.bestScore = 0;
  state.bestScoreLevel = 1;
  state.cloudSyncActive = false;
  state.accessActive = true;
  state.accessValidUntil = "";
  state.guestReadyVehicle = "";
  startButton.textContent = "Start Game";
  updateBestScoreDisplay();
  updateSessionModeText();
  updateProfileInputs();
  updateAccessUI();
  updateCloudStatus("Guest mode is ready. Choose a vehicle to start your race.", true);
  updateAuthStatus("Guest mode is ready. Choose a vehicle and start your race.", true);
  showVehicleSetup();
}

function showGuestProfileEditor() {
  state.racerName = "Guest Racer";
  state.bestScore = 0;
  state.bestScoreLevel = 1;
  state.accessActive = false;
  state.accessValidUntil = "";
  updateBestScoreDisplay();
  updateProfileInputs();
  updateSessionModeText();
  updateAccessUI();
}

async function handleSessionChange(session) {
  state.user = session?.user || null;
  state.cloudSyncActive = Boolean(state.user);

  if (state.passwordRecoveryMode) {
    showAuthGate();
    setPasswordRecoveryMode(true);
    updateAuthStatus("Enter your new password below, then sign in again with it.", false);
    const { resetPasswordInput } = overlayRefs();
    window.setTimeout(() => resetPasswordInput?.focus(), 120);
    return;
  }

  if (!state.user) {
    showGuestProfileEditor();
    updateCloudStatus("Cloud save is ready whenever you want to sign in.", true);
    updateGuestAccessUI();
    if (!state.entryReady) {
      return;
    }
    showAuthGate();
    return;
  }

  await loadProfile();
  updateAuthStatus(`Welcome back, ${state.racerName}.`, true);

  if (!state.entryReady || state.authView === "choice") {
    return;
  }

  showVehicleSetup();
}

async function sendPasswordReset() {
  if (!supabaseClient) {
    updateAuthStatus("Password reset is not ready yet. Reload the game and try again.", false);
    return;
  }

  const { authEmailInput } = overlayRefs();
  const email = authEmailInput?.value?.trim();

  if (!email) {
    updateAuthStatus("Enter your email first so we know where to send the reset link.", false);
    return;
  }

  updateAuthStatus("Sending your password reset link...", false);

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl(),
    });

    if (error) {
      throw error;
    }

    updateAuthStatus("Check your email and open the reset link to choose a new password.", true);
  } catch (error) {
    updateAuthStatus(formatSupabaseError(error, "We could not send your password reset link."), false);
  }
}

async function completePasswordReset() {
  if (!supabaseClient) {
    updateAuthStatus("Password reset is not ready yet. Reload the game and try again.", false);
    return;
  }

  const {
    resetPasswordInput,
    resetPasswordConfirmInput,
    authEmailInput,
  } = overlayRefs();
  const password = resetPasswordInput?.value || "";
  const confirmPassword = resetPasswordConfirmInput?.value || "";
  const recoveryEmail = state.user?.email || authEmailInput?.value?.trim() || "";

  if (!password || !confirmPassword) {
    updateAuthStatus("Enter your new password in both fields to finish the reset.", false);
    return;
  }

  if (password !== confirmPassword) {
    updateAuthStatus("Those passwords do not match yet. Please try again.", false);
    return;
  }

  updateAuthStatus("Saving your new password...", false);

  try {
    const { error } = await supabaseClient.auth.updateUser({
      password,
    });

    if (error) {
      throw error;
    }

    if (authEmailInput && recoveryEmail) {
      authEmailInput.value = recoveryEmail;
    }

    await supabaseClient.auth.signOut();
    state.user = null;
    state.cloudSyncActive = false;
    setPasswordRecoveryMode(false);
    showAuthGate();
    updateAuthStatus("Your new password is saved. Sign in again with that password to get back on the road.", true);
  } catch (error) {
    updateAuthStatus(formatSupabaseError(error, "We could not update your password just yet."), false);
  }
}

function resetSessionForNewGame() {
  state.active = false;
  cancelAnimationFrame(state.animationId);
  stopBackgroundMusic();
  stopGameOverMusic();
  clearBooster();
  state.score = 0;
  state.level = 1;
  state.livesRemaining = 0;
  state.bestScore = 0;
  state.bestScoreLevel = 1;
  state.boostLevel = 0;
  state.boostActiveUntil = 0;
  state.baseSpeed = 0;
  state.baseSpeedTarget = 0;
  state.currentSpeed = 0;
  state.enemyRespawns = 0;
  state.nextBoosterScore = 2000;
  state.nextLaserScore = 2000;
  state.nextFuelScore = 8700;
  state.nextFuelDrainScore = 9000;
  state.nextBarricadeScore = 9200;
  state.levelStartScore = 0;
  state.levelTwoWarmupStartAt = 0;
  state.levelTwoWarmupUntil = 0;
  state.levelOneWarmupStartAt = 0;
  state.levelOneWarmupUntil = 0;
  state.levelWarmupStartAt = 0;
  state.levelWarmupUntil = 0;
  state.laserActiveUntil = 0;
  state.invincibleUntil = 0;
  state.reviveRunning = false;
  state.paused = false;
  state.fuelPercent = 100;
  state.pendingTransition = false;
  state.levelFourSelectionOpen = false;
  state.lastFrameTime = 0;
  state.keys.ArrowLeft = false;
  state.keys.ArrowRight = false;
  state.playerX = middleLaneX();
  scoreDisplay.textContent = "0";
  updateBestScoreDisplay();
  updateLevelDisplay();
  updateLivesDisplay();
  updateFuelDisplay();
  applyLevelTheme();
  refreshSpeed();
  resetEnemies();
  clearBarricades();
  playerCar.style.left = `${state.playerX}px`;
  roadLines.forEach((line, index) => {
    line.style.top = `${20 + index * 160}px`;
    line.style.left = "50%";
  });
  message.innerHTML = initialMessageMarkup;
  message.classList.remove("paused-mode");
  message.classList.remove("game-over");
  bindOverlayControls();
  showVehicleSetup();
  updateAuthStatus(`Choose a vehicle for ${state.racerName}. Best score has been reset.`, true);
  message.classList.remove("hidden");
  syncVehiclePreviewVisibility();
  syncGameplayChrome();
  startButton.textContent = "Start Game";
}

function bindOverlayControls() {
  const {
    authForm,
    authEmailInput,
    authPasswordInput,
    authRacerNameInput,
    showSignInButton,
    backToChoiceButton,
    forgotPasswordButton,
    resetPasswordButton,
    cancelResetPasswordButton,
    vehicleOptions,
    signInButton,
    signUpButton,
    guestButton,
    guestRaceStartButton,
    guestRaceBackButton,
    supportDonationButton,
    signOutButton,
    deleteProfileButton,
    feedbackToggleButton,
    sendFeedbackButton,
    cancelFeedbackButton,
    payAccessButton,
    refreshAccessButton,
    adminToggleButton,
    adminPasswordInput,
    adminUnlockButton,
    adminCloseButton,
    adminLevelButtons,
    adminPlayButton,
    adminLockButton,
  } = overlayRefs();

  vehicleOptions.forEach((option) => {
    option.classList.toggle("selected", option.dataset.vehicle === state.selectedVehicle);
    bindElementOnce(option, "VehicleSelect", "click", () => {
      if (option.disabled) {
        return;
      }
      overlayRefs().vehicleOptions.forEach((item) => item.classList.remove("selected"));
      option.classList.add("selected");
      applyVehicleSelection(option.dataset.vehicle);
      state.guestReadyVehicle = option.dataset.vehicle;
      showGuestRaceReady();
    });
  });

  if (authForm) {
    bindElementOnce(authForm, "AuthFormSubmit", "submit", (event) => event.preventDefault());
  }

  if (signInButton) {
    bindElementOnce(signInButton, "SignInClick", "click", async () => {
      const email = authEmailInput?.value?.trim();
      const password = authPasswordInput?.value || "";

      if (!email || !password) {
        updateAuthStatus("Enter your email and password to continue.", false);
        return;
      }

      updateAuthStatus("Opening your garage...", false);

      try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
          throw error;
        }
      } catch (error) {
        updateAuthStatus(formatSupabaseError(error, "Could not sign in."), false);
      }
    });
  }

  if (showSignInButton) {
    bindElementOnce(showSignInButton, "ShowSignInClick", "click", showSignInForm);
  }

  if (backToChoiceButton) {
    bindElementOnce(backToChoiceButton, "BackToChoiceClick", "click", () => {
      setPasswordRecoveryMode(false);
      setAuthView("choice");
      updateAuthStatus("Choose guest mode for a quick ride, or sign in to save your progress.", true);
    });
  }

  if (signUpButton) {
    bindElementOnce(signUpButton, "SignUpClick", "click", async () => {
      const email = authEmailInput?.value?.trim();
      const password = authPasswordInput?.value || "";
      const racerName = authRacerNameInput?.value?.trim();

      if (!email || !password) {
        updateAuthStatus("Enter your email and password before creating your racer.", false);
        return;
      }

      updateAuthStatus("Building your racer profile...", false);

      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: "https://santhosh-time.github.io/RacingGame/",
            data: {
              racer_name: racerName || "Road Rider",
            },
          },
        });

        if (error) {
          throw error;
        }

        if (!data.session) {
          updateAuthStatus("Your racer is almost ready. Check your email, confirm it, then sign in.", true);
        } else {
          updateAuthStatus("Your racer profile is ready and you are signed in.", true);
        }
      } catch (error) {
        updateAuthStatus(formatSupabaseError(error, "Could not sign up."), false);
      }
    });
  }

  if (forgotPasswordButton) {
    bindElementOnce(forgotPasswordButton, "ForgotPasswordClick", "click", sendPasswordReset);
  }

  if (resetPasswordButton) {
    bindElementOnce(resetPasswordButton, "ResetPasswordClick", "click", completePasswordReset);
  }

  if (cancelResetPasswordButton) {
    bindElementOnce(cancelResetPasswordButton, "CancelResetPasswordClick", "click", () => {
      setPasswordRecoveryMode(false);
      updateAuthStatus("Sign in to keep your racer profile and best score updated, or play as a guest.", true);
    });
  }

  if (guestButton) {
    bindElementOnce(guestButton, "GuestClick", "click", () => {
      startGuestMode("Guest Racer");
    });
  }

  if (guestRaceStartButton) {
    bindElementOnce(guestRaceStartButton, "GuestRaceStartClick", "click", startGame);
  }

  if (guestRaceBackButton) {
    bindElementOnce(guestRaceBackButton, "GuestRaceBackClick", "click", showVehicleSetup);
  }

  if (supportDonationButton) {
    bindElementOnce(supportDonationButton, "SupportDonateClick", "click", () => openDonationCheckout({ signedIn: true }));
  }

  if (deleteProfileButton) {
    bindElementOnce(deleteProfileButton, "DeleteProfileClick", "click", deletePlayerData);
  }

  if (feedbackToggleButton) {
    bindElementOnce(feedbackToggleButton, "FeedbackToggleClick", "click", () => {
      toggleFeedbackPanel(true);
    });
  }

  if (cancelFeedbackButton) {
    bindElementOnce(cancelFeedbackButton, "FeedbackCancelClick", "click", () => {
      toggleFeedbackPanel(false);
    });
  }

  if (sendFeedbackButton) {
    bindElementOnce(sendFeedbackButton, "FeedbackSendClick", "click", submitFeedback);
  }

  if (adminToggleButton) {
    bindElementOnce(adminToggleButton, "AdminToggleClick", "click", () => {
      const { adminPanel } = overlayRefs();
      toggleAdminPanel(adminPanel?.classList.contains("hidden"));
    });
  }

  if (adminUnlockButton) {
    bindElementOnce(adminUnlockButton, "AdminUnlockClick", "click", unlockAdminMode);
  }

  if (adminPasswordInput) {
    bindElementOnce(adminPasswordInput, "AdminPasswordEnter", "keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        unlockAdminMode();
      }
    });
  }

  if (adminCloseButton) {
    bindElementOnce(adminCloseButton, "AdminCloseClick", "click", closeAdminPanel);
  }

  adminLevelButtons.forEach((button) => {
    bindElementOnce(button, "AdminLevelSelect", "click", () => {
      state.adminSelectedLevel = Number(button.dataset.adminLevel) || 1;
      updateAdminUI();
    });
  });

  if (adminPlayButton) {
    bindElementOnce(adminPlayButton, "AdminPlayClick", "click", startAdminLevel);
  }

  if (adminLockButton) {
    bindElementOnce(adminLockButton, "AdminLockClick", "click", lockAdminPanel);
  }

  if (signOutButton) {
    bindElementOnce(signOutButton, "SignOutClick", "click", async () => {
      showAuthGate();
      updateAuthStatus(
        "Choose guest mode for a quick ride, or sign in to save your progress.",
        true,
      );
    });
  }

  if (welcomeStartButton) {
    bindElementOnce(welcomeStartButton, "WelcomeStartClick", "click", triggerWelcomeStart);
  }
}

function maybeUpdateBestScore() {
  const currentScore = Math.floor(state.score);

  if (currentScore > state.bestScore) {
    state.bestScore = currentScore;
    state.bestScoreVehicle = state.selectedVehicle;
    state.bestScoreLevel = state.level;
    updateBestScoreDisplay();
    saveCloudBestScore();
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

function drawThreeDText(ctx, text, x, y, font, frontColor, depthColor = "rgba(3, 10, 18, 0.7)", glowColor = "rgba(115, 239, 255, 0.16)") {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = depthColor;
  ctx.fillText(text, x + 5, y + 6);

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 14;
  ctx.fillStyle = frontColor;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawFittedCenteredThreeDText(ctx, text, x, y, maxWidth, startSize, minSize, frontColor, depthColor = "rgba(3, 10, 18, 0.7)", glowColor = "rgba(115, 239, 255, 0.16)") {
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

  drawThreeDText(ctx, text, x, y, `bold ${fontSize}px Verdana`, frontColor, depthColor, glowColor);
}

function prettifyVehicleName(vehicleName = state.selectedVehicle) {
  const names = {
    "bike-street": "Street Bike",
    "bike-speed": "Speed Bike",
    "bike-dirt": "Dirt Bike",
    "bike-electric": "Electric Bike",
    "car-sport": "Sports Car",
    "car-muscle": "Muscle Car",
    "car-electric": "Electric Car",
    "car-truck": "Truck",
    "jet-silver": "Small Boat",
    "jet-gold": "Ship",
    "jet-stealth": "Yacht",
    "plane-private": "Private Jet",
    "plane-golden": "Golden Plane",
    "plane-stealth": "Sky Plane",
    "ufo-metal": "Metal UFO",
    "ufo-mercury": "Mercury UFO",
    "bird-eagle": "Cargo Ship",
    "bird-falcon": "Speed Boat",
    "bird-gull": "Patrol Ship",
  };

  return names[vehicleName] || "Racing Vehicle";
}

function vehicleAccentColor(vehicleName = state.selectedVehicle) {
  const colors = {
    "bike-street": "#4fc3f7",
    "bike-speed": "#ff6b81",
    "bike-dirt": "#ffb74d",
    "bike-electric": "#80deea",
    "car-sport": "#ff8a80",
    "car-muscle": "#f6c36b",
    "car-electric": "#81d4fa",
    "car-truck": "#90a4ae",
    "jet-silver": "#b9d7ff",
    "jet-gold": "#ffd166",
    "jet-stealth": "#a7b2c2",
    "plane-private": "#78c8ff",
    "plane-golden": "#ffd166",
    "plane-stealth": "#a7b2c2",
    "ufo-metal": "#c6d6e6",
    "ufo-mercury": "#ff9dff",
  };

  return colors[vehicleName] || "#73efff";
}

function drawVehicleBadge(ctx, vehicleName = state.selectedVehicle) {
  const accent = vehicleAccentColor(vehicleName);
  const isBike = vehicleName.startsWith("bike-");
  const isJet = vehicleName.startsWith("jet-") || vehicleName.startsWith("plane-") || vehicleName.startsWith("ufo-");
  const isTruck = vehicleName === "car-truck";
  const isElectric = vehicleName.includes("electric");
  const isMuscle = vehicleName === "car-muscle";
  const isSport = vehicleName === "car-sport";
  const isDirt = vehicleName === "bike-dirt";

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
  } else if (isJet) {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(0, -140);
    ctx.lineTo(56, -78);
    ctx.lineTo(90, 26);
    ctx.lineTo(62, 154);
    ctx.lineTo(-62, 154);
    ctx.lineTo(-90, 26);
    ctx.lineTo(-56, -78);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.beginPath();
    ctx.roundRect(-28, -34, 56, 92, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(18, 33, 46, 0.22)";
    ctx.fillRect(-6, -82, 12, 186);

    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.beginPath();
    ctx.roundRect(-8, -110, 16, 44, 6);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.24)";
    ctx.beginPath();
    ctx.moveTo(-44, 66);
    ctx.lineTo(44, 66);
    ctx.lineTo(28, 100);
    ctx.lineTo(-28, 100);
    ctx.closePath();
    ctx.fill();
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

function drawScoreCardBackground(ctx, levelNumber, width, height) {
  ctx.clearRect(0, 0, width, height);

  if (levelNumber >= 6) {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, "#7ed4ff");
    skyGradient.addColorStop(0.34, "#58bdf6");
    skyGradient.addColorStop(0.7, "#1f7ec7");
    skyGradient.addColorStop(1, "#0b3460");
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    const cloudBands = [
      [170, 180, 230, 48],
      [760, 240, 260, 54],
      [340, 430, 280, 56],
      [850, 620, 210, 44],
    ];
    cloudBands.forEach(([x, y, w, h]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
    ctx.beginPath();
    ctx.ellipse(220, 980, 320, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(860, 1260, 260, 68, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (levelNumber === 2) {
    const muddyGradient = ctx.createLinearGradient(0, 0, 0, height);
    muddyGradient.addColorStop(0, "#5b4333");
    muddyGradient.addColorStop(0.56, "#3d2c22");
    muddyGradient.addColorStop(1, "#17110d");
    ctx.fillStyle = muddyGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(205, 182, 159, 0.09)";
    for (let index = 0; index < 9; index += 1) {
      ctx.beginPath();
      ctx.ellipse(160 + index * 110, 320 + index * 150, 170, 48, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(111, 78, 55, 0.24)";
    ctx.fillRect(160, 0, 760, height);
    ctx.strokeStyle = "rgba(237, 221, 199, 0.42)";
    ctx.lineWidth = 18;
    ctx.strokeRect(166, -2, 748, height + 4);
    return;
  }

  if (levelNumber === 3) {
    const skylineGradient = ctx.createLinearGradient(0, 0, 0, height);
    skylineGradient.addColorStop(0, "#17365c");
    skylineGradient.addColorStop(0.42, "#0c2038");
    skylineGradient.addColorStop(1, "#050d18");
    ctx.fillStyle = skylineGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(120, 194, 255, 0.12)";
    ctx.fillRect(0, 0, width, 360);

    ctx.fillStyle = "rgba(71, 110, 148, 0.45)";
    const buildingHeights = [520, 700, 620, 860, 590, 760, 640, 820];
    buildingHeights.forEach((buildingHeight, index) => {
      const x = 40 + index * 130;
      ctx.fillRect(x, height - buildingHeight - 120, 96, buildingHeight);
      ctx.fillStyle = "rgba(201, 233, 255, 0.18)";
      for (let row = 0; row < 11; row += 1) {
        for (let column = 0; column < 3; column += 1) {
          ctx.fillRect(x + 12 + column * 24, height - buildingHeight - 96 + row * 42, 10, 18);
        }
      }
      ctx.fillStyle = "rgba(71, 110, 148, 0.45)";
    });

    ctx.fillStyle = "rgba(78, 179, 98, 0.18)";
    ctx.beginPath();
    ctx.ellipse(220, height - 40, 240, 90, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(860, height - 28, 280, 100, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (levelNumber >= 4) {
    const waterGradient = ctx.createLinearGradient(0, 0, 0, height);
    if (levelNumber >= 5) {
      waterGradient.addColorStop(0, "#0a1930");
      waterGradient.addColorStop(0.26, "#0c2848");
      waterGradient.addColorStop(0.62, "#0a4168");
      waterGradient.addColorStop(1, "#06253d");
    } else {
      waterGradient.addColorStop(0, "#2aa1d4");
      waterGradient.addColorStop(0.2, "#1488c2");
      waterGradient.addColorStop(0.58, "#0d679f");
      waterGradient.addColorStop(1, "#09476f");
    }
    ctx.fillStyle = waterGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = levelNumber >= 5 ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.ellipse(220, 140, 180, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(780, 180, 240, 56, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = levelNumber >= 5 ? "rgba(184, 223, 255, 0.16)" : "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 8;
    for (let index = 0; index < 13; index += 1) {
      const y = 280 + index * 120;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(220, y - 26, 480, y + 26, width, y - 8);
      ctx.stroke();
    }

    if (levelNumber >= 5) {
      ctx.fillStyle = "rgba(255, 246, 201, 0.12)";
      ctx.beginPath();
      ctx.arc(860, 180, 110, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  const roadGradient = ctx.createLinearGradient(0, 0, 0, height);
  roadGradient.addColorStop(0, "#8fd6ff");
  roadGradient.addColorStop(0.34, "#bfe9ff");
  roadGradient.addColorStop(1, "#f0fbff");
  ctx.fillStyle = roadGradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255, 241, 188, 0.24)";
  ctx.beginPath();
  ctx.arc(860, 260, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(70, 70, 70, 0.86)";
  ctx.fillRect(160, 0, 760, height);
  ctx.strokeStyle = "rgba(245, 250, 255, 0.5)";
  ctx.lineWidth = 16;
  ctx.strokeRect(168, -2, 744, height + 4);

  ctx.setLineDash([56, 46]);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.48)";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawScoreCardBrandIcon(ctx, centerX, centerY, size = 140) {
  const scale = size / 256;
  ctx.save();
  ctx.translate(centerX - size / 2, centerY - size / 2);
  ctx.scale(scale, scale);

  const bgGradient = ctx.createLinearGradient(40, 28, 208, 224);
  bgGradient.addColorStop(0, "#1B1540");
  bgGradient.addColorStop(1, "#102A5C");

  const ringGradient = ctx.createLinearGradient(46, 138, 211, 138);
  ringGradient.addColorStop(0, "#6FFFE9");
  ringGradient.addColorStop(1, "#79F25E");

  const headGradient = ctx.createLinearGradient(84, 66, 175, 183);
  headGradient.addColorStop(0, "#8EDBFF");
  headGradient.addColorStop(1, "#3B82F6");

  ctx.fillStyle = bgGradient;
  ctx.beginPath();
  ctx.arc(128, 128, 98, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(128, 154);
  ctx.rotate((-12 * Math.PI) / 180);
  ctx.strokeStyle = ringGradient;
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.ellipse(0, 0, 82, 23, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = "#8EDBFF";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(102, 71);
  ctx.lineTo(89, 49);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(154, 71);
  ctx.lineTo(167, 49);
  ctx.stroke();

  ctx.fillStyle = "#FF6B8A";
  ctx.beginPath();
  ctx.arc(87, 46, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFB84D";
  ctx.beginPath();
  ctx.arc(169, 46, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = headGradient;
  ctx.strokeStyle = "#132445";
  ctx.lineWidth = 8;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(128, 62);
  ctx.bezierCurveTo(94, 62, 66, 87, 66, 118);
  ctx.bezierCurveTo(66, 142, 82, 163, 105, 171);
  ctx.lineTo(102, 190);
  ctx.lineTo(121, 179);
  ctx.bezierCurveTo(123, 179, 125, 180, 128, 180);
  ctx.bezierCurveTo(162, 180, 190, 155, 190, 124);
  ctx.bezierCurveTo(190, 87, 162, 62, 128, 62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#132445";
  ctx.beginPath();
  ctx.ellipse(105, 118, 15, 23, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(151, 118, 15, 23, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(110, 110, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(156, 110, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#132445";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(108, 145);
  ctx.quadraticCurveTo(128, 157, 148, 145);
  ctx.stroke();

  ctx.fillStyle = "#FF6B8A";
  ctx.beginPath();
  ctx.arc(59, 89, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#6FFFE9";
  ctx.beginPath();
  ctx.arc(194, 187, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFD45A";
  ctx.beginPath();
  ctx.arc(205, 88, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function createScoreCardImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  const currentRunScore = Math.floor(state.score);
  const scoreCardHighScore = Math.max(state.bestScore, currentRunScore);
  const useCurrentRunDetails = currentRunScore >= state.bestScore;
  const scoreCardBackgroundLevel = Math.max(1, Number(state.level) || 1);
  const isWaterCard = isWaterLevel(scoreCardBackgroundLevel);
  const isSkyCard = isSkyLevel(scoreCardBackgroundLevel);
  const scoreCardVehicle = useCurrentRunDetails
    ? state.selectedVehicle
    : (state.bestScoreVehicle || state.selectedVehicle);
  const scoreCardLevel = useCurrentRunDetails
    ? state.level
    : Math.max(1, Number(state.bestScoreLevel) || 1);

  drawScoreCardBackground(ctx, scoreCardBackgroundLevel, canvas.width, canvas.height);

  ctx.fillStyle = isSkyCard ? "rgba(18, 74, 120, 0.2)" : isWaterCard ? "rgba(7, 64, 96, 0.22)" : "rgba(7, 17, 28, 0.46)";
  ctx.fillRect(40, 40, 1000, 1840);
  ctx.strokeStyle = isSkyCard ? "rgba(230, 248, 255, 0.34)" : isWaterCard ? "rgba(183, 228, 255, 0.32)" : "rgba(115, 239, 255, 0.34)";
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, 1000, 1840);

  const headerFill = isSkyCard ? "rgba(40, 118, 176, 0.2)" : isWaterCard ? "rgba(8, 92, 138, 0.18)" : "rgba(8, 18, 28, 0.48)";
  const panelFill = isSkyCard ? "rgba(17, 65, 104, 0.46)" : isWaterCard ? "rgba(8, 52, 79, 0.52)" : "rgba(8, 18, 28, 0.52)";
  ctx.fillStyle = headerFill;
  ctx.fillRect(110, 90, 860, 200);
  ctx.strokeStyle = isSkyCard ? "rgba(240, 250, 255, 0.28)" : isWaterCard ? "rgba(222, 246, 255, 0.28)" : "rgba(115, 239, 255, 0.32)";
  ctx.lineWidth = 5;
  ctx.strokeRect(110, 90, 860, 200);

  ctx.fillStyle = isSkyCard ? "rgba(255, 255, 255, 0.08)" : isWaterCard ? "rgba(10, 108, 163, 0.08)" : "rgba(6, 14, 24, 0.14)";
  ctx.fillRect(120, 300, 840, 1320);

  if (isWaterCard) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
    ctx.lineWidth = 7;
    for (let y = 340; y < 1660; y += 120) {
      ctx.beginPath();
      ctx.moveTo(110, y);
      ctx.bezierCurveTo(280, y - 26, 460, y + 18, 650, y - 10);
      ctx.bezierCurveTo(790, y - 26, 900, y + 12, 980, y - 8);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.09)";
    ctx.beginPath();
    ctx.ellipse(230, 310, 120, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(820, 360, 150, 28, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawThreeDText(ctx, "Viral Racing Game", 540, 178, "bold 78px Verdana", "#f7fff7", "rgba(3, 10, 18, 0.85)", "rgba(115, 239, 255, 0.22)");
  drawThreeDText(ctx, "High Score Card", 540, 236, "34px Verdana", "#cfd8dc", "rgba(3, 10, 18, 0.7)", "rgba(255, 255, 255, 0.08)");
  drawScoreCardBrandIcon(ctx, 540, 84, 110);

  ctx.fillStyle = panelFill;
  ctx.fillRect(160, 390, 760, 190);
  drawFittedCenteredThreeDText(ctx, state.racerName, 540, 485, 680, 108, 54, "#73efff", "rgba(2, 9, 18, 0.82)", "rgba(115, 239, 255, 0.18)");

  ctx.fillStyle = panelFill;
  ctx.fillRect(160, 620, 760, 340);
  drawThreeDText(ctx, "Highest Score", 540, 735, "bold 60px Verdana", "#ffd166", "rgba(61, 31, 0, 0.75)", "rgba(255, 209, 102, 0.12)");
  drawThreeDText(ctx, String(scoreCardHighScore), 540, 875, "bold 210px Verdana", "#ffffff", "rgba(3, 10, 18, 0.82)", "rgba(255, 255, 255, 0.12)");

  drawVehicleBadge(ctx, scoreCardVehicle);

  drawThreeDText(ctx, "Vehicle", 540, 1470, "bold 44px Verdana", "#73efff", "rgba(2, 9, 18, 0.72)", "rgba(115, 239, 255, 0.12)");
  drawFittedCenteredThreeDText(ctx, prettifyVehicleName(scoreCardVehicle), 540, 1530, 520, 58, 34, "#f7fff7", "rgba(3, 10, 18, 0.72)", "rgba(255, 255, 255, 0.08)");

  drawThreeDText(ctx, "Level", 540, 1615, "bold 40px Verdana", "#ffd166", "rgba(61, 31, 0, 0.72)", "rgba(255, 209, 102, 0.1)");
  drawThreeDText(ctx, `Level ${scoreCardLevel}`, 540, 1688, "bold 64px Verdana", "#f7fff7", "rgba(3, 10, 18, 0.75)", "rgba(255, 255, 255, 0.08)");

  return canvas;
}

function saveScoreCard() {
  const filename = `${state.racerName.replace(/\s+/g, "-").toLowerCase()}-high-score.png`;
  const canvas = createScoreCardImage();
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function updateSoundButtons() {
  if (vehicleSoundButton) {
    vehicleSoundButton.textContent = `Vehicle Sound: ${state.vehicleSoundEnabled ? "On" : "Off"}`;
  }
  if (backgroundSoundButton) {
    backgroundSoundButton.textContent = `Background Sound: ${state.backgroundSoundEnabled && state.uiSoundEnabled ? "On" : "Off"}`;
  }
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

function createNoiseBuffer(context, durationSeconds = 2.5) {
  const frameCount = Math.floor(context.sampleRate * durationSeconds);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channelData = buffer.getChannelData(0);

  for (let index = 0; index < frameCount; index += 1) {
    channelData[index] = Math.random() * 2 - 1;
  }

  return buffer;
}

function midiToFrequency(noteNumber) {
  return 440 * (2 ** ((noteNumber - 69) / 12));
}

function currentMusicLevel() {
  return state.level >= 7 ? 7 : state.level >= 6 ? 6 : state.level >= 5 ? 5 : Math.max(1, state.level || 1);
}

function musicTheme(levelNumber = currentMusicLevel()) {
  const themes = {
    1: {
      tempo: 88,
      wave: "triangle",
      volume: 0.48,
      harmonyVolume: 0.3,
      melodyStep: 0.5,
      chordDuration: 1.7,
      chords: [
        [60, 64, 67],
        [57, 60, 64],
        [53, 57, 60],
        [55, 59, 62],
      ],
      melody: [72, 74, 76, 74, 72, 71, 69, 67],
    },
    2: {
      tempo: 94,
      wave: "sine",
      volume: 0.5,
      harmonyVolume: 0.312,
      melodyStep: 0.5,
      chordDuration: 1.5,
      chords: [
        [62, 65, 69],
        [60, 64, 67],
        [57, 60, 64],
        [59, 62, 65],
      ],
      melody: [74, 77, 76, 74, 72, 71, 69, 71],
    },
    3: {
      tempo: 102,
      wave: "triangle",
      volume: 0.512,
      harmonyVolume: 0.32,
      melodyStep: 0.5,
      chordDuration: 1.45,
      chords: [
        [64, 67, 71],
        [60, 64, 67],
        [62, 65, 69],
        [59, 62, 67],
      ],
      melody: [79, 81, 83, 81, 79, 76, 74, 76],
    },
    4: {
      tempo: 86,
      wave: "sine",
      volume: 0.488,
      harmonyVolume: 0.304,
      melodyStep: 0.5,
      chordDuration: 1.85,
      chords: [
        [57, 60, 64],
        [55, 59, 62],
        [53, 57, 60],
        [52, 55, 59],
      ],
      melody: [69, 72, 74, 72, 69, 67, 65, 64],
    },
    5: {
      tempo: 96,
      wave: "triangle",
      volume: 0.5,
      harmonyVolume: 0.312,
      melodyStep: 0.5,
      chordDuration: 1.6,
      chords: [
        [59, 62, 66],
        [60, 64, 67],
        [57, 60, 64],
        [62, 66, 69],
      ],
      melody: [74, 78, 81, 78, 76, 74, 71, 69],
    },
    6: {
      tempo: 82,
      wave: "sine",
      volume: 0.52,
      harmonyVolume: 0.3,
      melodyStep: 0.5,
      chordDuration: 1.9,
      chords: [
        [57, 61, 64],
        [59, 62, 66],
        [60, 64, 67],
        [62, 66, 69],
      ],
      melody: [72, 74, 76, 79, 76, 74, 72, 69],
    },
    7: {
      tempo: 74,
      wave: "triangle",
      volume: 0.5,
      harmonyVolume: 0.28,
      melodyStep: 0.5,
      chordDuration: 2.2,
      chords: [
        [52, 59, 64],
        [50, 57, 62],
        [47, 54, 59],
        [45, 52, 57],
      ],
      melody: [81, 84, 88, 86, 84, 81, 79, 76],
    },
  };

  return themes[levelNumber] || themes[1];
}

function playMusicNote(context, frequency, startTime, duration, volume, wave = "triangle") {
  if (!audioState.masterGain) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1400, startTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.08);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioState.masterGain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function scheduleMusicBar(theme, startTime) {
  const beatSeconds = 60 / theme.tempo;
  const chordDurationSeconds = beatSeconds * theme.chordDuration;
  const melodyDurationSeconds = beatSeconds * 0.42;

  theme.chords.forEach((chord, chordIndex) => {
    const chordStart = startTime + chordIndex * beatSeconds;
    chord.forEach((noteNumber, noteIndex) => {
      const detuneFrequency = midiToFrequency(noteNumber + (noteIndex === 0 ? -12 : 0));
      const noteVolume = noteIndex === 0 ? theme.harmonyVolume * 0.9 : theme.harmonyVolume;
      playMusicNote(audioState.context, detuneFrequency, chordStart, chordDurationSeconds, noteVolume, theme.wave);
    });
  });

  theme.melody.forEach((noteNumber, melodyIndex) => {
    const noteStart = startTime + melodyIndex * beatSeconds * theme.melodyStep;
    playMusicNote(audioState.context, midiToFrequency(noteNumber), noteStart, melodyDurationSeconds, theme.volume, theme.wave);
  });
}

function stopBackgroundMusic() {
  if (audioState.musicTimer) {
    window.clearInterval(audioState.musicTimer);
    audioState.musicTimer = null;
  }
  audioState.musicThemeLevel = 0;
}

function playPluckedMusicNote(context, frequency, startTime, duration, volume = 0.32) {
  if (!context || !audioState.masterGain) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const lowpass = context.createBiquadFilter();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.985), startTime + duration);

  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(Math.max(900, frequency * 4.8), startTime);
  lowpass.Q.value = 0.3;

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.012);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(lowpass);
  lowpass.connect(gainNode);
  gainNode.connect(audioState.masterGain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);
}

function scheduleGameOverMusicBar(startTime) {
  if (!audioState.context || !state.backgroundSoundEnabled) {
    return;
  }

  const beatSeconds = 0.52;
  const progression = [
    [57, 61, 64],
    [54, 57, 61],
    [52, 56, 59],
    [50, 54, 57],
  ];
  const melody = [76, 73, 71, 69, 71, 73, 76, 78];

  progression.forEach((chord, chordIndex) => {
    const chordStart = startTime + chordIndex * beatSeconds * 2;
    chord.forEach((noteNumber, noteIndex) => {
      playPluckedMusicNote(
        audioState.context,
        midiToFrequency(noteNumber + (noteIndex === 0 ? -12 : 0)),
        chordStart + noteIndex * 0.028,
        beatSeconds * 1.8,
        noteIndex === 0 ? 0.34 : 0.28,
      );
    });
  });

  melody.forEach((noteNumber, melodyIndex) => {
    const noteStart = startTime + melodyIndex * beatSeconds;
    playPluckedMusicNote(audioState.context, midiToFrequency(noteNumber), noteStart + 0.06, beatSeconds * 0.92, 0.36);
  });
}

function stopGameOverMusic() {
  if (audioState.gameOverMusicTimer) {
    window.clearInterval(audioState.gameOverMusicTimer);
    audioState.gameOverMusicTimer = null;
  }
  audioState.gameOverMusicActive = false;
}

async function startGameOverMusic(forceRestart = false) {
  if (!state.backgroundSoundEnabled) {
    return;
  }

  const context = await ensureAudioReady();
  if (!context) {
    return;
  }

  if (!forceRestart && audioState.gameOverMusicTimer && audioState.gameOverMusicActive) {
    return;
  }

  stopBackgroundMusic();
  stopGameOverMusic();

  const barSeconds = 0.52 * 8;
  const scheduleBar = () => {
    if (!state.backgroundSoundEnabled) {
      return;
    }
    scheduleGameOverMusicBar(context.currentTime + 0.05);
  };

  audioState.gameOverMusicActive = true;
  scheduleBar();
  audioState.gameOverMusicTimer = window.setInterval(scheduleBar, Math.max(1000, barSeconds * 1000));
}

function scheduleBackgroundMusic(forceRestart = false) {
  if (!audioState.context || !state.backgroundSoundEnabled) {
    return;
  }

  const levelNumber = currentMusicLevel();
  if (!forceRestart && audioState.musicTimer && audioState.musicThemeLevel === levelNumber) {
    return;
  }

  stopGameOverMusic();
  stopBackgroundMusic();

  const theme = musicTheme(levelNumber);
  const beatSeconds = 60 / theme.tempo;
  const barSeconds = beatSeconds * theme.chords.length;
  const scheduleBar = () => {
    if (!state.backgroundSoundEnabled) {
      return;
    }
    scheduleMusicBar(theme, audioState.context.currentTime + 0.04);
  };

  audioState.musicThemeLevel = levelNumber;
  scheduleBar();
  audioState.musicTimer = window.setInterval(scheduleBar, Math.max(1000, barSeconds * 1000));
}

async function startBackgroundMusic(forceRestart = false) {
  if (!state.backgroundSoundEnabled) {
    return;
  }

  const context = await ensureAudioReady();
  if (!context) {
    return;
  }

  stopGameOverMusic();
  scheduleBackgroundMusic(forceRestart);
}

function engineSoundProfile(vehicleName) {
  const profiles = {
    "bike-street": { wave: "sawtooth", baseFrequency: 126, steerBoost: 12, activeGain: 0.3, speedFactor: 10.5 },
    "bike-speed": { wave: "sawtooth", baseFrequency: 138, steerBoost: 14, activeGain: 0.33, speedFactor: 11.8 },
    "bike-dirt": { wave: "square", baseFrequency: 112, steerBoost: 11, activeGain: 0.31, speedFactor: 9.6 },
    "bike-electric": { wave: "triangle", baseFrequency: 176, steerBoost: 7, activeGain: 0.26, speedFactor: 8.2 },
    "car-sport": { wave: "sawtooth", baseFrequency: 96, steerBoost: 10, activeGain: 0.29, speedFactor: 9.1 },
    "car-muscle": { wave: "square", baseFrequency: 78, steerBoost: 8, activeGain: 0.34, speedFactor: 8.3 },
    "car-electric": { wave: "triangle", baseFrequency: 146, steerBoost: 6, activeGain: 0.24, speedFactor: 7.2 },
    "car-truck": { wave: "square", baseFrequency: 62, steerBoost: 5, activeGain: 0.36, speedFactor: 6.5 },
    "jet-silver": { wave: "sawtooth", baseFrequency: 54, steerBoost: 3, activeGain: 0.28, speedFactor: 4.1, lowpass: 520 },
    "jet-gold": { wave: "square", baseFrequency: 48, steerBoost: 2, activeGain: 0.3, speedFactor: 3.7, lowpass: 420 },
    "jet-stealth": { wave: "triangle", baseFrequency: 60, steerBoost: 2, activeGain: 0.27, speedFactor: 4.5, lowpass: 680 },
    "plane-private": {
      wave: "sawtooth",
      baseFrequency: 88,
      steerBoost: 1,
      activeGain: 0.31,
      speedFactor: 3.8,
      lowpass: 980,
      secondaryWave: "triangle",
      secondaryBaseFrequency: 156,
      secondarySpeedFactor: 5.4,
      secondaryGain: 0.16,
      secondaryFilter: 1650,
    },
    "plane-golden": {
      wave: "sawtooth",
      baseFrequency: 82,
      steerBoost: 1,
      activeGain: 0.32,
      speedFactor: 3.5,
      lowpass: 900,
      secondaryWave: "square",
      secondaryBaseFrequency: 148,
      secondarySpeedFactor: 5.1,
      secondaryGain: 0.18,
      secondaryFilter: 1500,
    },
    "plane-stealth": {
      wave: "triangle",
      baseFrequency: 96,
      steerBoost: 1,
      activeGain: 0.29,
      speedFactor: 4.2,
      lowpass: 1200,
      secondaryWave: "sawtooth",
      secondaryBaseFrequency: 170,
      secondarySpeedFactor: 5.8,
      secondaryGain: 0.14,
      secondaryFilter: 1800,
    },
    "ufo-metal": {
      wave: "sine",
      baseFrequency: 118,
      steerBoost: 0,
      activeGain: 0.28,
      speedFactor: 2.6,
      lowpass: 1400,
      secondaryWave: "triangle",
      secondaryBaseFrequency: 236,
      secondarySpeedFactor: 3.4,
      secondaryGain: 0.2,
      secondaryFilter: 2100,
    },
    "ufo-mercury": {
      wave: "triangle",
      baseFrequency: 132,
      steerBoost: 0,
      activeGain: 0.29,
      speedFactor: 2.8,
      lowpass: 1500,
      secondaryWave: "sine",
      secondaryBaseFrequency: 264,
      secondarySpeedFactor: 3.8,
      secondaryGain: 0.22,
      secondaryFilter: 2300,
    },
  };

  return profiles[vehicleName] || profiles["car-sport"];
}

async function startEngineSound() {
  if (!state.vehicleSoundEnabled) {
    return;
  }

  const context = await ensureAudioReady();
  if (!context || audioState.engineStarted) {
    return;
  }

  const profile = engineSoundProfile(state.selectedVehicle);
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const lowpass = context.createBiquadFilter();
  const secondaryOscillator = context.createOscillator();
  const secondaryGain = context.createGain();
  const secondaryFilter = context.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = profile.lowpass || 1600;
  oscillator.type = profile.wave;
  oscillator.frequency.value = profile.baseFrequency;
  gainNode.gain.value = 0.0001;
  secondaryFilter.type = "bandpass";
  secondaryFilter.frequency.value = profile.secondaryFilter || 1200;
  secondaryFilter.Q.value = 0.35;
  secondaryOscillator.type = profile.secondaryWave || "triangle";
  secondaryOscillator.frequency.value = profile.secondaryBaseFrequency || profile.baseFrequency * 1.9;
  secondaryGain.gain.value = 0.0001;
  oscillator.connect(lowpass);
  lowpass.connect(gainNode);
  gainNode.connect(audioState.masterGain);
  secondaryOscillator.connect(secondaryFilter);
  secondaryFilter.connect(secondaryGain);
  secondaryGain.connect(audioState.masterGain);
  oscillator.start();
  secondaryOscillator.start();

  audioState.engineOscillator = oscillator;
  audioState.engineGain = gainNode;
  audioState.engineLowpass = lowpass;
  audioState.engineSecondaryOscillator = secondaryOscillator;
  audioState.engineSecondaryGain = secondaryGain;
  audioState.engineSecondaryFilter = secondaryFilter;
  audioState.engineStarted = true;
}

function stopEngineSound() {
  if (!audioState.engineStarted) {
    return;
  }

  const now = audioState.context.currentTime;
  audioState.engineGain.gain.cancelScheduledValues(now);
  audioState.engineGain.gain.setTargetAtTime(0.0001, now, 0.08);
  if (audioState.engineSecondaryGain) {
    audioState.engineSecondaryGain.gain.cancelScheduledValues(now);
    audioState.engineSecondaryGain.gain.setTargetAtTime(0.0001, now, 0.08);
  }
}

function updateEngineSound() {
  if (!audioState.engineStarted || !state.vehicleSoundEnabled) {
    return;
  }

  const now = audioState.context.currentTime;
  const profile = engineSoundProfile(state.selectedVehicle);
  const steerBoost = state.keys.ArrowLeft || state.keys.ArrowRight ? profile.steerBoost : 0;
  const targetFrequency = profile.baseFrequency + state.currentSpeed * profile.speedFactor + steerBoost;
  const targetGain = state.active ? profile.activeGain : 0.0001;
  const isPlane = state.selectedVehicle.startsWith("plane-");
  const isUfo = state.selectedVehicle.startsWith("ufo-");
  const modulation = isPlane ? Math.sin(Date.now() / 120) * 8 : isUfo ? Math.sin(Date.now() / 90) * 18 : 0;
  const primaryFrequency = targetFrequency + modulation * (isUfo ? 0.6 : 0);
  const secondaryFrequency = (profile.secondaryBaseFrequency || profile.baseFrequency * 1.9) + state.currentSpeed * (profile.secondarySpeedFactor || 4.8) + modulation;
  const secondaryGainTarget = state.active && (isPlane || isUfo) ? (profile.secondaryGain || 0.14) : 0.0001;

  audioState.engineOscillator.frequency.cancelScheduledValues(now);
  audioState.engineOscillator.frequency.linearRampToValueAtTime(primaryFrequency, now + 0.08);
  if (audioState.engineLowpass) {
    audioState.engineLowpass.frequency.cancelScheduledValues(now);
    audioState.engineLowpass.frequency.linearRampToValueAtTime(profile.lowpass || 1600, now + 0.08);
  }
  audioState.engineGain.gain.cancelScheduledValues(now);
  audioState.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
  if (audioState.engineSecondaryOscillator && audioState.engineSecondaryGain) {
    audioState.engineSecondaryOscillator.type = profile.secondaryWave || "triangle";
    audioState.engineSecondaryOscillator.frequency.cancelScheduledValues(now);
    audioState.engineSecondaryOscillator.frequency.linearRampToValueAtTime(secondaryFrequency, now + 0.08);
    if (audioState.engineSecondaryFilter) {
      audioState.engineSecondaryFilter.frequency.cancelScheduledValues(now);
      audioState.engineSecondaryFilter.frequency.linearRampToValueAtTime(profile.secondaryFilter || 1200, now + 0.08);
    }
    audioState.engineSecondaryGain.gain.cancelScheduledValues(now);
    audioState.engineSecondaryGain.gain.setTargetAtTime(secondaryGainTarget, now, 0.08);
  }
}

async function startWaterSound() {
  if (!state.backgroundSoundEnabled || !isWaterLevel()) {
    return;
  }

  const context = await ensureAudioReady();
  if (!context || audioState.waterStarted) {
    return;
  }

  const noiseSource = context.createBufferSource();
  noiseSource.buffer = createNoiseBuffer(context);
  noiseSource.loop = true;

  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 420;
  filter.Q.value = 0.4;

  const gainNode = context.createGain();
  gainNode.gain.value = 0.0001;

  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioState.masterGain);
  noiseSource.start();

  audioState.waterNoiseSource = noiseSource;
  audioState.waterFilter = filter;
  audioState.waterNoiseGain = gainNode;
  audioState.waterStarted = true;
}

function stopWaterSound() {
  if (!audioState.waterStarted || !audioState.waterNoiseGain || !audioState.context) {
    return;
  }

  const now = audioState.context.currentTime;
  audioState.waterNoiseGain.gain.cancelScheduledValues(now);
  audioState.waterNoiseGain.gain.setTargetAtTime(0.0001, now, 0.08);
}

function updateWaterSound() {
  if (!audioState.waterStarted || !state.backgroundSoundEnabled || !audioState.context || !audioState.waterNoiseGain || !audioState.waterFilter) {
    return;
  }

  const now = audioState.context.currentTime;
  const targetGain = state.active && isWaterLevel() ? 0.56 : 0.0001;
  const targetFrequency = 340 + state.currentSpeed * 18;

  audioState.waterFilter.frequency.cancelScheduledValues(now);
  audioState.waterFilter.frequency.linearRampToValueAtTime(targetFrequency, now + 0.12);
  audioState.waterNoiseGain.gain.cancelScheduledValues(now);
  audioState.waterNoiseGain.gain.setTargetAtTime(targetGain, now, 0.12);
}

async function playToneSweep(options) {
  if (options.category === "ui") {
    if (!state.uiSoundEnabled) {
      return;
    }
  } else if (options.category === "background") {
    if (!state.backgroundSoundEnabled) {
      return;
    }
  } else if (!state.vehicleSoundEnabled) {
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
    category: "vehicle",
    type: "triangle",
    startFrequency: 320,
    endFrequency: 980,
    duration: 0.28,
    volume: 0.48,
  });
}

function playPickupAddedSound() {
  playToneSweep({
    category: "background",
    type: "triangle",
    startFrequency: 640,
    endFrequency: 1280,
    duration: 0.18,
    volume: 0.48,
  });

  window.setTimeout(() => {
    playToneSweep({
      category: "background",
      type: "triangle",
      startFrequency: 980,
      endFrequency: 1560,
      duration: 0.15,
      volume: 0.4,
    });
  }, 80);
}

function playCrashSound() {
  playToneSweep({
    category: "background",
    type: "sawtooth",
    startFrequency: 210,
    endFrequency: 58,
    duration: 0.45,
    volume: 0.64,
  });
}

function playGameOverSound() {
  const notes = [
    { start: 720, end: 660, delay: 0 },
    { start: 620, end: 560, delay: 170 },
    { start: 520, end: 460, delay: 340 },
    { start: 420, end: 340, delay: 520 },
  ];

  notes.forEach((note) => {
    window.setTimeout(() => {
      playToneSweep({
        category: "background",
      type: "triangle",
      startFrequency: note.start,
      endFrequency: note.end,
      duration: 0.22,
      volume: 0.58,
    });
  }, note.delay);
  });
}

function playUiTapSound() {
  playToneSweep({
    category: "ui",
    type: "triangle",
    startFrequency: 520,
    endFrequency: 660,
    duration: 0.08,
    volume: 0.6,
  });
}

function playCountdownBell(count) {
  const startFrequencyByCount = {
    3: 1180,
    2: 1320,
    1: 1480,
  };

  const startFrequency = startFrequencyByCount[count] || 1320;
  playToneSweep({
    category: "ui",
    type: "sine",
    startFrequency,
    endFrequency: startFrequency * 1.08,
    duration: 0.16,
    volume: 0.48,
  });
}

function playUiWhooshSound() {
  playToneSweep({
    category: "ui",
    type: "sine",
    startFrequency: 260,
    endFrequency: 520,
    duration: 0.16,
    volume: 0.48,
  });
}

function playMissileHitSound() {
  playToneSweep({
    category: "background",
    type: "square",
    startFrequency: 980,
    endFrequency: 210,
    duration: 0.16,
    volume: 0.62,
  });

  window.setTimeout(() => {
    playToneSweep({
      category: "background",
      type: "triangle",
      startFrequency: 420,
      endFrequency: 120,
      duration: 0.14,
      volume: 0.38,
    });
  }, 45);
}

function playFinalLevelVoice() {
  if (!state.backgroundSoundEnabled || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance("You have reached Final Level");
    utterance.rate = 0.98;
    utterance.pitch = 1.08;
    utterance.volume = 1;

    const availableVoices = window.speechSynthesis.getVoices();
    const preferredVoice = availableVoices.find((voice) => /en/i.test(voice.lang) && /female|zira|samantha|google/i.test(voice.name))
      || availableVoices.find((voice) => /en/i.test(voice.lang))
      || null;
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve();
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      window.setTimeout(finish, 2600);
    } catch (error) {
      finish();
    }
  });
}

async function playLevelUpSound(levelNumber = state.level) {
  const notes = [
    { start: 460, end: 560, delay: 0, duration: 0.14, volume: 0.72 },
    { start: 560, end: 700, delay: 120, duration: 0.15, volume: 0.76 },
    { start: 700, end: 880, delay: 250, duration: 0.16, volume: 0.8 },
    { start: 880, end: 1060, delay: 420, duration: 0.19, volume: 0.86 },
    { start: 980, end: 1240, delay: 610, duration: 0.18, volume: 0.84 },
    { start: 1120, end: 1420, delay: 770, duration: 0.2, volume: 0.9 },
  ];

  notes.forEach((note) => {
    window.setTimeout(() => {
      playToneSweep({
        category: "background",
        type: "triangle",
        startFrequency: note.start,
        endFrequency: note.end,
        duration: note.duration,
        volume: note.volume,
      });
    }, note.delay);
  });

  await new Promise((resolve) => window.setTimeout(resolve, 1060));

  if (levelNumber >= 7) {
    await playFinalLevelVoice();
  }
}

function vehicleWidth() {
  if (state.selectedVehicle.startsWith("bike-")) {
    return gameBounds.bikeWidth;
  }
  if (state.selectedVehicle.startsWith("jet-") || state.selectedVehicle.startsWith("plane-") || state.selectedVehicle.startsWith("ufo-")) {
    return gameBounds.jetWidth;
  }
  return gameBounds.carWidth;
}

function refreshSpeed() {
  const laserMultiplier = 1;
  const levelOneBoostMultiplier = state.level === 1 && Date.now() < state.boostActiveUntil ? boostMultiplier : 1;
  state.currentSpeed = state.baseSpeed * levelOneBoostMultiplier * laserMultiplier;
  speedDisplay.textContent = `${getCurrentKmph()} km/h`;
  updateBoostMeter();
  updateLevelDisplay();
  updateLivesDisplay();
  updateFuelDisplay();
}

function roadPadding() {
  return 0;
}

function enemyVehicleWidth(vehicleName) {
  if (vehicleName.startsWith("bike-")) {
    return gameBounds.bikeWidth;
  }
  if (vehicleName.startsWith("bird-")) {
    return gameBounds.birdWidth;
  }
  if (vehicleName.startsWith("jet-") || vehicleName.startsWith("plane-") || vehicleName.startsWith("ufo-")) {
    return gameBounds.jetWidth;
  }
  return gameBounds.carWidth;
}

function updatePlayerVerticalPosition() {
  playerCar.style.top = "auto";
  playerCar.style.bottom = "18px";
  updateBoostMeter();
}

function updateBoostMeter() {
  if (!boostMeter || !boostMeterFill) {
    return;
  }

  const boosterActive = state.level === 1 && Date.now() < state.boostActiveUntil;
  boostMeter.classList.toggle("hidden", !boosterActive);

  if (!boosterActive) {
    boostMeterFill.style.transform = "scaleX(0)";
    return;
  }

  const remaining = Math.max(0, state.boostActiveUntil - Date.now());
  const progress = Math.max(0, Math.min(1, remaining / boostDurationMs));
  const vehicleLeft = parseFloat(playerCar.style.left || `${state.playerX || 0}`);
  const playerWidth = vehicleWidth();
  const meterWidth = 54;
  const centeredLeft = clampVehicleLeft(vehicleLeft + playerWidth / 2 - meterWidth / 2, meterWidth);

  boostMeter.style.left = `${centeredLeft}px`;
  boostMeter.style.bottom = "116px";
  boostMeterFill.style.transform = `scaleX(${progress})`;
}

function barricadeWidth() {
  return 56;
}

function pickEnemyVehicle() {
  const poolSource = isSkyLevel()
    ? planeEnemyChoices
    : isWaterLevel()
      ? birdEnemyChoices
      : roadEnemyVehicleChoices;
  const choices = poolSource.filter((vehicleName) => vehicleName !== state.selectedVehicle);
  const pool = choices.length > 0 ? choices : poolSource;
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
  const width = isSkyLevel()
    ? gameBounds.jetWidth
    : isWaterLevel()
      ? gameBounds.birdWidth
      : gameBounds.carWidth;
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
  updatePlayerVerticalPosition();

  if (!state.active) {
    state.playerX = middleLaneX();
    playerCar.style.left = `${state.playerX}px`;
  }

  if (audioState.engineStarted) {
    const profile = engineSoundProfile(state.selectedVehicle);
    audioState.engineOscillator.type = profile.wave;
    if (audioState.engineSecondaryOscillator) {
      audioState.engineSecondaryOscillator.type = profile.secondaryWave || "triangle";
    }
    updateEngineSound();
  }
}

function syncVehiclePreviewVisibility() {
  playerCar.classList.toggle("hidden-preview", !message.classList.contains("hidden"));
}

function syncGameplayChrome() {
  const inRaceMode = Boolean(
    state.active ||
    state.paused ||
    state.pendingTransition ||
    state.countdownRunning ||
    state.reviveRunning
  );
  document.body.classList.toggle("is-playing", inRaceMode);
  window.requestAnimationFrame(() => {
    syncGameBounds();
    updatePlayerVerticalPosition();
  });
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

function createBarricade(y, left) {
  const barricade = document.createElement("div");
  barricade.className = "barricade";
  barricade.innerHTML = "<span></span>";
  barricade.style.top = `${y}px`;
  barricade.style.left = `${clampVehicleLeft(left, barricadeWidth())}px`;
  gameArea.appendChild(barricade);
  return barricade;
}

function clearBarricades() {
  state.barricades.forEach((barricade) => barricade.remove());
  state.barricades = [];
}

function chooseBarricadeX(excludedXs = []) {
  const width = barricadeWidth();
  const attempts = 24;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = clampVehicleLeft(
      roadPadding() + Math.random() * (gameBounds.width - roadPadding() * 2 - width),
      width
    );

    if (excludedXs.every((left) => !positionsOverlap(candidate, width, left, width, 28))) {
      return candidate;
    }
  }

  return clampVehicleLeft(
    roadPadding() + Math.random() * (gameBounds.width - roadPadding() * 2 - width),
    width
  );
}

function resetEnemies() {
  state.enemies.forEach((enemy) => enemy.remove());
  const spawnCount = state.level >= 4 ? 2 : 3;
  const spawnTops = state.level >= 4 ? [-120, -360] : [-160, -360, -560];
  const lanes = [];

  for (let index = 0; index < spawnCount; index += 1) {
    lanes.push(chooseEnemyX(lanes, index === 0));
  }

  state.enemies = lanes.map((lane, index) => createEnemy(spawnTops[index], lane));
}

function createPickup(y, pickupType) {
  const pickup = document.createElement("div");
  pickup.className = `pickup pickup-${pickupType}`;
  pickup.dataset.type = pickupType;
  if (pickupType === "booster" || pickupType === "laser") {
    const marker = document.createElement("span");
    marker.textContent = "✦";
    pickup.appendChild(marker);
  }
  const left = safeBoosterX();
  pickup.style.top = `${y}px`;
  pickup.style.left = `${left}px`;
  gameArea.appendChild(pickup);
  return pickup;
}

function clearBooster() {
  if (state.pickup) {
    state.pickup.remove();
    state.pickup = null;
    state.pickupType = "";
  }
}

function clearMissiles() {
  state.missiles.forEach((missile) => missile.remove());
  state.missiles = [];
  state.nextMissileAt = 0;
}

function respawnEnemy(enemy, respawnTop, forcePlayerLane = false) {
  const occupiedLanes = state.enemies
    .filter((item) => item !== enemy)
    .map((item) => ({
      left: parseFloat(item.style.left),
      width: enemyVehicleWidth(item.dataset.vehicle || "car-sport"),
    }));
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
  enemy.style.left = `${overlapsExisting ? clampVehicleLeft(nextLane, nextWidth) : adjustedLeft}px`;
  enemy.style.top = `${respawnTop}px`;
}

function spawnBarricades() {
  if (state.level !== 2 || state.score < state.nextBarricadeScore || state.barricades.length >= 2) {
    return;
  }

  const occupiedXs = [
    ...state.enemies.map((enemy) => parseFloat(enemy.style.left)),
    ...state.barricades.map((barricade) => parseFloat(barricade.style.left)),
  ];
  const barricade = createBarricade(barricadeSpawnTop, chooseBarricadeX(occupiedXs));
  state.barricades.push(barricade);
  state.nextBarricadeScore += barricadeSpawnGap;
}

function spawnBooster() {
  if (state.pickup) {
    return;
  }

  if (state.level === 1) {
    if (state.score >= state.nextBoosterScore) {
      state.pickupType = "booster";
      state.pickup = createPickup(boosterSpawnTop, "booster");
      state.nextBoosterScore += 2000;
    }
    return;
  }

  if (state.level === 2) {
    if (state.score >= state.nextLaserScore) {
      state.pickupType = "laser";
      state.pickup = createPickup(boosterSpawnTop, "laser");
      state.nextLaserScore += laserPickupGap();
    }
    return;
  }

  if (state.level >= 6) {
    if (state.score >= state.nextLaserScore) {
      state.pickupType = "laser";
      state.pickup = createPickup(boosterSpawnTop, "laser");
      state.nextLaserScore += laserPickupGap();
      return;
    }

    if (state.score >= state.nextFuelScore) {
      state.pickupType = "fuel";
      state.pickup = createPickup(boosterSpawnTop, "fuel");
      state.nextFuelScore += 700;
    }
    return;
  }

  if (state.level >= 3) {
    if (state.score >= state.nextFuelScore) {
      state.pickupType = "fuel";
      state.pickup = createPickup(boosterSpawnTop, "fuel");
      state.nextFuelScore += 700;
      return;
    }

    if (state.score >= state.nextLaserScore) {
      state.pickupType = "laser";
      state.pickup = createPickup(boosterSpawnTop, "laser");
      state.nextLaserScore += laserPickupGap();
    }
  }
}

function updateBoosterLaneSafety() {
  if (!state.pickup) {
    return;
  }

  const currentLeft = parseFloat(state.pickup.style.left);
  const currentTop = parseFloat(state.pickup.style.top);
  const nearCollectionZone = currentTop > 80 && currentTop < boosterCollectionZoneTop + 60;

  if (nearCollectionZone && !boosterIsSafeAt(currentLeft)) {
    const fallbackLeft = safeBoosterX();
    if (Math.abs(fallbackLeft - currentLeft) > 8) {
      state.pickup.style.left = `${fallbackLeft}px`;
    }
  }
}

function addBoostLevel() {
  state.boostLevel = 1;
  state.boostActiveUntil = Date.now() + boostDurationMs;
  updateBoostMeter();
  refreshSpeed();
  playBoosterSound();
}

function updateSpeedRamp() {
  const now = Date.now();
  const warmupDuration = levelWarmupDuration(state.level);
  const warmupKmph = levelWarmupKmph(state.level);
  const maxKmph = levelMaxKmph(state.level);
  const capScore = levelEndScore(state.level);

  if (state.levelWarmupUntil && now < state.levelWarmupUntil) {
    const warmupProgress = Math.max(
      0,
      Math.min(1, (now - state.levelWarmupStartAt) / warmupDuration)
    );
    const warmupSpeed = gameSpeedForKmph(warmupKmph * warmupProgress);
    state.baseSpeed = warmupSpeed;
    state.baseSpeedTarget = warmupSpeed;
    return;
  }

  if (state.levelWarmupUntil) {
    state.levelWarmupUntil = 0;
    state.baseSpeed = Math.max(state.baseSpeed, gameSpeedForKmph(warmupKmph));
  }

  if (capScore > 0) {
    const scoreSpan = Math.max(1, capScore - state.levelStartScore);
    const progress = Math.max(0, Math.min(1, (state.score - state.levelStartScore) / scoreSpan));
    const targetKmph = warmupKmph + (maxKmph - warmupKmph) * progress;
    state.baseSpeedTarget = gameSpeedForKmph(targetKmph);
  } else {
    state.baseSpeedTarget = gameSpeedForKmph(maxKmph);
  }

  const difference = state.baseSpeedTarget - state.baseSpeed;
  if (Math.abs(difference) < 0.02) {
    state.baseSpeed = state.baseSpeedTarget;
    return;
  }

  const rampFactor = state.level >= 5 ? 0.02 : state.level === 3 || state.level === 4 ? 0.018 : 0.03;
  state.baseSpeed += difference * rampFactor;
}

function updatePointerPosition(clientX, clientY) {
  if (!laserPointer) {
    return;
  }

  const rect = gameArea.getBoundingClientRect();
  state.pointer.x = Math.max(0, Math.min(rect.width, clientX - rect.left));
  state.pointer.y = Math.max(0, Math.min(rect.height, clientY - rect.top));
  laserPointer.style.left = `${state.pointer.x}px`;
  laserPointer.style.top = `${state.pointer.y}px`;
}

function updateLaserPointer() {
  if (!laserPointer) {
    return;
  }

  const laserActive = Date.now() < state.laserActiveUntil && !isSkyLevel();
  laserPointer.classList.toggle("hidden", !laserActive);
}

function activateLaserMode() {
  state.laserActiveUntil = Date.now() + laserDurationMs;
  state.nextMissileAt = Date.now();
  playBoosterSound();
  updateLaserPointer();
  refreshSpeed();
}

function launchMissile() {
  if (!isSkyLevel()) {
    return;
  }

  const missile = document.createElement("div");
  missile.className = "missile";
  const playerWidth = playerCar.offsetWidth || gameBounds.jetWidth;
  missile.style.left = `${state.playerX + playerWidth / 2 - missileWidth / 2}px`;
  missile.style.top = `${playerCar.offsetTop - missileHeight + 8}px`;
  gameArea.appendChild(missile);
  state.missiles.push(missile);
}

function updateMissiles(deltaFrames = 1) {
  if (!isSkyLevel()) {
    clearMissiles();
    return;
  }

  const laserActive = Date.now() < state.laserActiveUntil;
  if (laserActive && Date.now() >= state.nextMissileAt) {
    launchMissile();
    state.nextMissileAt = Date.now() + missileLaunchIntervalMs;
  }

  for (let index = state.missiles.length - 1; index >= 0; index -= 1) {
    const missile = state.missiles[index];
    const missileLeft = parseFloat(missile.style.left);
    const currentTop = parseFloat(missile.style.top);
    const nextTop = currentTop - Math.max(5.8, state.currentSpeed * 0.88) * deltaFrames;

    if (nextTop < -missileHeight - 12) {
      missile.remove();
      state.missiles.splice(index, 1);
      continue;
    }

    missile.style.top = `${nextTop}px`;

    const missileCenterX = missileLeft + missileWidth / 2;
    const missileSweepTop = nextTop;
    const missileSweepBottom = currentTop + missileHeight;
    let hitEnemy = false;
    for (const enemy of state.enemies) {
      const enemyLeft = parseFloat(enemy.style.left);
      const enemyTop = parseFloat(enemy.style.top);
      const enemyWidth = enemyVehicleWidth(enemy.dataset.vehicle || "plane-private");
      const enemyHeight = enemy.offsetHeight || 88;
      const enemyCenterX = enemyLeft + enemyWidth / 2;
      const horizontalGap = Math.abs(missileCenterX - enemyCenterX);
      const horizontalHit = horizontalGap <= (enemyWidth * 0.44 + missileWidth * 0.7);
      const verticalHit = missileSweepBottom >= enemyTop && missileSweepTop <= enemyTop + enemyHeight;

      if (horizontalHit && verticalHit) {
        playMissileHitSound();
        showScoreBonusPopup(
          enemyLeft + Math.max(0, enemyWidth / 2 - 34),
          enemyTop + Math.max(10, enemyHeight * 0.2),
          airKillBonusScore
        );
        respawnEnemy(enemy, state.level >= 4 ? -140 : -220, false);
        addScoreBonus(airKillBonusScore);
        hitEnemy = true;
        break;
      }
    }

    if (hitEnemy) {
      missile.remove();
      state.missiles.splice(index, 1);
    }
  }
}

function increaseFuel(amount) {
  state.fuelPercent = Math.min(100, state.fuelPercent + amount);
  updateFuelDisplay();
}

function addScoreBonus(amount) {
  state.score += amount;
  scoreDisplay.textContent = String(Math.floor(state.score));
}

function showScoreBonusPopup(left, top, amount) {
  const popup = document.createElement("div");
  popup.className = "score-bonus-popup";
  popup.textContent = `+${amount} points`;
  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
  gameArea.appendChild(popup);
  window.setTimeout(() => {
    popup.remove();
  }, 950);
}

function handleFuelDrain() {
  if (state.level < 3) {
    return;
  }

  while (state.score >= state.nextFuelDrainScore) {
    state.fuelPercent = Math.max(0, state.fuelPercent - fuelDrainStep);
    state.nextFuelDrainScore += 1000;
  }

  if (state.fuelPercent <= 0) {
    endGame("Out of fuel!");
  }

  updateFuelDisplay();
}

async function showCountdownOverlay(title, subtitle = "") {
  state.countdownRunning = true;
  syncGameplayChrome();
  const countdownValues = [3, 2, 1];
  for (const count of countdownValues) {
    message.innerHTML = `
      <div class="countdown-panel">
        <p class="countdown-eyebrow">${title}</p>
        <h2>${count}</h2>
        <p>${subtitle}</p>
      </div>
    `;
    message.classList.remove("hidden");
    syncVehiclePreviewVisibility();
    playCountdownBell(count);
    await new Promise((resolve) => window.setTimeout(resolve, 800));
  }

  message.classList.add("hidden");
  syncVehiclePreviewVisibility();
  state.countdownRunning = false;
  syncGameplayChrome();
}

function displayLevelName(levelNumber) {
  return levelNumber >= 7 ? "Final Level" : `Level ${levelNumber}`;
}

function showLevelFourSelection(targetLevel = 4) {
  state.levelFourSelectionOpen = true;
  const planeUnlocked = targetLevel >= 6 || isLevelSixVehicleUnlocked();
  const ufoUnlocked = targetLevel >= 7 || isLevelSevenVehicleUnlocked();
  const showUfoOnly = targetLevel >= 7;
  const showPlaneOnly = targetLevel >= 6;
  const headingLabel = targetLevel >= 4 ? displayLevelName(targetLevel) : "Level 4";
  message.innerHTML = `
    <div class="level-four-panel">
      <p class="countdown-eyebrow">Congratulations</p>
      <h2>Welcome To ${headingLabel}</h2>
      <p>${showUfoOnly ? "Final Level is unlocked. Choose your UFO to begin the next race." : showPlaneOnly ? "Aeroplane access is unlocked. Choose your aircraft to begin the next race." : "You are entering open water. Choose your ride to begin the next race."}</p>
      <div class="vehicle-group level-four-group">
        ${showUfoOnly || showPlaneOnly ? `
        <h3>${showUfoOnly ? "Choose Your UFO" : "Choose Your Aeroplane"}</h3>
        <div class="vehicle-grid jet-grid">
          ${showUfoOnly ? "" : `
          <button class="vehicle-option jet-select-option level-six-option ${planeUnlocked ? "" : "is-locked"}" data-jet="plane-private" data-level-six-only="true" type="button" ${planeUnlocked ? "" : "disabled"}>
            <span class="vehicle-preview plane-preview plane-private"></span>
            <span>Private Jet</span>
          </button>
          <button class="vehicle-option jet-select-option level-six-option ${planeUnlocked ? "" : "is-locked"}" data-jet="plane-golden" data-level-six-only="true" type="button" ${planeUnlocked ? "" : "disabled"}>
            <span class="vehicle-preview plane-preview plane-golden"></span>
            <span>Golden Plane</span>
          </button>
          <button class="vehicle-option jet-select-option level-six-option ${planeUnlocked ? "" : "is-locked"}" data-jet="plane-stealth" data-level-six-only="true" type="button" ${planeUnlocked ? "" : "disabled"}>
            <span class="vehicle-preview plane-preview plane-stealth"></span>
            <span>Sky Plane</span>
          </button>
          `}
          ${showUfoOnly ? `
          <button class="vehicle-option jet-select-option level-seven-option ${ufoUnlocked ? "" : "is-locked"}" data-jet="ufo-metal" data-level-seven-only="true" type="button" ${ufoUnlocked ? "" : "disabled"}>
            <span class="vehicle-preview ufo-preview ufo-metal"></span>
            <span>Metal UFO</span>
          </button>
          <button class="vehicle-option jet-select-option level-seven-option ${ufoUnlocked ? "" : "is-locked"}" data-jet="ufo-mercury" data-level-seven-only="true" type="button" ${ufoUnlocked ? "" : "disabled"}>
            <span class="vehicle-preview ufo-preview ufo-mercury"></span>
            <span>Mercury UFO</span>
          </button>
          ` : ""}
        </div>
        ` : `
        <div class="selection-choice-columns">
          <div class="selection-choice-column">
            <h3>Choose Your Boat</h3>
            <div class="selection-section-note">Boats Available Now</div>
            <div class="vehicle-grid jet-grid section-grid">
              <button class="vehicle-option jet-select-option" data-jet="jet-silver" type="button">
                <span class="vehicle-preview jet-preview jet-silver"></span>
                <span>Small Boat</span>
              </button>
              <button class="vehicle-option jet-select-option" data-jet="jet-gold" type="button">
                <span class="vehicle-preview jet-preview jet-gold"></span>
                <span>Ship</span>
              </button>
              <button class="vehicle-option jet-select-option" data-jet="jet-stealth" type="button">
                <span class="vehicle-preview jet-preview jet-stealth"></span>
                <span>Yacht</span>
              </button>
            </div>
          </div>
          <div class="selection-choice-column">
            <h3>Choose Your Aeroplane</h3>
            <div class="selection-section-note is-locked">Unlocks At Level 6</div>
            <div class="vehicle-grid jet-grid section-grid">
              <button class="vehicle-option jet-select-option level-six-option ${planeUnlocked ? "" : "is-locked"}" data-jet="plane-private" data-level-six-only="true" type="button" ${planeUnlocked ? "" : "disabled"}>
                <span class="vehicle-preview plane-preview plane-private"></span>
                <span>Private Jet</span>
              </button>
              <button class="vehicle-option jet-select-option level-six-option ${planeUnlocked ? "" : "is-locked"}" data-jet="plane-golden" data-level-six-only="true" type="button" ${planeUnlocked ? "" : "disabled"}>
                <span class="vehicle-preview plane-preview plane-golden"></span>
                <span>Golden Plane</span>
              </button>
              <button class="vehicle-option jet-select-option level-six-option ${planeUnlocked ? "" : "is-locked"}" data-jet="plane-stealth" data-level-six-only="true" type="button" ${planeUnlocked ? "" : "disabled"}>
                <span class="vehicle-preview plane-preview plane-stealth"></span>
                <span>Sky Plane</span>
              </button>
            </div>
          </div>
        </div>
        `}
      </div>
    </div>
  `;
  message.classList.remove("hidden");
  syncVehiclePreviewVisibility();

  return new Promise((resolve) => {
    const options = Array.from(message.querySelectorAll(".jet-select-option"));
    options.forEach((option) => {
      option.addEventListener("click", () => {
        state.levelFourSelectionOpen = false;
        resolve(option.dataset.jet);
      }, { once: true });
    });
  });
}

async function beginLevel(levelNumber, skipCelebration = false) {
  state.pendingTransition = true;
  state.active = false;
  state.paused = false;
  cancelAnimationFrame(state.animationId);
  stopGameOverMusic();
  stopEngineSound();
  stopWaterSound();
  stopBackgroundMusic();
  syncGameplayChrome();

  const title = levelNumber === 1 ? "Level 1 Starts" : `Entering ${displayLevelName(levelNumber)}`;
  const subtitle = levelNumber === 1
    ? "Get ready to build speed."
    : levelNumber === 2
      ? "Muddy roads ahead. Laser mode incoming."
      : levelNumber === 3
        ? "Skyline sprint. Watch your fuel."
        : levelNumber === 4
          ? "Ride the open water. Ships ahead."
          : levelNumber === 5
            ? "Level 5 begins. Keep the water run alive."
            : levelNumber === 6
              ? "Level 6 unlocked. Aeroplane access is now live."
              : "Final Level unlocked. UFO access is now live.";

  if (!skipCelebration) {
    await playLevelUpSound(levelNumber);
  }
  await showCountdownOverlay(title, subtitle);

  state.level = levelNumber;
  state.levelStartScore = state.score;
  if (levelNumber === 1) {
    state.livesRemaining = getLivesAwardForLevel(levelNumber);
  } else {
    state.livesRemaining += getLivesAwardForLevel(levelNumber);
  }
  updateLevelDisplay();
  updateLivesDisplay();
  updateVehicleUnlockUI();
  applyLevelTheme();

  if (levelNumber === 1) {
    state.baseSpeed = 0;
    state.baseSpeedTarget = 0;
    state.boostLevel = 0;
    state.boostActiveUntil = 0;
    state.levelWarmupStartAt = Date.now();
    state.levelWarmupUntil = state.levelWarmupStartAt + levelWarmupDuration(levelNumber);
    state.nextBoosterScore = Math.max(2000, state.score + 2000);
    state.nextLaserScore = 1000;
    state.nextFuelScore = 8700;
    state.nextFuelDrainScore = 9000;
    state.nextBarricadeScore = 9200;
    state.fuelPercent = 100;
  } else if (levelNumber === 2) {
    state.baseSpeed = 0;
    state.baseSpeedTarget = 0;
    state.levelWarmupStartAt = Date.now();
    state.levelWarmupUntil = state.levelWarmupStartAt + levelWarmupDuration(levelNumber);
    state.boostLevel = 0;
    state.boostActiveUntil = 0;
    state.nextLaserScore = Math.max(state.score + laserPickupGap(levelNumber), 2000);
    state.nextLevelScore = levelTwoEndScore;
    state.nextBarricadeScore = Math.max(state.score + 700, 9200);
    clearBooster();
  } else {
    if (levelNumber === 3) {
      state.baseSpeed = 0;
      state.baseSpeedTarget = 0;
      state.levelWarmupStartAt = Date.now();
      state.levelWarmupUntil = state.levelWarmupStartAt + levelWarmupDuration(levelNumber);
      state.boostActiveUntil = 0;
      state.nextLaserScore = Math.max(state.score + laserPickupGap(levelNumber), state.nextLaserScore);
      state.nextFuelScore = Math.max(state.score + 700, 8700);
      state.nextFuelDrainScore = Math.max(state.score + 1000, 9000);
      state.fuelPercent = 100;
    } else {
      state.baseSpeed = 0;
      state.baseSpeedTarget = 0;
      state.levelWarmupStartAt = Date.now();
      state.levelWarmupUntil = state.levelWarmupStartAt + levelWarmupDuration(levelNumber);
      state.boostActiveUntil = 0;
      state.nextLaserScore = Math.max(state.score + laserPickupGap(levelNumber), state.nextLaserScore);
      state.nextFuelScore = Math.max(state.score + 700, state.nextFuelScore);
      state.nextFuelDrainScore = Math.max(state.score + 1000, state.nextFuelDrainScore);
      clearBooster();
    }
  }

  state.levelTwoWarmupStartAt = 0;
  state.levelTwoWarmupUntil = 0;
  state.levelOneWarmupStartAt = 0;
  state.levelOneWarmupUntil = 0;
  state.nextMissileAt = 0;

  clearBarricades();
  clearMissiles();
  resetEnemies();
  state.playerX = middleLaneX();
  updatePlayerVerticalPosition();
  refreshSpeed();
  await primeMobileAudio();
  await startEngineSound();
  if (isWaterLevel(levelNumber)) {
    await startWaterSound();
  }
  await startBackgroundMusic(true);
  updateWaterSound();
  state.active = true;
  state.pendingTransition = false;
  state.lastFrameTime = performance.now();
  syncGameplayChrome();
  gameLoop(state.lastFrameTime);
}

function adminLevelStartScore(levelNumber) {
  if (levelNumber === 2) {
    return 8000;
  }
  if (levelNumber === 3) {
    return levelTwoEndScore;
  }
  if (levelNumber === 4) {
    return levelFourStartScore;
  }
  if (levelNumber === 5) {
    return levelFiveStartScore;
  }
  if (levelNumber === 6) {
    return levelSixStartScore;
  }
  if (levelNumber >= 7) {
    return levelSixEndScore;
  }
  return 0;
}

async function initializeRun(levelNumber = 1, startScore = 0) {
  cancelAnimationFrame(state.animationId);
  syncGameBounds();
  await primeMobileAudio();
  state.score = startScore;
  state.level = 1;
  state.livesRemaining = 0;
  state.baseSpeed = 0;
  state.baseSpeedTarget = 0;
  state.currentSpeed = 0;
  state.boostLevel = 0;
  state.boostActiveUntil = 0;
  state.levelWarmupStartAt = Date.now();
  state.levelWarmupUntil = state.levelWarmupStartAt + levelWarmupDuration(levelNumber);
  state.levelOneWarmupStartAt = 0;
  state.levelOneWarmupUntil = 0;
  state.playerX = middleLaneX();
  state.nextBoosterScore = 2000;
  state.nextLaserScore = 2000;
  state.nextFuelScore = 8700;
  state.nextFuelDrainScore = 9000;
  state.nextBarricadeScore = 9200;
  state.levelStartScore = 0;
  state.levelTwoWarmupStartAt = 0;
  state.levelTwoWarmupUntil = 0;
  state.laserActiveUntil = 0;
  state.nextMissileAt = 0;
  state.invincibleUntil = 0;
  state.reviveRunning = false;
  state.paused = false;
  state.fuelPercent = 100;
  state.pendingTransition = false;
  state.levelFourSelectionOpen = false;
  state.lastFrameTime = 0;
  state.enemyRespawns = 0;
  state.restartLevel = levelNumber;
  state.restartVehicle = state.selectedVehicle;

  roadLines.forEach((line, index) => {
    line.style.top = `${20 + index * 160}px`;
    line.style.left = "50%";
  });

  resetEnemies();
  clearBarricades();
  clearBooster();
  clearMissiles();
  state.pickupType = "";
  playerCar.style.left = `${state.playerX}px`;
  scoreDisplay.textContent = String(Math.floor(startScore));
  updateLevelDisplay();
  updateLivesDisplay();
  updateFuelDisplay();
  applyLevelTheme();
  refreshSpeed();
  updateLaserPointer();
  message.classList.add("hidden");
  syncVehiclePreviewVisibility();
  syncGameplayChrome();
  startButton.textContent = "Restart Game";

  await beginLevel(levelNumber);
}

async function startAdminLevel() {
  if (state.active || state.countdownRunning || state.pendingTransition) {
    return;
  }

  if (!state.adminUnlocked) {
    updateAdminStatus("Unlock admin access first.", false);
    return;
  }

  startButton.blur();
  const levelNumber = state.adminSelectedLevel;
  const startScore = adminLevelStartScore(levelNumber);

  toggleAdminPanel(false);
  updateCloudStatus(`Admin jump ready. Launching Level ${levelNumber}.`, true);

  if (levelNumber >= 4) {
    const selectedBoat = await showLevelFourSelection(levelNumber);
    applyVehicleSelection(selectedBoat || (levelNumber >= 7 ? "ufo-metal" : levelNumber >= 6 ? "plane-private" : "jet-silver"));
    await initializeRun(levelNumber, startScore);
    return;
  }

  await initializeRun(levelNumber, startScore);
}

function setControlState(controlName, pressed) {
  if (controlName in state.keys) {
    state.keys[controlName] = pressed;
  }
}

function updateRoadLines(deltaFrames = 1) {
  roadLines.forEach((line, index) => {
    const currentTop = parseFloat(line.style.top || line.offsetTop);
    let nextTop = currentTop + state.currentSpeed * deltaFrames;
    if (nextTop > gameBounds.height) {
      nextTop = -100;
    }
    line.style.top = `${nextTop}px`;
    line.style.left = "50%";
  });
}

function updatePlayer(deltaFrames = 1) {
  if (state.keys.ArrowLeft) {
    state.playerX -= 9 * deltaFrames;
  }
  if (state.keys.ArrowRight) {
    state.playerX += 9 * deltaFrames;
  }

  state.playerX = clampVehicleLeft(state.playerX, vehicleWidth());
  playerCar.style.left = `${state.playerX}px`;
  updateBoostMeter();
}

async function handleVehicleCrash() {
  if (Date.now() < state.invincibleUntil || state.reviveRunning || state.pendingTransition || state.countdownRunning) {
    return;
  }

  if (state.livesRemaining > 0) {
    state.livesRemaining -= 1;
    state.reviveRunning = true;
    state.active = false;
    state.paused = false;
    state.pendingTransition = true;
    syncGameplayChrome();
    cancelAnimationFrame(state.animationId);
    stopEngineSound();
    stopBackgroundMusic();
    state.playerX = middleLaneX();
    playerCar.style.left = `${state.playerX}px`;
    resetEnemies();
    clearBarricades();
    clearBooster();
    clearMissiles();
    state.baseSpeed = 0;
    state.currentSpeed = 0;
    refreshSpeed();
    updateLivesDisplay();
    playCrashSound();
    message.innerHTML = `
      <div class="countdown-panel">
        <p class="countdown-eyebrow">Life Used</p>
        <h2>${state.livesRemaining}</h2>
        <p>${state.livesRemaining === 1 ? "1 life remaining." : `${state.livesRemaining} lives remaining.`}</p>
      </div>
    `;
    message.classList.remove("hidden");
    syncVehiclePreviewVisibility();
    updateCloudStatus(
      state.livesRemaining === 1
        ? `${state.racerName}, life used. 1 life remaining.`
        : `${state.racerName}, life used. ${state.livesRemaining} lives remaining.`,
      false,
    );
    await new Promise((resolve) => window.setTimeout(resolve, 1100));
    await showCountdownOverlay(
      "Back On Track",
      state.livesRemaining === 1 ? "1 life remaining." : `${state.livesRemaining} lives remaining.`
    );
    state.invincibleUntil = Date.now() + 1800;
    await primeMobileAudio();
    await startEngineSound();
    if (isWaterLevel()) {
      await startWaterSound();
    }
    await startBackgroundMusic(true);
    updateWaterSound();
    state.active = true;
    state.pendingTransition = false;
    state.reviveRunning = false;
    state.lastFrameTime = performance.now();
    syncGameplayChrome();
    gameLoop(state.lastFrameTime);
    return;
  }

  endGame(isSkyLevel() ? "Air Crash!" : isWaterLevel() ? "Shipwreck!" : "Crash!");
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

function updateEnemies(deltaFrames = 1) {
  const laserActive = Date.now() < state.laserActiveUntil;
  for (const enemy of state.enemies) {
    const top = parseFloat(enemy.style.top);
    const respawnTop = state.level >= 4 ? -140 : -220;
    const movementStep = state.level >= 4
      ? Math.max(2.2, state.currentSpeed * 0.58) * deltaFrames
      : (state.currentSpeed + 1.2) * deltaFrames;
    let nextTop = top + movementStep;

    if (nextTop > gameBounds.height) {
      state.enemyRespawns += 1;
      const forcePlayerLane = state.level >= 4 ? Math.random() < 0.22 : state.enemyRespawns % 2 === 0;
      respawnEnemy(enemy, respawnTop, forcePlayerLane);
      continue;
    }

    enemy.style.top = `${nextTop}px`;

    if (!isSkyLevel() && laserActive && laserPointer && !laserPointer.classList.contains("hidden")) {
      const enemyRect = enemy.getBoundingClientRect();
      const pointerRect = laserPointer.getBoundingClientRect();
      const pointerInsideEnemy = !(
        pointerRect.right < enemyRect.left ||
        pointerRect.left > enemyRect.right ||
        pointerRect.bottom < enemyRect.top ||
        pointerRect.top > enemyRect.bottom
      );

      if (pointerInsideEnemy) {
        respawnEnemy(enemy, respawnTop, false);
        continue;
      }
    }

    if (Date.now() >= state.invincibleUntil && isColliding(playerCar, enemy)) {
      handleVehicleCrash();
      return;
    }
  }
}

function updateBarricades(deltaFrames = 1) {
  if (state.level !== 2) {
    clearBarricades();
    return;
  }

  const laserActive = Date.now() < state.laserActiveUntil;
  state.barricades = state.barricades.filter((barricade) => {
    const currentTop = parseFloat(barricade.style.top);
    const nextTop = currentTop + (state.currentSpeed + 0.9) * deltaFrames;

    if (nextTop > gameBounds.height) {
      barricade.remove();
      return false;
    }

    barricade.style.top = `${nextTop}px`;

    if (laserActive && !laserPointer.classList.contains("hidden") && isColliding(laserPointer, barricade)) {
      barricade.remove();
      return false;
    }

    if (Date.now() >= state.invincibleUntil && isColliding(playerCar, barricade)) {
      barricade.remove();
      handleVehicleCrash();
      return false;
    }

    return true;
  });
}

function updateBooster(deltaFrames = 1) {
  if (!state.pickup) {
    return;
  }

  updateBoosterLaneSafety();

  const top = parseFloat(state.pickup.style.top);
  let nextTop = top + (state.currentSpeed + 0.8) * deltaFrames;

  if (nextTop > gameBounds.height) {
    clearBooster();
    return;
  }

  state.pickup.style.top = `${nextTop}px`;

  if (isColliding(playerCar, state.pickup)) {
    if (state.pickupType === "booster") {
      addBoostLevel();
    } else if (state.pickupType === "laser") {
      activateLaserMode();
    } else if (state.pickupType === "fuel") {
      increaseFuel(fuelPickupRestore);
      updateCloudStatus(`${state.racerName}, fuel restored by ${fuelPickupRestore}%.`, true);
    }
    playPickupAddedSound();
    clearBooster();
  }
}

async function gameLoop(frameTime = performance.now()) {
  if (!state.active || state.paused) {
    return;
  }
  const deltaFrames = getDeltaFrames(frameTime);

  syncGameBounds();
  updateSpeedRamp();
  refreshSpeed();
  updateRoadLines(deltaFrames);
  updateSkyClouds(deltaFrames);
  updatePlayer(deltaFrames);
  updatePlayerInvincibility();
  spawnBooster();
  spawnBarricades();
  updateEnemies(deltaFrames);
  updateMissiles(deltaFrames);
  updateBarricades(deltaFrames);
  updateBooster(deltaFrames);
  updateLaserPointer();
  updateEngineSound();
  updateWaterSound();

  state.score += deltaFrames;
  handleFuelDrain();
  scoreDisplay.textContent = String(Math.floor(state.score));

  if (state.level === 1 && state.score >= 8000 && !state.pendingTransition) {
    beginLevel(2);
    return;
  }

  if (state.level === 2 && state.score >= levelTwoEndScore && !state.pendingTransition) {
    beginLevel(3);
    return;
  }

  if (state.level === 3 && state.score >= levelFourStartScore && !state.pendingTransition && !state.levelFourSelectionOpen) {
    state.pendingTransition = true;
    state.active = false;
    cancelAnimationFrame(state.animationId);
    stopEngineSound();
    stopWaterSound();
    clearBooster();
    const selectedJet = await showLevelFourSelection();
    applyVehicleSelection(selectedJet || "jet-silver");
    await beginLevel(4);
    return;
  }

  if (state.level === 4 && state.score >= levelFiveStartScore && !state.pendingTransition) {
    await beginLevel(5);
    return;
  }

  if (state.level === 5 && state.score >= levelSixStartScore && !state.pendingTransition) {
    await beginLevel(6);
    return;
  }

  if (state.level === 6 && state.score >= levelSixEndScore && !state.pendingTransition && !state.levelFourSelectionOpen) {
    state.pendingTransition = true;
    state.active = false;
    cancelAnimationFrame(state.animationId);
    stopEngineSound();
    stopWaterSound();
    clearBooster();
    await playLevelUpSound(7);
    const selectedUfo = await showLevelFourSelection(7);
    applyVehicleSelection(selectedUfo || "ufo-metal");
    await beginLevel(7, true);
    return;
  }

  if (state.level >= 4) {
    clearBarricades();
  }

  state.animationId = requestAnimationFrame(gameLoop);
}

async function startGame() {
  if (state.active || state.paused || state.countdownRunning || state.pendingTransition) {
    return;
  }

  startButton.blur();

  if (!state.user) {
    updateCloudStatus("Guest mode is active. Enjoy the race.", true);
    updateGuestAccessUI();
  }

  const restartingExistingRun = startButton.textContent === "Restart Game";
  const targetLevel = restartingExistingRun ? Math.max(1, state.restartLevel || 1) : 1;
  const targetScore = restartingExistingRun ? adminLevelStartScore(targetLevel) : 0;
  const targetVehicle = restartingExistingRun ? (state.restartVehicle || state.selectedVehicle) : state.selectedVehicle;

  applyVehicleSelection(targetVehicle);
  await initializeRun(targetLevel, targetScore);
}

function endGame(title = "Crash!") {
  state.active = false;
  state.paused = false;
  cancelAnimationFrame(state.animationId);
  stopEngineSound();
  stopWaterSound();
  stopBackgroundMusic();
  clearMissiles();
  playCrashSound();
  playGameOverSound();
  startGameOverMusic(true);
  state.restartLevel = state.level;
  state.restartVehicle = state.selectedVehicle;
  maybeUpdateBestScore();
  message.innerHTML = `
    <div class="game-over-panel">
      <h2>Game Over</h2>
      <p>${title}</p>
      <p>${state.racerName}, your run scored ${Math.floor(state.score)}.</p>
      <p>Highest score this session: ${state.bestScore}</p>
      <div class="auth-actions">
        <button id="downloadScoreCardButton" class="auth-button primary" type="button">Save Score Card</button>
        <button id="restartRunButton" class="auth-button secondary" type="button">New Game</button>
      </div>
      <div class="guest-donation-panel game-over-donation-panel">
        <p class="guest-donation-title">Support The Game</p>
        <p class="guest-donation-copy">If you loved the race, you can donate any amount to support The Viral Alien game.</p>
        <div class="guest-donation-row">
          <label class="field">
            <span>Donation Amount (Rs.)</span>
            <input id="gameOverDonationAmountInput" type="number" min="1" step="1" value="11" placeholder="Enter amount">
          </label>
          <button id="gameOverDonationButton" class="auth-button primary" type="button">Donate</button>
        </div>
      </div>
      <p>Start a fresh run and choose your vehicle again whenever you are ready.</p>
    </div>
  `;
  message.classList.add("game-over");
  message.classList.remove("hidden");
  syncVehiclePreviewVisibility();
  syncGameplayChrome();
  document.getElementById("downloadScoreCardButton").addEventListener("click", saveScoreCard);
  document.getElementById("restartRunButton").addEventListener("click", resetSessionForNewGame);
  document.getElementById("gameOverDonationButton").addEventListener("click", () => {
    const donationInput = document.getElementById("gameOverDonationAmountInput");
    openDonationCheckout({
      signedIn: Boolean(state.user),
      amountInputOverride: donationInput,
      statusTarget: "cloud",
      buttonOverride: document.getElementById("gameOverDonationButton"),
    });
  });
}

async function resumeGame() {
  if (!state.paused || state.countdownRunning || state.pendingTransition || state.reviveRunning) {
    return;
  }

  message.classList.add("hidden");
  message.classList.remove("paused-mode");
  syncVehiclePreviewVisibility();
  state.paused = false;
  state.lastFrameTime = performance.now();
  await primeMobileAudio();
  if (state.vehicleSoundEnabled || state.backgroundSoundEnabled) {
    await startEngineSound();
    if (isWaterLevel()) {
      await startWaterSound();
    }
    await startBackgroundMusic(true);
    updateEngineSound();
    updateWaterSound();
  }
  state.active = true;
  syncGameplayChrome();
  gameLoop(state.lastFrameTime);
}

function pauseGame() {
  if (!state.active || state.paused || state.countdownRunning || state.pendingTransition || state.reviveRunning) {
    return;
  }

  state.active = false;
  state.paused = true;
  state.keys.ArrowLeft = false;
  state.keys.ArrowRight = false;
  cancelAnimationFrame(state.animationId);
  stopEngineSound();
  stopWaterSound();
  stopBackgroundMusic();
  message.classList.remove("choice-mode", "guest-race-mode", "game-over");
  message.classList.add("paused-mode");
  message.innerHTML = `
    <div class="pause-panel">
      <p class="countdown-eyebrow">Race Paused</p>
      <h2>Paused</h2>
      <p>${state.racerName}, your ${vehicleLabel(state.selectedVehicle)} is holding position.</p>
      <div class="auth-actions compact">
        <button id="resumeRaceButton" class="auth-button primary" type="button">Continue Race</button>
      </div>
    </div>
  `;
  message.classList.remove("hidden");
  syncVehiclePreviewVisibility();
  syncGameplayChrome();
  document.getElementById("resumeRaceButton")?.addEventListener("click", resumeGame, { once: true });
}

function togglePauseGame() {
  if (state.paused) {
    resumeGame();
    return;
  }

  pauseGame();
}

applyVehicleSelection(state.selectedVehicle);
state.adminUnlocked = hasAdminAccess();
syncGameBounds();
refreshSpeed();
syncVehiclePreviewVisibility();
updateSoundButtons();
updateBestScoreDisplay();
updateLevelDisplay();
updateLivesDisplay();
updateFuelDisplay();
applyLevelTheme();
bindOverlayControls();
updateAdminUI();
showAuthGate();
syncGameplayChrome();
initializeSupabase();

startButton.addEventListener("click", startGame);

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && welcomeModal && !welcomeModal.classList.contains("hidden")) {
    event.preventDefault();
    triggerWelcomeStart();
  }
});

document.addEventListener("wheel", (event) => {
  if (document.body.classList.contains("is-playing")) {
    event.preventDefault();
  }
}, { passive: false });

gameArea.addEventListener("mousemove", (event) => {
  updatePointerPosition(event.clientX, event.clientY);
});

gameArea.addEventListener("touchmove", (event) => {
  const touch = event.touches[0];
  if (touch) {
    updatePointerPosition(touch.clientX, touch.clientY);
  }
}, { passive: true });

vehicleSoundButton?.addEventListener("click", async () => {
  await primeMobileAudio();
  state.vehicleSoundEnabled = !state.vehicleSoundEnabled;
  updateSoundButtons();

  if (state.vehicleSoundEnabled) {
    await startEngineSound();
    updateEngineSound();
  } else {
    stopEngineSound();
  }
});

backgroundSoundButton?.addEventListener("click", async () => {
  await primeMobileAudio();
  const nextEnabled = !(state.backgroundSoundEnabled && state.uiSoundEnabled);
  state.backgroundSoundEnabled = nextEnabled;
  state.uiSoundEnabled = nextEnabled;
  updateSoundButtons();

  if (nextEnabled) {
    if (isWaterLevel()) {
      await startWaterSound();
    }
    await startBackgroundMusic(true);
    updateWaterSound();
  } else {
    stopWaterSound();
    stopBackgroundMusic();
  }
});

pauseButton?.addEventListener("click", () => {
  togglePauseGame();
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" && (state.active || state.paused) && !state.countdownRunning && !state.pendingTransition && !state.reviveRunning) {
    event.preventDefault();
    togglePauseGame();
    return;
  }

  if (event.key in state.keys) {
    setControlState(event.key, true);
    event.preventDefault();
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

["pointerdown", "touchstart"].forEach((eventName) => {
  window.addEventListener(eventName, () => {
    primeMobileAudio();

    if ((state.vehicleSoundEnabled || state.backgroundSoundEnabled) && state.active) {
      startEngineSound();
      if (isWaterLevel()) {
        startWaterSound();
      }
      startBackgroundMusic();
      updateEngineSound();
      updateWaterSound();
    }
  }, { passive: true });
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  playUiTapSound();
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}

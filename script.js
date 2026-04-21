const gameArea = document.getElementById("gameArea");
const playerCar = document.getElementById("playerCar");
const scoreDisplay = document.getElementById("score");
const bestScoreDisplay = document.getElementById("bestScore");
const speedDisplay = document.getElementById("speedDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const livesDisplay = document.getElementById("livesDisplay");
const fuelCard = document.getElementById("fuelCard");
const fuelDisplay = document.getElementById("fuelDisplay");
const soundButton = document.getElementById("soundButton");
const startButton = document.getElementById("startButton");
const message = document.getElementById("message");
const welcomeModal = document.getElementById("welcomeModal");
const welcomeStartButton = document.getElementById("welcomeStartButton");
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
const roadWidthMeters = 14;
const targetFramesPerSecond = 60;
const boosterSpawnTop = -140;
const boosterCollectionZoneTop = 340;
const boosterSafetyDistance = 170;
const boosterWidth = 38;
const guestRunLimit = 3;
const guestRunsStorageKey = "viral-racing-guest-runs";
const guestUnlimitedSessionKey = "viral-racing-guest-unlimited";
const guestUnlimitedCouponCode = "urinfinity";
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
const laserDurationMs = 5000;
const laserSpeedMultiplier = 1.5;
const fuelDrainStep = 10;
const fuelPickupRestore = 10;
const barricadeSpawnTop = -140;
const barricadeSpawnGap = 1200;

const state = {
  active: false,
  score: 0,
  baseSpeed: levelOneBaseSpeed,
  baseSpeedTarget: levelOneBaseSpeed,
  currentSpeed: levelOneBaseSpeed,
  boostLevel: 0,
  selectedVehicle: "bike-street",
  playerX: 0,
  keys: {
    ArrowLeft: false,
    ArrowRight: false,
  },
  enemies: [],
  nextBoosterScore: 2000,
  animationId: 0,
  soundEnabled: true,
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
  barricades: [],
  nextLevelScore: 8000,
  levelStartScore: 0,
  nextLaserScore: 1000,
  nextFuelScore: 8700,
  nextFuelDrainScore: 9000,
  nextBarricadeScore: 9200,
  levelTwoWarmupStartAt: 0,
  levelTwoWarmupUntil: 0,
  laserActiveUntil: 0,
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
};

const audioState = {
  context: null,
  masterGain: null,
  engineGain: null,
  engineOscillator: null,
  engineLowpass: null,
  engineStarted: false,
  waterNoiseSource: null,
  waterNoiseGain: null,
  waterFilter: null,
  waterStarted: false,
  primeNode: null,
};

function syncGameBounds() {
  gameBounds.width = gameArea.clientWidth;
  gameBounds.height = gameArea.clientHeight;
}

function updateBestScoreDisplay() {
  bestScoreDisplay.textContent = String(state.bestScore);
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
  return 0;
}

function updateLivesDisplay() {
  if (livesDisplay) {
    livesDisplay.textContent = String(Math.max(0, state.livesRemaining));
  }
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
  const levelClass = state.level >= 4 ? "level-4" : `level-${state.level}`;
  document.body.classList.remove("level-1", "level-2", "level-3", "level-4", "level-5");
  gameArea.classList.remove("level-1", "level-2", "level-3", "level-4", "level-5");
  document.body.classList.add(levelClass);
  gameArea.classList.add(levelClass);
}

function updatePlayerInvincibility() {
  const invincible = Date.now() < state.invincibleUntil;
  playerCar.classList.toggle("is-invincible", invincible);
}

function getCurrentKmph() {
  const metersPerPixel = roadWidthMeters / gameBounds.width;
  const metersPerSecond = state.currentSpeed * targetFramesPerSecond * metersPerPixel;
  return Math.round(metersPerSecond * 3.6);
}

function overlayRefs() {
  return {
    racerGate: document.getElementById("racerGate"),
    vehicleSetup: document.getElementById("vehicleSetup"),
    authForm: document.getElementById("authForm"),
    authEmailInput: document.getElementById("authEmailInput"),
    authPasswordInput: document.getElementById("authPasswordInput"),
    authRacerNameInput: document.getElementById("authRacerNameInput"),
    authStatus: document.getElementById("authStatus"),
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
    guestDonationPanel: document.getElementById("guestDonationPanel"),
    guestDonationAmountInput: document.getElementById("guestDonationAmountInput"),
    guestDonationButton: document.getElementById("guestDonationButton"),
    guestUnlockPanel: document.getElementById("guestUnlockPanel"),
    guestUnlockInput: document.getElementById("guestUnlockInput"),
    guestUnlockButton: document.getElementById("guestUnlockButton"),
    vehicleOptions: Array.from(document.querySelectorAll(".vehicle-option")),
  };
}

function dismissWelcomeModal() {
  welcomeModal?.classList.add("hidden");
}

function triggerWelcomeStart() {
  if (welcomeModal?.classList.contains("hidden")) {
    return;
  }

  dismissWelcomeModal();
  const { authEmailInput, signInButton, guestButton } = overlayRefs();
  window.setTimeout(() => {
    authEmailInput?.focus();
    if (!authEmailInput && !state.user) {
      signInButton?.focus();
    }
    if (!state.user && !signInButton) {
      guestButton?.focus();
    }
  }, 120);
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

function getGuestRunsUsed() {
  try {
    return Math.max(0, Number(window.localStorage.getItem(guestRunsStorageKey)) || 0);
  } catch {
    return 0;
  }
}

function setGuestRunsUsed(count) {
  try {
    window.localStorage.setItem(guestRunsStorageKey, String(Math.max(0, count)));
  } catch {
    // Ignore storage write failures and keep guest mode usable for the session.
  }
}

function getGuestRunsRemaining() {
  return Math.max(0, guestRunLimit - getGuestRunsUsed());
}

function hasUnlimitedGuestAccess() {
  try {
    return window.sessionStorage.getItem(guestUnlimitedSessionKey) === "true";
  } catch {
    return false;
  }
}

function setUnlimitedGuestAccess(enabled) {
  try {
    if (enabled) {
      window.sessionStorage.setItem(guestUnlimitedSessionKey, "true");
    } else {
      window.sessionStorage.removeItem(guestUnlimitedSessionKey);
    }
  } catch {
    // Ignore session storage failures and keep the default guest rule in place.
  }
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

function isGuestLimitReached() {
  if (hasUnlimitedGuestAccess()) {
    return false;
  }
  return getGuestRunsRemaining() <= 0;
}

function consumeGuestRun() {
  const nextValue = Math.min(guestRunLimit, getGuestRunsUsed() + 1);
  setGuestRunsUsed(nextValue);
  return nextValue;
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
    authPasswordInput,
    authRacerNameInput,
    signInButton,
    signUpButton,
    guestButton,
    guestUnlockPanel,
    forgotPasswordButton,
    passwordResetPanel,
    resetPasswordInput,
    resetPasswordConfirmInput,
  } = overlayRefs();

  authPasswordInput?.closest(".field")?.classList.toggle("hidden", isActive);
  authRacerNameInput?.closest(".field")?.classList.toggle("hidden", isActive);
  signInButton?.classList.toggle("hidden", isActive);
  signUpButton?.classList.toggle("hidden", isActive);
  guestButton?.classList.toggle("hidden", isActive);
  guestUnlockPanel?.classList.toggle("hidden", true);
  forgotPasswordButton?.classList.toggle("hidden", isActive);
  passwordResetPanel?.classList.toggle("hidden", !isActive);

  if (isActive) {
    if (resetPasswordInput) {
      resetPasswordInput.value = "";
    }
    if (resetPasswordConfirmInput) {
      resetPasswordConfirmInput.value = "";
    }
  }
}

function updateGuestAccessUI() {
  const { guestButton, guestUnlockPanel, guestUnlockInput, authStatus } = overlayRefs();
  if (!guestButton) {
    return;
  }

  if (hasUnlimitedGuestAccess()) {
    guestButton.disabled = false;
    guestButton.textContent = "Play As Guest (Unlimited)";
    guestUnlockPanel?.classList.add("hidden");
    if (guestUnlockInput) {
      guestUnlockInput.value = "";
    }
    if (!state.user && authStatus) {
      updateAuthStatus("Unlimited guest mode is unlocked for this browser session. Keep racing.", true);
    }
    return;
  }

  const remaining = getGuestRunsRemaining();
  guestButton.disabled = remaining <= 0;
  guestButton.textContent = remaining <= 0
    ? "Guest Mode Over"
    : `Play As Guest (${remaining} Left)`;
  guestUnlockPanel?.classList.toggle("hidden", remaining > 0);

  if (!state.user && remaining <= 0 && authStatus) {
    updateAuthStatus("Guest mode is over on this device. Sign in, or enter your unlock code to keep racing.", false);
  }
}

function unlockUnlimitedGuestMode() {
  const { guestUnlockInput } = overlayRefs();
  const enteredCode = guestUnlockInput?.value?.trim().toLowerCase() || "";

  if (!enteredCode) {
    updateAuthStatus("Enter your guest unlock code to continue.", false);
    return;
  }

  if (enteredCode !== guestUnlimitedCouponCode) {
    updateAuthStatus("That guest unlock code did not match. Try again.", false);
    return;
  }

  setUnlimitedGuestAccess(true);
  updateGuestAccessUI();
  updateCloudStatus("Unlimited guest mode is unlocked for this browser session.", true);
  updateAuthStatus("Unlimited guest mode is unlocked. You can keep racing until this browser session ends.", true);
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
    guestDonationButton,
    supportDonationAmountInput,
    supportDonationButton,
    authEmailInput,
    authRacerNameInput,
  } = overlayRefs();
  const isSignedInSupport = Boolean(options.signedIn);
  const donationAmountInput = isSignedInSupport ? supportDonationAmountInput : guestDonationAmountInput;
  const donationButton = isSignedInSupport ? supportDonationButton : guestDonationButton;
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
    sessionModeText.textContent = state.user
      ? `${state.racerName} is signed in. Highest score is tracked in The Viral Alien game.`
      : `${state.racerName} is ready. Highest score is tracked only on this device for now.`;
  }
}

function isLevelFourVehicleUnlocked() {
  return state.level >= 4;
}

function updateVehicleUnlockUI() {
  const { vehicleOptions } = overlayRefs();
  const unlocked = isLevelFourVehicleUnlocked();

  vehicleOptions.forEach((option) => {
    const isLevelFourOnly = option.dataset.levelFourOnly === "true";
    if (!isLevelFourOnly) {
      return;
    }

    option.disabled = !unlocked;
    option.classList.toggle("is-locked", !unlocked);
  });
}

function updateProfileInputs() {
  const {
    profileNameInput,
    saveProfileButton,
    signOutButton,
    deleteProfileButton,
  } = overlayRefs();
  if (profileNameInput) {
    profileNameInput.value = isGuestRacerName() ? "" : state.racerName;
    profileNameInput.disabled = !state.user;
  }
  if (saveProfileButton) {
    saveProfileButton.disabled = !state.user;
  }
  if (signOutButton) {
    signOutButton.disabled = false;
    signOutButton.textContent = state.user ? "Sign Out" : "Sign In / Change Player";
  }
  if (deleteProfileButton) {
    deleteProfileButton.disabled = !state.user;
  }
}

function showVehicleSetup() {
  const { racerGate, vehicleSetup, authRacerNameInput } = overlayRefs();
  message.classList.remove("game-over");
  racerGate.classList.add("hidden");
  vehicleSetup.classList.remove("hidden");
  setPasswordRecoveryMode(false);
  if (authRacerNameInput) {
    authRacerNameInput.value = isGuestRacerName() ? "" : state.racerName;
  }
  updateProfileInputs();
  updateSessionModeText();
  updateBestScoreDisplay();
  updateAccessUI();
  updateGuestAccessUI();
  updateVehicleUnlockUI();
  toggleFeedbackPanel(false);
  syncGameplayChrome();
}

function showAuthGate() {
  const { racerGate, vehicleSetup } = overlayRefs();
  message.classList.remove("game-over");
  racerGate.classList.remove("hidden");
  vehicleSetup.classList.add("hidden");
  setPasswordRecoveryMode(state.passwordRecoveryMode);
  updateAccessUI();
  updateGuestAccessUI();
  toggleFeedbackPanel(false);
  syncGameplayChrome();
}

function startGuestMode(name = "") {
  if (isGuestLimitReached()) {
    showAuthGate();
    updateAuthStatus("Guest mode is over on this device. Sign in, or enter your unlock code to keep racing.", false);
    updateGuestAccessUI();
    return;
  }

  state.user = null;
  state.racerName = name && name.trim() ? name.trim() : "Guest Racer";
  state.bestScore = 0;
  state.bestScoreLevel = 1;
  state.cloudSyncActive = false;
  state.accessActive = true;
  state.accessValidUntil = "";
  updateBestScoreDisplay();
  updateSessionModeText();
  updateProfileInputs();
  updateAccessUI();
  if (hasUnlimitedGuestAccess()) {
    updateCloudStatus("Unlimited guest mode is ready for this browser session.", true);
    updateAuthStatus("Unlimited guest mode is ready. You can sign in later whenever you want.", true);
  } else {
    updateCloudStatus(`Guest mode is ready. ${getGuestRunsRemaining()} guest tries are left on this device.`, true);
    updateAuthStatus("Guest mode is ready. You can sign in later whenever you want.", true);
  }
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

  if (!state.user) {
    showGuestProfileEditor();
    showAuthGate();
    updateCloudStatus("Cloud save is ready whenever you want to sign in.", true);
    updateGuestAccessUI();
    return;
  }

  if (state.passwordRecoveryMode) {
    showAuthGate();
    setPasswordRecoveryMode(true);
    updateAuthStatus("Enter your new password below, then sign in again with it.", false);
    const { resetPasswordInput } = overlayRefs();
    window.setTimeout(() => resetPasswordInput?.focus(), 120);
    return;
  }

  updateAuthStatus(`Welcome back, ${state.racerName}.`, true);
  await loadProfile();
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
  clearBooster();
  state.score = 0;
  state.level = 1;
  state.livesRemaining = 0;
  state.bestScore = 0;
  state.bestScoreLevel = 1;
  state.boostLevel = 0;
  state.baseSpeed = levelOneBaseSpeed;
  state.baseSpeedTarget = levelOneBaseSpeed;
  state.currentSpeed = levelOneBaseSpeed;
  state.enemyRespawns = 0;
  state.nextBoosterScore = 1000;
  state.nextLaserScore = 2000;
  state.nextFuelScore = 8700;
  state.nextFuelDrainScore = 9000;
  state.nextBarricadeScore = 9200;
  state.levelStartScore = 0;
  state.levelTwoWarmupStartAt = 0;
  state.levelTwoWarmupUntil = 0;
  state.laserActiveUntil = 0;
  state.invincibleUntil = 0;
  state.reviveRunning = false;
  state.fuelPercent = 100;
  state.pendingTransition = false;
  state.levelFourSelectionOpen = false;
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
    forgotPasswordButton,
    resetPasswordButton,
    cancelResetPasswordButton,
    vehicleOptions,
    signInButton,
    signUpButton,
    guestButton,
    guestDonationButton,
    supportDonationButton,
    guestUnlockInput,
    guestUnlockButton,
    saveProfileButton,
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
      startGuestMode(authRacerNameInput?.value || "");
    });
  }

  if (guestDonationButton) {
    bindElementOnce(guestDonationButton, "GuestDonateClick", "click", () => openDonationCheckout());
  }

  if (supportDonationButton) {
    bindElementOnce(supportDonationButton, "SupportDonateClick", "click", () => openDonationCheckout({ signedIn: true }));
  }

  if (guestUnlockButton) {
    bindElementOnce(guestUnlockButton, "GuestUnlockClick", "click", unlockUnlimitedGuestMode);
  }

  if (guestUnlockInput) {
    bindElementOnce(guestUnlockInput, "GuestUnlockEnter", "keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        unlockUnlimitedGuestMode();
      }
    });
  }

  if (saveProfileButton) {
    bindElementOnce(saveProfileButton, "SaveProfileClick", "click", saveProfileName);
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
      if (!state.user) {
        showAuthGate();
        updateAuthStatus(
          "Sign in to keep your racer profile and best score updated, or jump in as a guest for local play.",
          true,
        );
        return;
      }

      if (!supabaseClient) {
        return;
      }

      await supabaseClient.auth.signOut();
      updateAuthStatus("You have signed out. You can sign in again or play as a guest.", true);
    });
  }

  if (welcomeStartButton) {
    bindElementOnce(welcomeStartButton, "WelcomeStartClick", "click", triggerWelcomeStart);
  }
}

function maybeUpdateBestScore() {
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
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
  };

  return colors[vehicleName] || "#73efff";
}

function drawVehicleBadge(ctx, vehicleName = state.selectedVehicle) {
  const accent = vehicleAccentColor(vehicleName);
  const isBike = vehicleName.startsWith("bike-");
  const isJet = vehicleName.startsWith("jet-");
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
    waterGradient.addColorStop(0, "#2aa1d4");
    waterGradient.addColorStop(0.2, "#1488c2");
    waterGradient.addColorStop(0.58, "#0d679f");
    waterGradient.addColorStop(1, "#09476f");
    ctx.fillStyle = waterGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.ellipse(220, 140, 180, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(780, 180, 240, 56, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 8;
    for (let index = 0; index < 13; index += 1) {
      const y = 280 + index * 120;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(220, y - 26, 480, y + 26, width, y - 8);
      ctx.stroke();
    }
    return;
  }

  const roadGradient = ctx.createLinearGradient(0, 0, 0, height);
  roadGradient.addColorStop(0, "#0f2746");
  roadGradient.addColorStop(1, "#050b14");
  ctx.fillStyle = roadGradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255, 209, 102, 0.08)";
  ctx.beginPath();
  ctx.arc(860, 260, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(16, 23, 32, 0.38)";
  ctx.fillRect(160, 0, 760, height);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.26)";
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

function createScoreCardImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  const scoreCardHighScore = Math.max(state.bestScore, state.score);
  const useCurrentRunDetails = state.score >= state.bestScore;
  const scoreCardBackgroundLevel = Math.max(1, Number(state.level) || 1);
  const isWaterCard = scoreCardBackgroundLevel >= 4;
  const scoreCardVehicle = useCurrentRunDetails
    ? state.selectedVehicle
    : (state.bestScoreVehicle || state.selectedVehicle);
  const scoreCardLevel = useCurrentRunDetails
    ? state.level
    : Math.max(1, Number(state.bestScoreLevel) || 1);

  drawScoreCardBackground(ctx, scoreCardBackgroundLevel, canvas.width, canvas.height);

  ctx.fillStyle = isWaterCard ? "rgba(7, 64, 96, 0.22)" : "rgba(7, 17, 28, 0.54)";
  ctx.fillRect(40, 40, 1000, 1840);
  ctx.strokeStyle = isWaterCard ? "rgba(183, 228, 255, 0.32)" : "rgba(115, 239, 255, 0.34)";
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, 1000, 1840);

  ctx.fillStyle = isWaterCard ? "rgba(8, 92, 138, 0.18)" : "rgba(7, 17, 28, 0.58)";
  ctx.fillRect(110, 90, 860, 200);
  ctx.strokeStyle = isWaterCard ? "rgba(222, 246, 255, 0.28)" : "rgba(115, 239, 255, 0.32)";
  ctx.lineWidth = 5;
  ctx.strokeRect(110, 90, 860, 200);

  if (isWaterCard) {
    ctx.fillStyle = "rgba(10, 108, 163, 0.08)";
    ctx.fillRect(120, 300, 840, 1320);

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
  } else {
    ctx.fillStyle = "#232323";
    ctx.fillRect(250, 270, 580, 1410);
    ctx.fillStyle = "#d7d7d7";
    ctx.fillRect(235, 270, 15, 1410);
    ctx.fillRect(830, 270, 15, 1410);
    ctx.fillStyle = "#ffe66d";
    for (let y = 310; y < 1620; y += 180) {
      ctx.fillRect(535, y, 10, 90);
    }
  }

  drawThreeDText(ctx, "Viral Racing Game", 540, 178, "bold 78px Verdana", "#f7fff7", "rgba(3, 10, 18, 0.85)", "rgba(115, 239, 255, 0.22)");
  drawThreeDText(ctx, "High Score Card", 540, 236, "34px Verdana", "#cfd8dc", "rgba(3, 10, 18, 0.7)", "rgba(255, 255, 255, 0.08)");

  ctx.fillStyle = isWaterCard ? "rgba(8, 52, 79, 0.52)" : "rgba(8, 18, 28, 0.72)";
  ctx.fillRect(160, 390, 760, 190);
  drawFittedCenteredThreeDText(ctx, state.racerName, 540, 485, 680, 108, 54, "#73efff", "rgba(2, 9, 18, 0.82)", "rgba(115, 239, 255, 0.18)");

  ctx.fillStyle = isWaterCard ? "rgba(8, 52, 79, 0.52)" : "rgba(8, 18, 28, 0.72)";
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

function createNoiseBuffer(context, durationSeconds = 2.5) {
  const frameCount = Math.floor(context.sampleRate * durationSeconds);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channelData = buffer.getChannelData(0);

  for (let index = 0; index < frameCount; index += 1) {
    channelData[index] = Math.random() * 2 - 1;
  }

  return buffer;
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
    "jet-silver": { wave: "sawtooth", baseFrequency: 54, steerBoost: 3, activeGain: 0.052, speedFactor: 4.1, lowpass: 520 },
    "jet-gold": { wave: "square", baseFrequency: 48, steerBoost: 2, activeGain: 0.058, speedFactor: 3.7, lowpass: 420 },
    "jet-stealth": { wave: "triangle", baseFrequency: 60, steerBoost: 2, activeGain: 0.048, speedFactor: 4.5, lowpass: 680 },
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
  const lowpass = context.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = profile.lowpass || 1600;
  oscillator.type = profile.wave;
  oscillator.frequency.value = profile.baseFrequency;
  gainNode.gain.value = 0.0001;
  oscillator.connect(lowpass);
  lowpass.connect(gainNode);
  gainNode.connect(audioState.masterGain);
  oscillator.start();

  audioState.engineOscillator = oscillator;
  audioState.engineGain = gainNode;
  audioState.engineLowpass = lowpass;
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
  if (audioState.engineLowpass) {
    audioState.engineLowpass.frequency.cancelScheduledValues(now);
    audioState.engineLowpass.frequency.linearRampToValueAtTime(profile.lowpass || 1600, now + 0.08);
  }
  audioState.engineGain.gain.cancelScheduledValues(now);
  audioState.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
}

async function startWaterSound() {
  if (!state.soundEnabled || state.level < 4) {
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
  if (!audioState.waterStarted || !state.soundEnabled || !audioState.context || !audioState.waterNoiseGain || !audioState.waterFilter) {
    return;
  }

  const now = audioState.context.currentTime;
  const targetGain = state.active && state.level === 4 ? 0.03 : 0.0001;
  const targetFrequency = 340 + state.currentSpeed * 18;

  audioState.waterFilter.frequency.cancelScheduledValues(now);
  audioState.waterFilter.frequency.linearRampToValueAtTime(targetFrequency, now + 0.12);
  audioState.waterNoiseGain.gain.cancelScheduledValues(now);
  audioState.waterNoiseGain.gain.setTargetAtTime(targetGain, now, 0.12);
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
  if (state.selectedVehicle.startsWith("bike-")) {
    return gameBounds.bikeWidth;
  }
  if (state.selectedVehicle.startsWith("jet-")) {
    return gameBounds.jetWidth;
  }
  return gameBounds.carWidth;
}

function refreshSpeed() {
  const laserMultiplier = 1;
  const levelOneBoostMultiplier = state.level === 1 ? boostMultiplier ** state.boostLevel : 1;
  state.currentSpeed = state.baseSpeed * levelOneBoostMultiplier * laserMultiplier;
  speedDisplay.textContent = `${getCurrentKmph()} km/h`;
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
  if (vehicleName.startsWith("jet-")) {
    return gameBounds.jetWidth;
  }
  return gameBounds.carWidth;
}

function updatePlayerVerticalPosition() {
  playerCar.style.top = "auto";
  playerCar.style.bottom = "18px";
}

function barricadeWidth() {
  return 56;
}

function pickEnemyVehicle() {
  const poolSource = state.level >= 4 ? birdEnemyChoices : roadEnemyVehicleChoices;
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
  const width = state.level >= 4 ? gameBounds.birdWidth : gameBounds.carWidth;
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
    audioState.engineOscillator.type = engineSoundProfile(state.selectedVehicle).wave;
    updateEngineSound();
  }
}

function syncVehiclePreviewVisibility() {
  playerCar.classList.toggle("hidden-preview", !message.classList.contains("hidden"));
}

function syncGameplayChrome() {
  const inRaceMode = Boolean(
    state.active ||
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
      state.nextLaserScore += 1000;
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
      state.nextLaserScore += 1000;
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
  state.boostLevel += 1;
  refreshSpeed();
  playBoosterSound();
}

function updateSpeedRamp() {
  if (state.level === 2) {
    const now = Date.now();
    if (state.levelTwoWarmupUntil && now < state.levelTwoWarmupUntil) {
      const warmupProgress = Math.max(
        0,
        Math.min(1, (now - state.levelTwoWarmupStartAt) / levelTwoWarmupDurationMs)
      );
      state.baseSpeed = levelTwoBaseSpeed * warmupProgress;
      state.baseSpeedTarget = levelTwoBaseSpeed;
      return;
    }

    if (state.levelTwoWarmupUntil) {
      state.levelTwoWarmupUntil = 0;
      state.baseSpeed = Math.max(state.baseSpeed, levelTwoBaseSpeed);
    }

    const scoreSpan = Math.max(1, levelTwoEndScore - state.levelStartScore);
    const progress = Math.max(0, Math.min(1, (state.score - state.levelStartScore) / scoreSpan));
    state.baseSpeedTarget = levelTwoBaseSpeed + (levelTwoTargetSpeed - levelTwoBaseSpeed) * progress;
  } else if (state.level === 4) {
    const scoreSpan = Math.max(1, levelFourEndScore - state.levelStartScore);
    const progress = Math.max(0, Math.min(1, (state.score - state.levelStartScore) / scoreSpan));
    state.baseSpeedTarget = levelFourBaseSpeed + (levelFourTargetSpeed - levelFourBaseSpeed) * progress;
  } else if (state.level >= 5) {
    state.baseSpeedTarget = levelFourTargetSpeed;
  }

  const difference = state.baseSpeedTarget - state.baseSpeed;
  if (Math.abs(difference) < 0.02) {
    state.baseSpeed = state.baseSpeedTarget;
    return;
  }

  const rampFactor = state.level === 3 ? 0.012 : 0.03;
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

  const laserActive = Date.now() < state.laserActiveUntil;
  laserPointer.classList.toggle("hidden", !laserActive);
}

function activateLaserMode() {
  state.laserActiveUntil = Date.now() + laserDurationMs;
  playBoosterSound();
  updateLaserPointer();
  refreshSpeed();
}

function increaseFuel(amount) {
  state.fuelPercent = Math.min(100, state.fuelPercent + amount);
  updateFuelDisplay();
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
    await new Promise((resolve) => window.setTimeout(resolve, 800));
  }

  message.classList.add("hidden");
  syncVehiclePreviewVisibility();
  state.countdownRunning = false;
  syncGameplayChrome();
}

function showLevelFourSelection() {
  state.levelFourSelectionOpen = true;
  message.innerHTML = `
    <div class="level-four-panel">
      <p class="countdown-eyebrow">Congratulations</p>
      <h2>Welcome To Level 4</h2>
      <p>You are entering open water. Choose your boat to begin the next race.</p>
      <div class="vehicle-group level-four-group">
        <h3>Choose Your Boat</h3>
        <div class="vehicle-grid jet-grid">
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

async function beginLevel(levelNumber) {
  state.pendingTransition = true;
  state.active = false;
  cancelAnimationFrame(state.animationId);
  stopEngineSound();
  stopWaterSound();
  syncGameplayChrome();

  const title = levelNumber === 1 ? "Level 1 Starts" : `Entering Level ${levelNumber}`;
  const subtitle = levelNumber === 1
    ? "Get ready to build speed."
    : levelNumber === 2
      ? "Muddy roads ahead. Laser mode incoming."
      : levelNumber === 3
        ? "Skyline sprint. Watch your fuel."
        : levelNumber === 4
          ? "Ride the open water. Ships ahead."
          : "Level 5 begins. Keep the water run alive.";

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
    state.baseSpeed = 2.6;
    state.baseSpeedTarget = levelOneBaseSpeed;
    state.boostLevel = 0;
    state.nextBoosterScore = Math.max(2000, state.score + 2000);
    state.nextLaserScore = 1000;
    state.nextFuelScore = 8700;
    state.nextFuelDrainScore = 9000;
    state.nextBarricadeScore = 9200;
    state.fuelPercent = 100;
  } else if (levelNumber === 2) {
    state.baseSpeed = 0;
    state.baseSpeedTarget = levelTwoBaseSpeed;
    state.levelTwoWarmupStartAt = Date.now();
    state.levelTwoWarmupUntil = state.levelTwoWarmupStartAt + levelTwoWarmupDurationMs;
    state.boostLevel = 0;
    state.nextLaserScore = Math.max(state.score + 1000, 2000);
    state.nextLevelScore = levelTwoEndScore;
    state.nextBarricadeScore = Math.max(state.score + 700, 9200);
    clearBooster();
  } else {
    state.levelTwoWarmupStartAt = 0;
    state.levelTwoWarmupUntil = 0;
    if (levelNumber === 3) {
      state.baseSpeed = Math.max(state.baseSpeed, levelThreeStartSpeed);
      state.baseSpeedTarget = levelThreeTargetBaseSpeed;
      state.nextLaserScore = Math.max(state.score + 1000, state.nextLaserScore);
      state.nextFuelScore = Math.max(state.score + 700, 8700);
      state.nextFuelDrainScore = Math.max(state.score + 1000, 9000);
      state.fuelPercent = 100;
    } else {
      state.baseSpeed = levelNumber === 4 ? levelFourBaseSpeed : levelFourTargetSpeed;
      state.baseSpeedTarget = levelFourTargetSpeed;
      state.nextLaserScore = Math.max(state.score + 1000, state.nextLaserScore);
      state.nextFuelScore = Math.max(state.score + 700, state.nextFuelScore);
      state.nextFuelDrainScore = Math.max(state.score + 1000, state.nextFuelDrainScore);
      clearBooster();
    }
  }

  clearBarricades();
  resetEnemies();
  state.playerX = middleLaneX();
  updatePlayerVerticalPosition();
  refreshSpeed();
  await primeMobileAudio();
  await startEngineSound();
  if (levelNumber >= 4) {
    await startWaterSound();
  }
  updateWaterSound();
  state.active = true;
  state.pendingTransition = false;
  syncGameplayChrome();
  gameLoop();
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
  return 0;
}

async function initializeRun(levelNumber = 1, startScore = 0) {
  cancelAnimationFrame(state.animationId);
  syncGameBounds();
  await primeMobileAudio();
  state.score = startScore;
  state.level = 1;
  state.livesRemaining = 0;
  state.baseSpeed = levelOneBaseSpeed;
  state.baseSpeedTarget = levelOneBaseSpeed;
  state.currentSpeed = levelOneBaseSpeed;
  state.boostLevel = 0;
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
  state.invincibleUntil = 0;
  state.reviveRunning = false;
  state.fuelPercent = 100;
  state.pendingTransition = false;
  state.levelFourSelectionOpen = false;
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
  state.pickupType = "";
  playerCar.style.left = `${state.playerX}px`;
  scoreDisplay.textContent = String(startScore);
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

  if (levelNumber === 4) {
    const selectedBoat = await showLevelFourSelection();
    applyVehicleSelection(selectedBoat || "jet-silver");
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

function updateRoadLines() {
  roadLines.forEach((line, index) => {
    const currentTop = parseFloat(line.style.top || line.offsetTop);
    let nextTop = currentTop + state.currentSpeed;
    if (nextTop > gameBounds.height) {
      nextTop = -100;
    }
    line.style.top = `${nextTop}px`;
    line.style.left = "50%";
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

async function handleVehicleCrash() {
  if (Date.now() < state.invincibleUntil || state.reviveRunning || state.pendingTransition || state.countdownRunning) {
    return;
  }

  if (state.livesRemaining > 0) {
    state.livesRemaining -= 1;
    state.reviveRunning = true;
    state.active = false;
    state.pendingTransition = true;
    syncGameplayChrome();
    cancelAnimationFrame(state.animationId);
    stopEngineSound();
    state.playerX = middleLaneX();
    playerCar.style.left = `${state.playerX}px`;
    resetEnemies();
    clearBarricades();
    clearBooster();
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
    if (state.level >= 4) {
      await startWaterSound();
    }
    updateWaterSound();
    state.active = true;
    state.pendingTransition = false;
    state.reviveRunning = false;
    syncGameplayChrome();
    gameLoop();
    return;
  }

  endGame(state.level >= 4 ? "Shipwreck!" : "Crash!");
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
  const laserActive = Date.now() < state.laserActiveUntil;
  for (const enemy of state.enemies) {
    const top = parseFloat(enemy.style.top);
    const enemyWidth = enemyVehicleWidth(enemy.dataset.vehicle || "car-sport");
    const respawnTop = state.level >= 4 ? -140 : -220;
    const movementStep = state.level >= 4
      ? Math.max(2.2, state.currentSpeed * 0.58)
      : state.currentSpeed + 1.2;
    let nextTop = top + movementStep;

    if (nextTop > gameBounds.height) {
      nextTop = respawnTop;
      state.enemyRespawns += 1;
      const occupiedLanes = state.enemies
        .filter((item) => item !== enemy)
        .map((item) => ({
          left: parseFloat(item.style.left),
          width: enemyVehicleWidth(item.dataset.vehicle || "car-sport"),
        }));
      const forcePlayerLane = state.level >= 4 ? Math.random() < 0.22 : state.enemyRespawns % 2 === 0;
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

    if (laserActive && laserPointer && !laserPointer.classList.contains("hidden")) {
      const enemyRect = enemy.getBoundingClientRect();
      const pointerRect = laserPointer.getBoundingClientRect();
      const pointerInsideEnemy = !(
        pointerRect.right < enemyRect.left ||
        pointerRect.left > enemyRect.right ||
        pointerRect.bottom < enemyRect.top ||
        pointerRect.top > enemyRect.bottom
      );

      if (pointerInsideEnemy) {
        nextTop = respawnTop;
        const nextLane = chooseEnemyX(
          state.enemies.filter((item) => item !== enemy).map((item) => parseFloat(item.style.left)),
          false
        );
        const nextVehicle = pickEnemyVehicle();
        const nextWidth = enemyVehicleWidth(nextVehicle);
        enemy.dataset.vehicle = nextVehicle;
        enemy.className = `vehicle enemy-vehicle ${nextVehicle}`;
        enemy.style.left = `${clampVehicleLeft(nextLane, nextWidth)}px`;
        enemy.style.top = `${nextTop}px`;
        continue;
      }
    }

    if (Date.now() >= state.invincibleUntil && isColliding(playerCar, enemy)) {
      handleVehicleCrash();
      return;
    }
  }
}

function updateBarricades() {
  if (state.level !== 2) {
    clearBarricades();
    return;
  }

  const laserActive = Date.now() < state.laserActiveUntil;
  state.barricades = state.barricades.filter((barricade) => {
    const currentTop = parseFloat(barricade.style.top);
    const nextTop = currentTop + state.currentSpeed + 0.9;

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

function updateBooster() {
  if (!state.pickup) {
    return;
  }

  updateBoosterLaneSafety();

  const top = parseFloat(state.pickup.style.top);
  let nextTop = top + state.currentSpeed + 0.8;

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
    clearBooster();
  }
}

async function gameLoop() {
  if (!state.active) {
    return;
  }

  syncGameBounds();
  updateSpeedRamp();
  refreshSpeed();
  updateRoadLines();
  updatePlayer();
  updatePlayerInvincibility();
  spawnBooster();
  spawnBarricades();
  updateEnemies();
  updateBarricades();
  updateBooster();
  updateLaserPointer();
  updateEngineSound();
  updateWaterSound();

  state.score += 1;
  handleFuelDrain();
  scoreDisplay.textContent = String(state.score);

  if (state.level === 1 && (getCurrentKmph() > 120 || state.score >= 8000) && !state.pendingTransition) {
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

  if (state.level >= 4) {
    clearBarricades();
  }

  state.animationId = requestAnimationFrame(gameLoop);
}

async function startGame() {
  if (state.active || state.countdownRunning || state.pendingTransition) {
    return;
  }

  startButton.blur();

  if (!state.user) {
    if (isGuestLimitReached()) {
      showAuthGate();
      updateCloudStatus("Guest mode is over on this device. Sign in, or enter your unlock code to keep racing.", false);
      updateAuthStatus("Guest mode is over on this device. Sign in, or enter your unlock code to keep racing.", false);
      updateGuestAccessUI();
      return;
    }

    if (hasUnlimitedGuestAccess()) {
      updateCloudStatus("Unlimited guest mode is active for this browser session.", true);
    } else {
      const usedRuns = consumeGuestRun();
      const remainingRuns = Math.max(0, guestRunLimit - usedRuns);
      updateCloudStatus(
        remainingRuns > 0
          ? `Guest mode is active. ${remainingRuns} guest tries are left on this device.`
          : "Guest mode is over on this device after this run. Sign in or unlock unlimited guest mode next time.",
        remainingRuns > 0,
      );
    }
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
  cancelAnimationFrame(state.animationId);
  stopEngineSound();
  stopWaterSound();
  playCrashSound();
  state.restartLevel = state.level;
  state.restartVehicle = state.selectedVehicle;
  maybeUpdateBestScore();
  message.innerHTML = `
    <div class="game-over-panel">
      <p class="game-over-eyebrow">Race Over</p>
      <h2>${title}</h2>
      <p>${state.racerName}, your run scored ${state.score}.</p>
      <p>Highest score this session: ${state.bestScore}</p>
      <div class="auth-actions">
        <button id="downloadScoreCardButton" class="auth-button primary" type="button">Save Score Card</button>
        <button id="newGameButton" class="auth-button secondary" type="button">New Game</button>
      </div>
      <p>Press Restart Game to try again with the same vehicle, or choose New Game to reset best score and select another vehicle.</p>
    </div>
  `;
  message.classList.add("game-over");
  message.classList.remove("hidden");
  syncVehiclePreviewVisibility();
  syncGameplayChrome();
  document.getElementById("downloadScoreCardButton").addEventListener("click", saveScoreCard);
  document.getElementById("newGameButton").addEventListener("click", resetSessionForNewGame);
}

applyVehicleSelection(state.selectedVehicle);
state.adminUnlocked = hasAdminAccess();
syncGameBounds();
refreshSpeed();
syncVehiclePreviewVisibility();
updateSoundButton();
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

gameArea.addEventListener("mousemove", (event) => {
  updatePointerPosition(event.clientX, event.clientY);
});

gameArea.addEventListener("touchmove", (event) => {
  const touch = event.touches[0];
  if (touch) {
    updatePointerPosition(touch.clientX, touch.clientY);
  }
}, { passive: true });

soundButton.addEventListener("click", async () => {
  await primeMobileAudio();
  state.soundEnabled = !state.soundEnabled;
  updateSoundButton();

  if (state.soundEnabled) {
    await startEngineSound();
    if (state.level >= 4) {
      await startWaterSound();
    }
    updateEngineSound();
    updateWaterSound();
  } else {
    stopEngineSound();
    stopWaterSound();
  }
});

window.addEventListener("keydown", (event) => {
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

    if (state.soundEnabled && state.active) {
      startEngineSound();
      if (state.level >= 4) {
        startWaterSound();
      }
      updateEngineSound();
      updateWaterSound();
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}

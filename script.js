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
const guestRunLimit = 3;
const guestRunsStorageKey = "viral-racing-guest-runs";

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
  supabaseReady: false,
  user: null,
  cloudSyncActive: false,
  enemyRespawns: 0,
  racerName: "Guest Racer",
  bestScore: 0,
  bestScoreVehicle: "bike-street",
  accessActive: false,
  accessValidUntil: "",
  accessBusy: false,
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
    authForm: document.getElementById("authForm"),
    authEmailInput: document.getElementById("authEmailInput"),
    authPasswordInput: document.getElementById("authPasswordInput"),
    authRacerNameInput: document.getElementById("authRacerNameInput"),
    authStatus: document.getElementById("authStatus"),
    sessionModeText: document.getElementById("sessionModeText"),
    cloudStatus: document.getElementById("cloudStatus"),
    accessPanel: document.getElementById("accessPanel"),
    accessStatus: document.getElementById("accessStatus"),
    payAccessButton: document.getElementById("payAccessButton"),
    refreshAccessButton: document.getElementById("refreshAccessButton"),
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
    signInButton: document.getElementById("signInButton"),
    signUpButton: document.getElementById("signUpButton"),
    guestButton: document.getElementById("guestButton"),
    vehicleOptions: Array.from(document.querySelectorAll(".vehicle-option")),
  };
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

function isGuestLimitReached() {
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

function updateGuestAccessUI() {
  const { guestButton, authStatus } = overlayRefs();
  if (!guestButton) {
    return;
  }

  const remaining = getGuestRunsRemaining();
  guestButton.disabled = remaining <= 0;
  guestButton.textContent = remaining <= 0
    ? "Guest Mode Over"
    : `Play As Guest (${remaining} Left)`;

  if (!state.user && remaining <= 0 && authStatus) {
    updateAuthStatus("Guest mode is over on this device. Sign in to keep racing.", false);
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
  accessStatus.textContent = state.accessActive
    ? `${state.racerName}, your paid pass is active until ${expiryText}.`
    : expiryText
      ? `${state.racerName}, your last pass expired. Pay Rs.1 to reactivate until 24 hours from payment.`
      : `${state.racerName}, pay Rs.1 to unlock 24 hours of signed-in play. Your scores and profile stay saved either way.`;

  payAccessButton.disabled = state.accessBusy;
  refreshAccessButton.disabled = state.accessBusy;
  payAccessButton.textContent = state.accessActive ? "Extend Another 24 Hours" : "Pay Rs.1 for 24 Hours";
  startButton.disabled = Boolean(state.user && !state.accessActive);
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

  updateCloudStatus("Cloud save is ready whenever you want to sign in.", true);

  try {
    const { data, error } = await withTimeout(supabaseClient.auth.getSession());

    if (error) {
      throw error;
    }

    state.supabaseReady = true;
    updateCloudStatus("Your cloud garage is ready.", true);

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      handleSessionChange(session);
    });

    if (data?.session) {
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
      .select("racer_name, best_score, favorite_vehicle, best_score_vehicle")
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
        }, { onConflict: "user_id" });

      if (upsertError) {
        throw upsertError;
      }

      const { data: createdProfile, error: createdProfileError } = await supabaseClient
        .from("profiles")
        .select("racer_name, best_score, favorite_vehicle, best_score_vehicle")
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
        ondismiss: () => {
          state.accessBusy = false;
          updateAccessUI();
          updateCloudStatus("Payment window closed. Your pass has not changed.", true);
        },
      },
    });

    checkout.open();
  } catch (error) {
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

function updateProfileInputs() {
  const {
    profileNameInput,
    saveProfileButton,
    signOutButton,
    deleteProfileButton,
    payAccessButton,
    refreshAccessButton,
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
  if (payAccessButton) {
    payAccessButton.disabled = !state.user || state.accessBusy;
  }
  if (refreshAccessButton) {
    refreshAccessButton.disabled = !state.user || state.accessBusy;
  }
}

function showVehicleSetup() {
  const { racerGate, vehicleSetup, authRacerNameInput } = overlayRefs();
  racerGate.classList.add("hidden");
  vehicleSetup.classList.remove("hidden");
  if (authRacerNameInput) {
    authRacerNameInput.value = isGuestRacerName() ? "" : state.racerName;
  }
  updateProfileInputs();
  updateSessionModeText();
  updateBestScoreDisplay();
  updateAccessUI();
  updateGuestAccessUI();
  toggleFeedbackPanel(false);
}

function showAuthGate() {
  const { racerGate, vehicleSetup } = overlayRefs();
  racerGate.classList.remove("hidden");
  vehicleSetup.classList.add("hidden");
  updateAccessUI();
  updateGuestAccessUI();
  toggleFeedbackPanel(false);
}

function startGuestMode(name = "") {
  if (isGuestLimitReached()) {
    showAuthGate();
    updateAuthStatus("Guest mode is over on this device. Sign in to keep racing.", false);
    updateGuestAccessUI();
    return;
  }

  state.user = null;
  state.racerName = name && name.trim() ? name.trim() : "Guest Racer";
  state.bestScore = 0;
  state.cloudSyncActive = false;
  state.accessActive = true;
  state.accessValidUntil = "";
  updateBestScoreDisplay();
  updateSessionModeText();
  updateProfileInputs();
  updateAccessUI();
  updateCloudStatus(`Guest mode is ready. ${getGuestRunsRemaining()} guest tries are left on this device.`, true);
  updateAuthStatus("Guest mode is ready. You can sign in later whenever you want.", true);
  showVehicleSetup();
}

function showGuestProfileEditor() {
  state.racerName = "Guest Racer";
  state.bestScore = 0;
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

  updateAuthStatus(`Welcome back, ${state.racerName}.`, true);
  await loadProfile();
  await loadAccessPass();
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
  updateAuthStatus(`Choose a vehicle for ${state.racerName}. Best score has been reset.`, true);
  message.classList.remove("hidden");
  syncVehiclePreviewVisibility();
  startButton.textContent = "Start Game";
}

function bindOverlayControls() {
  const {
    authForm,
    authEmailInput,
    authPasswordInput,
    authRacerNameInput,
    vehicleOptions,
    signInButton,
    signUpButton,
    guestButton,
    saveProfileButton,
    signOutButton,
    deleteProfileButton,
    feedbackToggleButton,
    sendFeedbackButton,
    cancelFeedbackButton,
    payAccessButton,
    refreshAccessButton,
  } = overlayRefs();

  vehicleOptions.forEach((option) => {
    option.classList.toggle("selected", option.dataset.vehicle === state.selectedVehicle);
    option.addEventListener("click", () => {
      overlayRefs().vehicleOptions.forEach((item) => item.classList.remove("selected"));
      option.classList.add("selected");
      applyVehicleSelection(option.dataset.vehicle);
    });
  });

  if (authForm) {
    authForm.addEventListener("submit", (event) => event.preventDefault());
  }

  if (signInButton) {
    signInButton.addEventListener("click", async () => {
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
    signUpButton.addEventListener("click", async () => {
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

  if (guestButton) {
    guestButton.addEventListener("click", () => {
      startGuestMode(authRacerNameInput?.value || "");
    });
  }

  if (saveProfileButton) {
    saveProfileButton.addEventListener("click", saveProfileName);
  }

  if (deleteProfileButton) {
    deleteProfileButton.addEventListener("click", deletePlayerData);
  }

  if (feedbackToggleButton) {
    feedbackToggleButton.addEventListener("click", () => {
      toggleFeedbackPanel(true);
    });
  }

  if (cancelFeedbackButton) {
    cancelFeedbackButton.addEventListener("click", () => {
      toggleFeedbackPanel(false);
    });
  }

  if (sendFeedbackButton) {
    sendFeedbackButton.addEventListener("click", submitFeedback);
  }

  if (payAccessButton) {
    payAccessButton.addEventListener("click", openPaidAccessCheckout);
  }

  if (refreshAccessButton) {
    refreshAccessButton.addEventListener("click", loadAccessPass);
  }

  if (signOutButton) {
    signOutButton.addEventListener("click", async () => {
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
}

function maybeUpdateBestScore() {
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    state.bestScoreVehicle = state.selectedVehicle;
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
  };

  return colors[vehicleName] || "#73efff";
}

function drawVehicleBadge(ctx, vehicleName = state.selectedVehicle) {
  const accent = vehicleAccentColor(vehicleName);
  const isBike = vehicleName.startsWith("bike-");
  const isTruck = vehicleName === "car-truck";
  const isElectric = vehicleName.includes("electric");
  const isMuscle = vehicleName === "car-muscle";
  const isSport = vehicleName === "car-sport";
  const isDirt = vehicleName === "bike-dirt";

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
  const scoreCardVehicle = state.bestScoreVehicle || state.selectedVehicle;

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

  drawVehicleBadge(ctx, scoreCardVehicle);

  ctx.fillStyle = "#73efff";
  ctx.font = "bold 44px Verdana";
  ctx.fillText("Highest Score Vehicle", 540, 1470);
  drawFittedCenteredText(ctx, prettifyVehicleName(scoreCardVehicle), 540, 1530, 520, 58, 34, "#f7fff7");

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
  if (state.user && !state.accessActive) {
    updateCloudStatus("Your profile is ready, but your 24-hour pass is not active yet. Pay Rs.1 to unlock signed-in play.", false);
    updateAccessUI();
    return;
  }

  if (!state.user) {
    if (isGuestLimitReached()) {
      showAuthGate();
      updateCloudStatus("Guest mode is over on this device. Sign in to keep racing.", false);
      updateAuthStatus("Guest mode is over on this device. Sign in to keep racing.", false);
      updateGuestAccessUI();
      return;
    }

    const usedRuns = consumeGuestRun();
    const remainingRuns = Math.max(0, guestRunLimit - usedRuns);
    updateCloudStatus(
      remainingRuns > 0
        ? `Guest mode is active. ${remainingRuns} guest tries are left on this device.`
        : "Guest mode is over on this device after this run. Sign in to keep racing next time.",
      remainingRuns > 0,
    );
    updateGuestAccessUI();
  }

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
initializeSupabase();

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

// frontend/src/analytics.js
// -----------------------------------------------------------------------------
// TBH analytics layer (GA4 via react-ga4). One place for ALL tracking so that:
//   - privacy rules are enforced centrally (no text / handles / tokens / emails)
//   - every event automatically carries channel, display mode, in-app browser
//   - components only call track("event_name", { small, safe, params })
//
// This REPLACES the existing ReactGA.initialize("G-XXXX") line in main.jsx and the
// pageview effect in App.jsx. It does not add a second GA install.
// -----------------------------------------------------------------------------
import ReactGA from "react-ga4";

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID; // not a secret
const IS_DEV = import.meta.env.DEV;
const SEND_IN_DEV = import.meta.env.VITE_GA_SEND_IN_DEV === "true";
const DEBUG =
  IS_DEV || new URLSearchParams(window.location.search).get("ga_debug") === "1";

let initialized = false;

/* ----------------------------- safe storage ------------------------------ */
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
const ssGet = (k) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const ssSet = (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } };
const ssDel = (k) => { try { sessionStorage.removeItem(k); } catch { /* ignore */ } };

/* ------------------------------- privacy --------------------------------- */
// Keys that must never reach GA4, whatever a component passes by mistake.
const FORBIDDEN_KEYS = new Set([
  "text", "message", "msg", "confession", "username", "handle", "instagram",
  "email", "token", "code", "password", "phone", "name", "anonymous_name",
  "anonymousname", "identity", "recipient", "user_id", "userid", "id",
]);
const EMAIL_RE = /\S+@\S+\.\S+/;

function sanitize(params) {
  const out = {};
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null) continue;
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) continue;

    if (typeof value === "string") {
      const v = value.trim();
      if (!v || EMAIL_RE.test(v) || v.startsWith("@")) continue; // looks like PII
      out[key] = v.slice(0, 100);
    } else if (typeof value === "number") {
      if (Number.isFinite(value)) out[key] = value;
    } else if (typeof value === "boolean") {
      out[key] = value ? "yes" : "no"; // reliable for custom dimensions
    }
  }
  return out;
}

/* ------------------------------ bucket helpers --------------------------- */
// Buckets keep cardinality low (GA4 custom dimensions have limits) and keep
// reports readable.
export const lengthBucket = (n) =>
  n <= 0 ? "0" : n <= 20 ? "1-20" : n <= 60 ? "21-60" : n <= 140 ? "61-140" : n <= 300 ? "141-300" : "300+";
export const countBucket = (n) =>
  n <= 0 ? "0" : n === 1 ? "1" : n <= 3 ? "2-3" : n <= 10 ? "4-10" : "11+";
export const durationBucket = (s) =>
  s < 10 ? "<10s" : s < 30 ? "10-30s" : s < 60 ? "30-60s" : s < 180 ? "1-3m" : "3m+";
export const hoursBucket = (h) =>
  h < 1 ? "<1h" : h < 6 ? "1-6h" : h < 24 ? "6-24h" : h < 72 ? "1-3d" : "3d+";

/* ----------------------------- environment info -------------------------- */
function detectInAppBrowser() {
  const ua = navigator.userAgent || "";
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV/i.test(ua)) return "facebook";
  if (/Snapchat/i.test(ua)) return "snapchat";
  if (/LinkedInApp/i.test(ua)) return "linkedin";
  if (/WhatsApp/i.test(ua)) return "whatsapp";
  return "none";
}

function detectOS() {
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Windows|Macintosh|Linux/i.test(ua)) return "desktop";
  return "other";
}

export function getDisplayMode() {
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  return standalone ? "standalone" : "browser";
}

/* ------------------------------ attribution ------------------------------ */
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];

function readReferrerHost() {
  try {
    if (!document.referrer) return "";
    const host = new URL(document.referrer).hostname.replace(/^www\./, "");
    return host === window.location.hostname.replace(/^www\./, "") ? "" : host;
  } catch {
    return "";
  }
}

// Runs BEFORE the router so a redirect from / to /instagram can't lose the UTMs.
function captureAttribution() {
  const params = new URLSearchParams(window.location.search);
  const utm = {};
  UTM_KEYS.forEach((k) => {
    const v = params.get(k);
    if (v) utm[k] = v.toLowerCase().slice(0, 50);
  });

  const refHost = readReferrerHost();
  let current = null;

  if (utm.utm_source) {
    current = {
      source: utm.utm_source,
      medium: utm.utm_medium || "(none)",
      campaign: utm.utm_campaign || "(none)",
      content: utm.utm_content || "(none)",
    };
  } else if (refHost) {
    current = { source: refHost, medium: "referral", campaign: "(none)", content: "(none)" };
  }

  if (current) ssSet("tbh_attr_session", JSON.stringify(current));

  if (!lsGet("tbh_first_touch")) {
    const first = current || { source: "(direct)", medium: "(none)", campaign: "(none)", content: "(none)" };
    lsSet("tbh_first_touch", JSON.stringify(first));
    lsSet("tbh_first_seen", String(Date.now()));
  }
}

function readJSON(raw) { try { return raw ? JSON.parse(raw) : null; } catch { return null; } }
const getSessionAttribution = () => readJSON(ssGet("tbh_attr_session"));
const getFirstTouch = () => readJSON(lsGet("tbh_first_touch"));

export function getSessionChannel() {
  const a = getSessionAttribution();
  return a ? `${a.source} / ${a.medium}` : "(direct)";
}

/* ------------------------------ user stage ------------------------------- */
// Lightweight lifecycle label stored as a GA4 USER property, so any report can
// be segmented by "how far has this person gotten".
const STAGES = ["visitor", "authenticated", "sender", "receiver", "chatter", "revealed"];

export function setUserStage(stage) {
  const current = lsGet("tbh_stage") || "visitor";
  if (STAGES.indexOf(stage) <= STAGES.indexOf(current)) return; // only move forward
  lsSet("tbh_stage", stage);
  setUserProperties({ user_stage: stage });
}

function setUserProperties(props) {
  if (!initialized) return;
  try { ReactGA.gtag("set", "user_properties", sanitize(props)); } catch { /* ignore */ }
}

/* --------------------------------- core ---------------------------------- */
function defaultParams() {
  return {
    session_channel: getSessionChannel(),
    display_mode: getDisplayMode(),
    in_app_browser: detectInAppBrowser(),
    logged_in: !!lsGet("token"),
  };
}

export function track(name, params = {}, opts = {}) {
  if (!initialized) return;
  const payload = { ...defaultParams(), ...sanitize(params) };
  if (opts.beacon) payload.transport_type = "beacon"; // survives page unload
  try { ReactGA.event(name, payload); } catch { /* never break the app for analytics */ }
}

export function trackOnce(name, params = {}, scope = "session") {
  const key = `tbh_once_${name}`;
  const get = scope === "ever" ? lsGet : ssGet;
  const set = scope === "ever" ? lsSet : ssSet;
  if (get(key)) return false;
  set(key, "1");
  track(name, params);
  return true;
}

export function incrementCounter(name) {
  const key = `tbh_count_${name}`;
  const next = Number(lsGet(key) || 0) + 1;
  lsSet(key, String(next));
  return next;
}

/* -------------------------------- timers --------------------------------- */
export const startTimer = (name) => ssSet(`tbh_t_${name}`, String(Date.now()));
export function elapsed(name) {
  const start = Number(ssGet(`tbh_t_${name}`));
  return start ? Math.round((Date.now() - start) / 1000) : undefined;
}
export function endTimer(name) {
  const s = elapsed(name);
  ssDel(`tbh_t_${name}`);
  return s;
}

/* ------------------------------ error helper ----------------------------- */
// Turns an error/status into a SAFE category (never the raw message).
export function errorReason(err, status) {
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server_error";
  if (status === 401 || status === 403) return "unauthorized";
  if (status >= 400) return "rejected";
  if (err instanceof TypeError) return "network";
  const msg = String(err?.message || "").toLowerCase();
  if (/moderat|inappropriate|not allowed|blocked|abusive/.test(msg)) return "moderated";
  if (/limit/.test(msg)) return "limit";
  return "unknown";
}

/* ------------------------------- pageviews ------------------------------- */
// IDs in the URL (/confessions/abc123) would fragment reports, so we send the
// route pattern instead.
export function normalizePath(path) {
  return path
    .replace(/^\/confessions\/[^/]+/, "/confessions/:id")
    .replace(/^\/chat\/[^/]+/, "/chat/:id");
}

const TITLES = {
  "/": "Confess (Home)",
  "/instagram": "Instagram Login",
  "/inbox": "Inbox",
  "/confessions/:id": "Confession Details",
  "/chat/:id": "Chat",
};

let currentScreen = null;
let visibleSince = null;
let accumulatedMs = 0;

function flushScreenTime(reason, beacon = false) {
  if (!currentScreen) return;
  const ms = accumulatedMs + (visibleSince ? Date.now() - visibleSince : 0);
  if (ms >= 500) {
    track(
      "screen_time",
      { screen: currentScreen, seconds: Math.round(ms / 1000), time_bucket: durationBucket(ms / 1000), reason },
      { beacon },
    );
  }
  accumulatedMs = 0;
  visibleSince = document.visibilityState === "visible" ? Date.now() : null;
}

export function trackPageview(location) {
  if (!initialized) return;
  const path = normalizePath(location.pathname);
  if (path.startsWith("/admin")) return; // keep admin traffic out of product data

  flushScreenTime("navigate");
  currentScreen = path;

  try {
    ReactGA.gtag("event", "page_view", {
      page_path: path + (location.search || ""),
      page_location: window.location.origin + path + (location.search || ""),
      page_title: TITLES[path] || document.title,
    });
  } catch { /* ignore */ }
}

function installVisibilityTracking() {
  visibleSince = document.visibilityState === "visible" ? Date.now() : null;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      if (visibleSince) accumulatedMs += Date.now() - visibleSince;
      visibleSince = null;
    } else {
      visibleSince = Date.now();
    }
  });

  window.addEventListener("pagehide", () => flushScreenTime("exit", true));
}

/* ------------------------------- JS errors ------------------------------- */
function installErrorTracking() {
  let sent = 0;
  const send = (type, detail) => {
    if (sent++ >= 5) return; // cap per page load
    track("js_error", { type, detail: String(detail || "").slice(0, 80) });
  };
  window.addEventListener("error", (e) =>
    send("error", `${e.error?.name || "Error"}@${(e.filename || "").split("/").pop()}:${e.lineno}`),
  );
  window.addEventListener("unhandledrejection", (e) =>
    send("promise", e.reason?.name || "Rejection"),
  );
}

/* ---------------------------------- PWA ---------------------------------- */
let deferredInstallPrompt = null;
const installListeners = new Set();
const notifyInstall = () => installListeners.forEach((fn) => fn(!!deferredInstallPrompt));

// UI can subscribe so a button appears the moment the browser says "installable".
export function subscribeInstallAvailability(fn) {
  installListeners.add(fn);
  fn(!!deferredInstallPrompt); // current value immediately
  return () => installListeners.delete(fn);
}

function installPwaTracking() {
  // We deliberately do NOT preventDefault(), so the browser's own install UI
  // keeps working. Call promptPwaInstall() from your own button if you add one.
  window.addEventListener("beforeinstallprompt", (e) => {
    deferredInstallPrompt = e;
    trackOnce("pwa_install_available", {}, "session");
    notifyInstall();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    lsSet("tbh_pwa_installed", "1");
    setUserProperties({ pwa_installed: "yes" });
    track("pwa_installed");
    notifyInstall();
  });
}

export const canInstallPwa = () => !!deferredInstallPrompt;

export const isIOSSafariBrowser = () =>
  detectOS() === "ios" && detectInAppBrowser() === "none" && getDisplayMode() === "browser";

export async function promptPwaInstall(placement = "unknown") {
  if (!deferredInstallPrompt) return null;
  track("pwa_install_prompt_shown", { placement });
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  track(outcome === "accepted" ? "pwa_install_clicked" : "pwa_install_dismissed", { placement });
  deferredInstallPrompt = null;
  notifyInstall();
  return outcome;
}

/* ------------------------------ session start ---------------------------- */
function startSession() {
  if (ssGet("tbh_session_started")) return;
  ssSet("tbh_session_started", "1");

  const firstSeen = Number(lsGet("tbh_first_seen")) || Date.now();
  const days = Math.floor((Date.now() - firstSeen) / 864e5);
  const visits = Number(lsGet("tbh_visit_count") || 0) + 1;
  lsSet("tbh_visit_count", String(visits));

  const attr = getSessionAttribution();

  track("landing_page_view", {
    landing_path: normalizePath(window.location.pathname),
    is_returning: visits > 1,
    visit_number: Math.min(visits, 50),
    days_since_first_visit: days,
    referrer_host: readReferrerHost() || "(none)",
    utm_campaign: attr?.campaign,
    utm_content: attr?.content,
  });

  // iOS never fires "appinstalled", so first standalone launch is our best proxy.
  if (getDisplayMode() === "standalone" && !lsGet("tbh_pwa_first_launch")) {
    lsSet("tbh_pwa_first_launch", "1");
    track("pwa_first_standalone_launch");
  }
}

/* --------------------------------- login --------------------------------- */
// Fires on a SUCCESSFUL login only. `sign_up` (GA4 recommended event) fires the
// first time on this device. Caveat: a new device/cleared storage looks "new".
export function trackLoginSuccess({ method, seconds } = {}) {
  const isNew = !lsGet("tbh_has_logged_in");
  lsSet("tbh_has_logged_in", "1");

  track("login_completed", {
    method,
    is_new_user: isNew,
    seconds_to_verify: seconds,
    time_bucket: seconds !== undefined ? durationBucket(seconds) : undefined,
  });
  if (isNew) track("sign_up", { method });
  setUserStage("authenticated");
}

/* --------------------------------- init ---------------------------------- */
export function initAnalytics() {
  if (initialized || !MEASUREMENT_ID) return;

  ReactGA.initialize(MEASUREMENT_ID, {
    testMode: IS_DEV && !SEND_IN_DEV, // in dev, events are logged to the console instead of sent
    gtagOptions: {
      send_page_view: false, // we send pageviews ourselves (avoids the duplicate first pageview)
      debug_mode: DEBUG,     // shows hits in GA4 > Admin > DebugView
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    },
  });
  initialized = true;

  captureAttribution();

  const first = getFirstTouch() || {};
  setUserProperties({
    first_touch_source: first.source,
    first_touch_medium: first.medium,
    first_touch_campaign: first.campaign,
    os: detectOS(),
    display_mode: getDisplayMode(),
    user_stage: lsGet("tbh_stage") || "visitor",
    pwa_installed: lsGet("tbh_pwa_installed") ? "yes" : "no",
  });

  installVisibilityTracking();
  installErrorTracking();
  installPwaTracking();
  startSession();
}
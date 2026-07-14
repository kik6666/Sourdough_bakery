import {
  getProfileById,
  getSession,
  onAuthStateChange,
} from "../services/auth-service.js";

const DEFAULT_STATE = {
  isInitialized: false,
  isAuthenticated: false,
  user: null,
  profile: null,
  role: "guest",
};

const listeners = new Set();
let state = { ...DEFAULT_STATE };
let initPromise = null;
let authSubscription = null;

function emit() {
  for (const listener of listeners) {
    listener(getAuthState());
  }
}

function setState(nextState) {
  state = {
    ...state,
    ...nextState,
  };
  emit();
}

function deriveRole(profile) {
  if (!profile?.role) return "customer";
  return profile.role;
}

async function hydrateFromSession(session) {
  if (!session?.user) {
    setState({
      isInitialized: true,
      isAuthenticated: false,
      user: null,
      profile: null,
      role: "guest",
    });
    return;
  }

  const profile = await getProfileById(session.user.id);

  setState({
    isInitialized: true,
    isAuthenticated: true,
    user: session.user,
    profile,
    role: deriveRole(profile),
  });
}

export function getAuthState() {
  return { ...state };
}

export async function refreshAuthState() {
  const session = await getSession();
  await hydrateFromSession(session);
  return getAuthState();
}

export async function initAuthState() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    let session = null;
    try {
      session = await getSession();
    } catch (err) {
      console.warn("[AuthState] Could not retrieve session, defaulting to guest:", err);
      setState({
        isInitialized: true,
        isAuthenticated: false,
        user: null,
        profile: null,
        role: "guest",
      });
      return;
    }
    await hydrateFromSession(session);

    if (!authSubscription) {
      authSubscription = await onAuthStateChange(async (_event, nextSession) => {
        try {
          await hydrateFromSession(nextSession);
        } catch {
          setState({
            isInitialized: true,
            isAuthenticated: false,
            user: null,
            profile: null,
            role: "guest",
          });
        }
      });
    }

    return getAuthState();
  })();

  return initPromise;
}

export function subscribeAuthState(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

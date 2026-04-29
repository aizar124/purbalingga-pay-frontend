const AUTH_KEY = 'purbalingga-pay-auth';

export function readStoredAuth() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeStoredAuth(auth) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_KEY);
}

export function getStoredToken() {
  return readStoredAuth()?.token ?? null;
}

export function getStoredSsoAccessToken() {
  return readStoredAuth()?.ssoAccessToken ?? null;
}

export function getStoredSsoRefreshToken() {
  return readStoredAuth()?.ssoRefreshToken ?? null;
}

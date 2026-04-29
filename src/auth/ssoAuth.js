const SSO_BASE_URL = (import.meta.env.VITE_SSO_URL || 'http://localhost:4000').replace(/\/$/, '');
const SSO_CLIENT_ID = import.meta.env.VITE_SSO_CLIENT_ID || 'purbalingga-pay';
const SSO_REDIRECT_URI = import.meta.env.VITE_SSO_REDIRECT_URI || 'http://localhost:5173/callback';
const SSO_SCOPE = import.meta.env.VITE_SSO_SCOPE || 'openid profile email';
const SSO_LOGIN_URL = import.meta.env.VITE_SSO_LOGIN_URL || 'http://localhost:5174/login';
const SSO_DASHBOARD_URL = import.meta.env.VITE_SSO_DASHBOARD_URL || 'http://localhost:5174/dashboard';
const SSO_LOGOUT_URL = import.meta.env.VITE_SSO_LOGOUT_URL || 'http://localhost:5174/logout';

const PKCE_VERIFIER_KEY = 'purbalingga-pay-sso-pkce-verifier';
const PKCE_STATE_KEY = 'purbalingga-pay-sso-state';
const PKCE_NONCE_KEY = 'purbalingga-pay-sso-nonce';

function getRandomValues(length) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

function base64UrlEncode(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateRandomString(length = 32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = getRandomValues(length);
  let result = '';

  for (let index = 0; index < values.length; index += 1) {
    result += alphabet[values[index] % alphabet.length];
  }

  return result;
}

async function sha256Base64Url(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function persistPkceSession({ verifier, state, nonce }) {
  window.localStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  window.localStorage.setItem(PKCE_STATE_KEY, state);
  window.localStorage.setItem(PKCE_NONCE_KEY, nonce);
}

export function getSsoConfig() {
  return {
    baseUrl: SSO_BASE_URL,
    clientId: SSO_CLIENT_ID,
    redirectUri: SSO_REDIRECT_URI,
    scope: SSO_SCOPE,
    loginUrl: SSO_LOGIN_URL,
    dashboardUrl: SSO_DASHBOARD_URL,
    logoutUrl: SSO_LOGOUT_URL,
  };
}

export function readPkceSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  return {
    verifier: window.localStorage.getItem(PKCE_VERIFIER_KEY),
    state: window.localStorage.getItem(PKCE_STATE_KEY),
    nonce: window.localStorage.getItem(PKCE_NONCE_KEY),
  };
}

export function clearPkceSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(PKCE_VERIFIER_KEY);
  window.localStorage.removeItem(PKCE_STATE_KEY);
  window.localStorage.removeItem(PKCE_NONCE_KEY);
}

export async function buildSsoLoginUrl() {
  const verifier = generateRandomString(96);
  const challenge = await sha256Base64Url(verifier);
  const state = generateRandomString(32);
  const nonce = generateRandomString(32);

  persistPkceSession({ verifier, state, nonce });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SSO_CLIENT_ID,
    redirect_uri: SSO_REDIRECT_URI,
    scope: SSO_SCOPE,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    nonce,
    return_to: 'pay',
  });

  return `${SSO_LOGIN_URL}?${params.toString()}`;
}

export async function redirectToSsoLogin() {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.href = await buildSsoLoginUrl();
}

export function redirectToSsoLogout() {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.href = SSO_LOGOUT_URL;
}

export function redirectToSsoDashboard(bootstrapAccessToken = '') {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(SSO_DASHBOARD_URL);

  if (bootstrapAccessToken) {
    url.searchParams.set('sso_access_token', bootstrapAccessToken);
  }

  window.location.href = url.toString();
}

export async function exchangeSsoCodeForTokens(code) {
  const pkce = readPkceSession();

  if (!pkce?.verifier) {
    throw new Error('PKCE verifier tidak ditemukan. Silakan login ulang.');
  }

  const response = await fetch(`${SSO_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      code_verifier: pkce.verifier,
      client_id: SSO_CLIENT_ID,
      redirect_uri: SSO_REDIRECT_URI,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Gagal menukar kode SSO.');
  }

  clearPkceSession();

  return payload;
}

export function validateSsoState(returnedState) {
  const pkce = readPkceSession();
  if (!pkce?.state) {
    throw new Error('State SSO tidak ditemukan. Silakan login ulang.');
  }

  if (pkce.state !== returnedState) {
    throw new Error('State SSO tidak cocok. Silakan login ulang.');
  }
}

export async function fetchSsoUserInfo(accessToken) {
  const response = await fetch(`${SSO_BASE_URL}/oauth/userinfo`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || 'Gagal memuat profil SSO.');
  }

  return payload;
}

export async function refreshSsoAccessToken(refreshToken) {
  const response = await fetch(`${SSO_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: SSO_CLIENT_ID,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Gagal memperbarui token SSO.');
  }

  return payload;
}

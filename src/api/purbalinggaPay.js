import { clearStoredAuth, getStoredToken } from '../auth/authStorage';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://apismartpay.qode.my.id/api').replace(/\/$/, '');

async function request(path, { method = 'GET', body, token, headers } = {}) {
  const authToken = token === undefined ? getStoredToken() : token;

  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(payload?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.payload = payload;

    if (response.status === 401) {
      clearStoredAuth();
    }

    throw error;
  }

  return payload;
}

export async function loginApi(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: { email, password },
    token: null,
  });
}

export async function logoutApi(token) {
  return request('/auth/logout', {
    method: 'POST',
    token,
  });
}

export async function meApi(token) {
  return request('/auth/me', {
    token,
  });
}

export async function dashboardApi(token) {
  return request('/dashboard', { token });
}

export async function cardsApi(token) {
  return request('/cards', { token });
}

export async function blockCardApi(cardId, token) {
  return request(`/cards/${cardId}/block`, {
    method: 'POST',
    token,
  });
}

export async function unlockCardApi(cardId, token) {
  return request(`/cards/${cardId}/unlock`, {
    method: 'POST',
    token,
  });
}

export async function transactionsApi(token) {
  return request('/transactions', { token });
}

export async function createTransactionApi(token, payload) {
  return request('/transactions', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function simulateTopupPaymentApi(transactionId, token, action) {
  return request(`/transactions/${transactionId}/simulate-payment`, {
    method: 'POST',
    body: { action },
    token,
  });
}

export async function vouchersApi(token) {
  return request('/vouchers', { token });
}

export async function redeemVoucherApi(voucherId, token) {
  return request(`/vouchers/${voucherId}/redeem`, {
    method: 'POST',
    token,
  });
}

export async function bootstrapSsoSessionApi(accessToken) {
  return request('/auth/sso-login', {
    method: 'POST',
    body: { access_token: accessToken },
    token: null,
  });
}

export async function syncSsoProfileApi(token, accessToken) {
  return request('/auth/sso-sync', {
    method: 'POST',
    body: { access_token: accessToken },
    token,
  });
}

const TOPUP_FLOW_KEY = 'purbalingga-pay-topup-flow';

export function saveTopupFlow(payload) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(TOPUP_FLOW_KEY, JSON.stringify(payload));
}

export function readTopupFlow() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(TOPUP_FLOW_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearTopupFlow() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(TOPUP_FLOW_KEY);
}

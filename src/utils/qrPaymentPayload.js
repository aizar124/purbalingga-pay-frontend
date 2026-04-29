function decodePart(value) {
  try {
    return decodeURIComponent(String(value).replace(/\+/g, ' ')).trim();
  } catch {
    return String(value).trim();
  }
}

function normalizeKey(key) {
  return String(key)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function normalizeNominal(value) {
  const numeric = String(value ?? '')
    .replace(/[^\d]/g, '')
    .trim();

  return numeric ? Number(numeric) : NaN;
}

function assignField(target, key, value) {
  const normalizedKey = normalizeKey(key);
  const normalizedValue = decodePart(value);

  if (!normalizedValue) {
    return;
  }

  if (['card_id', 'card', 'cardcode', 'card_code'].includes(normalizedKey)) {
    target.cardId = normalizedValue;
    return;
  }

  if (['nominal', 'amount', 'total', 'price'].includes(normalizedKey)) {
    target.nominal = normalizeNominal(normalizedValue);
    return;
  }

  if (['saldo', 'balance'].includes(normalizedKey)) {
    target.saldo = normalizeNominal(normalizedValue);
    if (!Number.isFinite(target.nominal)) {
      target.nominal = target.saldo;
    }
    return;
  }

  if (['merchant_name', 'merchant', 'merchantname', 'store_name', 'title'].includes(normalizedKey)) {
    target.merchantName = normalizedValue;
    return;
  }

  if (['wisata_name', 'wisat_name', 'destination_name', 'tourism_name', 'wisata'].includes(normalizedKey)) {
    target.wisataName = normalizedValue;
    return;
  }

  if (normalizedKey === 'description') {
    target.description = normalizedValue;
  }
}

function parseKeyValuePayload(rawValue) {
  const payload = {};
  const segments = String(rawValue).split(/[&;\n]+/);

  segments.forEach((segment) => {
    const trimmed = segment.trim();

    if (!trimmed) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=') >= 0 ? trimmed.indexOf('=') : trimmed.indexOf(':');

    if (separatorIndex < 0) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    assignField(payload, key, value);
  });

  return payload;
}

export function parseQrPaymentPayload(rawValue) {
  const raw = String(rawValue ?? '').trim();

  if (!raw) {
    return null;
  }

  let payload = { rawValue: raw };

  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw);
      Object.entries(parsed).forEach(([key, value]) => assignField(payload, key, value));
    } catch {
      // Fall back to key-value parsing.
    }
  }

  if (!payload.cardId || !payload.nominal || !payload.merchantName) {
    const keyValuePayload = parseKeyValuePayload(raw);
    payload = { ...payload, ...keyValuePayload };
  }

  if ((!payload.cardId || !payload.nominal || !payload.merchantName) && raw.includes('|')) {
    const [cardId, nominal, merchantName, description] = raw.split('|');

    if (cardId && nominal && merchantName) {
      payload.cardId = decodePart(cardId);
      payload.nominal = normalizeNominal(nominal);
      payload.merchantName = decodePart(merchantName);
      if (description) {
        payload.description = decodePart(description);
      }
    }
  }

  if ((!payload.cardId || !payload.nominal || !payload.merchantName) && raw.includes('/')) {
    const segments = raw.split('/').map((segment) => segment.trim()).filter(Boolean);

    if (segments.length >= 3) {
      const [cardId, nominal, merchantName, description] = segments;
      payload.cardId = payload.cardId || decodePart(cardId);
      payload.nominal = Number.isFinite(payload.nominal) ? payload.nominal : normalizeNominal(nominal);
      payload.merchantName = payload.merchantName || decodePart(merchantName);

      if (description) {
        payload.description = payload.description || decodePart(description);
      }
    }
  }

  if (!Number.isFinite(payload.nominal) && Number.isFinite(payload.saldo)) {
    payload.nominal = payload.saldo;
  }

  if (!payload.cardId || !payload.nominal || !payload.merchantName || !Number.isFinite(payload.nominal)) {
    return {
      rawValue: raw,
      cardId: payload.cardId || '',
      nominal: Number.isFinite(payload.nominal) ? payload.nominal : NaN,
      saldo: Number.isFinite(payload.saldo) ? payload.saldo : NaN,
      merchantName: payload.merchantName || '',
      wisataName: payload.wisataName || '',
      description: payload.description || '',
      valid: false,
    };
  }

  return {
    rawValue: raw,
    cardId: payload.cardId,
    nominal: payload.nominal,
    saldo: Number.isFinite(payload.saldo) ? payload.saldo : payload.nominal,
    merchantName: payload.merchantName,
    wisataName: payload.wisataName || '',
    description: payload.description || '',
    valid: true,
  };
}

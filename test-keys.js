/**
 * Sistema de Chaves de Teste
 * Gera e valida chaves de teste locais com expiração de 24h.
 * As chaves usam HMAC-SHA256 para garantir integridade.
 */

const TEST_KEY_PREFIX = 'TEST';
const TEST_KEY_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas
const TEST_KEY_SECRET = 'primote-labs-test-key-2024';

function generateTestKeyId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  for (let s = 0; s < 3; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) {
      seg += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(seg);
  }
  return TEST_KEY_PREFIX + '-' + segments.join('-');
}

async function generateTestKeyHash(keyId, timestamp) {
  const data = keyId + ':' + timestamp + ':' + TEST_KEY_SECRET;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateTestKey() {
  const keyId = generateTestKeyId();
  const createdAt = Date.now();
  const expiresAt = createdAt + TEST_KEY_EXPIRY_MS;
  const hash = await generateTestKeyHash(keyId, createdAt);

  const testKeyData = {
    keyId,
    createdAt,
    expiresAt,
    hash
  };

  // Salvar no storage local
  const stored = await chrome.storage.local.get(['testKeys']);
  const testKeys = stored.testKeys || [];
  testKeys.push(testKeyData);
  await chrome.storage.local.set({ testKeys });

  return testKeyData;
}

async function validateTestKey(licenseKey) {
  const formatted = licenseKey.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
  if (!formatted.startsWith(TEST_KEY_PREFIX + '-')) {
    return null; // Não é chave de teste
  }

  const stored = await chrome.storage.local.get(['testKeys']);
  const testKeys = stored.testKeys || [];
  const found = testKeys.find(tk => tk.keyId === formatted);

  if (!found) {
    return { success: false, valid: false, error: 'Chave de teste não encontrada.' };
  }

  // Verificar hash
  const expectedHash = await generateTestKeyHash(found.keyId, found.createdAt);
  if (found.hash !== expectedHash) {
    return { success: false, valid: false, error: 'Chave de teste inválida (hash).' };
  }

  // Verificar expiração
  if (Date.now() > found.expiresAt) {
    return { success: false, valid: false, error: 'Chave de teste expirada.' };
  }

  return { success: true, valid: true, testKey: true };
}

async function getActiveTestKeys() {
  const stored = await chrome.storage.local.get(['testKeys']);
  const testKeys = stored.testKeys || [];
  const now = Date.now();
  return testKeys.filter(tk => now < tk.expiresAt);
}

async function cleanExpiredTestKeys() {
  const active = await getActiveTestKeys();
  await chrome.storage.local.set({ testKeys: active });
}

// Interceptar validateLicense para suportar chaves de teste
const _originalValidateLicense = typeof validateLicense === 'function' ? validateLicense : null;

async function validateLicenseWithTestKeys(key, forceRefresh = false) {
  // Primeiro, checar se é chave de teste
  const testResult = await validateTestKey(key);
  if (testResult !== null) {
    return testResult;
  }
  // Se não é chave de teste, usar validação original
  if (_originalValidateLicense) {
    return _originalValidateLicense(key, forceRefresh);
  }
  return { success: false, valid: false, error: 'Validação indisponível.' };
}

// Sobrescrever a função global
if (_originalValidateLicense) {
  validateLicense = validateLicenseWithTestKeys;
}

// Limpar chaves expiradas ao carregar
cleanExpiredTestKeys();

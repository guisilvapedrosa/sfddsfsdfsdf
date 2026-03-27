/**
 * License Bypass — Remove a dependência de licença/Supabase.
 *
 * Este script é carregado ANTES do popup.js e sobrescreve as funções
 * de licença do config.js para que sempre retornem "válido".
 * Também força a tela de chat a aparecer direto e bloqueia
 * mensagens de forceLogout vindas do background.js.
 */

const BYPASS_LICENSE_KEY = 'SPRT-FREE-FREE-FREE';

// 1) validateLicense → sempre retorna válido
validateLicense = async function(_key, _force) {
  return { success: true, valid: true };
};

// 2) getSavedLicense → sempre retorna uma licença fake salva
getSavedLicense = async function() {
  return { license: BYPASS_LICENSE_KEY, licenseValidatedAt: Date.now() };
};

// 3) saveLicense → no-op (não precisa salvar nada)
saveLicense = async function() {};

// 4) removeLicense → no-op
removeLicense = async function() {};

// 5) logoutLicense → no-op
logoutLicense = async function() {};

// 6) formatLicenseKey → retorna a chave bypass
const _origFormat = formatLicenseKey;
formatLicenseKey = function(key) {
  if (!key || key === BYPASS_LICENSE_KEY) return BYPASS_LICENSE_KEY;
  return _origFormat(key);
};

// 7) Bloquear mensagens de forceLogout do background.js
if (chrome && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
    if (msg && msg.action === 'forceLogout') {
      // Ignorar — não deixar deslogar
      return true;
    }
  });
}

// 8) Ao carregar, forçar a tela de chat direto
document.addEventListener('DOMContentLoaded', () => {
  const licenseScreen = document.getElementById('licenseScreen');
  const chatScreen = document.getElementById('chatScreen');

  if (licenseScreen) licenseScreen.classList.remove('active');
  if (chatScreen) chatScreen.classList.add('active');

  // Atualizar subtítulo da licença no header
  const subtitle = document.getElementById('licenseSubtitle');
  if (subtitle) subtitle.textContent = 'Licença ativa';

  // Salvar licença fake no storage pra background.js não reclamar
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({
      license: BYPASS_LICENSE_KEY,
      licenseValidatedAt: Date.now()
    });
  }

  // Notificar background que licença foi "ativada"
  if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ action: 'licenseActivated' }).catch(() => {});
  }
});

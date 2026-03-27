/**
 * License Bypass — intercepta fetch e simula ativação de licença.
 * Carregado ANTES do popup.js.
 */

const BYPASS_LICENSE_KEY = 'SPRT-FREE-FREE-FREE';

// ─── 1. Salvar licença no storage imediatamente ───────────────────────────────
chrome.storage.local.set({
  license: BYPASS_LICENSE_KEY,
  licenseValidatedAt: Date.now()
});

// ─── 2. Interceptar fetch globalmente ────────────────────────────────────────
// validate-license → sempre válido, sem chegar no servidor
const _originalFetch = window.fetch.bind(window);
window.fetch = async function(url, options) {
  const urlStr = typeof url === 'string' ? url : (url?.url || '');
  if (urlStr.includes('validate-license')) {
    return new Response(
      JSON.stringify({ success: true, valid: true, nonce: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return _originalFetch(url, options);
};

// ─── 3. Sobrescrever funções de licença do config.js ─────────────────────────
validateLicense = async () => ({ success: true, valid: true });
getSavedLicense = async () => ({ license: BYPASS_LICENSE_KEY, licenseValidatedAt: Date.now() });
saveLicense     = async () => {};
removeLicense   = async () => {};
logoutLicense   = async () => {};

// ─── 4. Bloquear forceLogout ──────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.action === 'forceLogout') return true;
});

// ─── 5. Simular ativação pelo fluxo normal do popup.js ───────────────────────
// Em vez de manipular o DOM diretamente, preenchemos o campo e clicamos
// no botão — o popup.js roda o fluxo completo e seta o currentLicense interno.
document.addEventListener('DOMContentLoaded', () => {
  const input     = document.getElementById('licenseInput');
  const btn       = document.getElementById('activateBtn');
  const remember  = document.getElementById('rememberKey');

  if (input && btn) {
    if (remember) remember.checked = true;
    input.value = BYPASS_LICENSE_KEY;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Pequeno delay para o popup.js terminar de inicializar seus listeners
    setTimeout(() => {
      btn.click();
    }, 300);
  }

  // Fallback: se o popup.js reabrir a tela de licença, simular de novo
  const _observer = new MutationObserver(() => {
    const ls = document.getElementById('licenseScreen');
    if (ls?.classList.contains('active')) {
      setTimeout(() => {
        const i = document.getElementById('licenseInput');
        const b = document.getElementById('activateBtn');
        if (i && b) {
          i.value = BYPASS_LICENSE_KEY;
          i.dispatchEvent(new Event('input', { bubbles: true }));
          b.click();
        }
      }, 100);
    }
  });
  _observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });

  // Notificar background
  chrome.runtime.sendMessage({ action: 'licenseActivated' }).catch(() => {});
});

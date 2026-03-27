/**
 * License Bypass — intercepta fetch e funções de licença.
 * Carregado ANTES do popup.js para garantir que as interceptações
 * estejam ativas quando o código ofuscado rodar.
 */

const BYPASS_LICENSE_KEY = 'SPRT-FREE-FREE-FREE';

// ─── 1. Salvar licença fake no storage AGORA (síncrono via callback) ──────────
chrome.storage.local.set({
  license: BYPASS_LICENSE_KEY,
  licenseValidatedAt: Date.now()
});

// ─── 2. Interceptar fetch globalmente ─────────────────────────────────────────
// Qualquer chamada ao endpoint de validação retorna "válido" na hora,
// sem nem chegar no servidor.
const _originalFetch = window.fetch.bind(window);
window.fetch = async function(url, options) {
  const urlStr = typeof url === 'string' ? url : (url?.url || '');

  // Interceptar validate-license → retornar válido localmente
  if (urlStr.includes('validate-license')) {
    return new Response(
      JSON.stringify({ success: true, valid: true, nonce: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Todas as outras chamadas (send-message, enhance, etc.) passam normalmente
  return _originalFetch(url, options);
};

// ─── 3. Sobrescrever funções de licença do config.js ──────────────────────────
// Garante que mesmo se o popup.js chamar via referência de função,
// ele receba resposta válida.
validateLicense  = async () => ({ success: true, valid: true });
getSavedLicense  = async () => ({ license: BYPASS_LICENSE_KEY, licenseValidatedAt: Date.now() });
saveLicense      = async () => {};
removeLicense    = async () => {};
logoutLicense    = async () => {};

// ─── 4. Bloquear forceLogout do background.js ─────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.action === 'forceLogout') return true; // ignorar
});

// ─── 5. Forçar tela de chat via DOM ───────────────────────────────────────────
// Roda em dois momentos pra garantir: imediato + após DOM pronto
function _showChat() {
  const ls = document.getElementById('licenseScreen');
  const cs = document.getElementById('chatScreen');
  if (ls) ls.classList.remove('active');
  if (cs) cs.classList.add('active');
  const sub = document.getElementById('licenseSubtitle');
  if (sub) sub.textContent = 'Licença ativa';
}

_showChat(); // tenta já

document.addEventListener('DOMContentLoaded', () => {
  _showChat();
  // Notificar background que licença foi ativada
  chrome.runtime.sendMessage({ action: 'licenseActivated' }).catch(() => {});
});

// Fallback: observar mudanças no DOM caso popup.js reabra a tela de licença
const _observer = new MutationObserver(() => {
  const ls = document.getElementById('licenseScreen');
  if (ls?.classList.contains('active')) _showChat();
});
document.addEventListener('DOMContentLoaded', () => {
  _observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
});

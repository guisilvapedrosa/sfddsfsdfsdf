/**
 * Background loader — carrega o original e intercepta validação de licença.
 */

// Carregar o background original (ele importa config.js internamente)
importScripts('background-original.js');

const BYPASS_LICENSE_KEY = 'SPRT-FREE-FREE-FREE';

// Interceptar fetch no service worker — validate-license sempre retorna válido
const _origFetch = fetch;
self.fetch = async function(url, options) {
  const urlStr = typeof url === 'string' ? url : '';
  if (urlStr.includes('validate-license')) {
    return new Response(
      JSON.stringify({ success: true, valid: true, nonce: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return _origFetch(url, options);
};

// Sobrescrever funções de licença após o original carregar
validateLicense  = async () => ({ success: true, valid: true });
getSavedLicense  = async () => ({ license: BYPASS_LICENSE_KEY, licenseValidatedAt: Date.now() });
saveLicense      = async () => {};
removeLicense    = async () => {};
logoutLicense    = async () => {};

// Salvar no storage
chrome.storage.local.set({
  license: BYPASS_LICENSE_KEY,
  licenseValidatedAt: Date.now()
});

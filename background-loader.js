/**
 * Background loader — carrega o background original e depois
 * sobrescreve as funções de licença para remover a trava.
 */

// Carregar o background original primeiro (ele faz importScripts('config.js') internamente)
importScripts('background-original.js');

// DEPOIS de tudo carregado, sobrescrever as funções de licença
const BYPASS_LICENSE_KEY = 'SPRT-FREE-FREE-FREE';

validateLicense = async function() {
  return { success: true, valid: true };
};

getSavedLicense = async function() {
  return { license: BYPASS_LICENSE_KEY, licenseValidatedAt: Date.now() };
};

saveLicense = async function() {};
removeLicense = async function() {};
logoutLicense = async function() {};

// Salvar licença fake no storage
chrome.storage.local.set({
  license: BYPASS_LICENSE_KEY,
  licenseValidatedAt: Date.now()
});

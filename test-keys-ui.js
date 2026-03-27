/**
 * UI handler para geração de chaves de teste.
 * Carregado após test-keys.js e popup.js.
 */

document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generateTestKeyBtn');
  const testKeyInfo = document.getElementById('testKeyInfo');
  const licenseInput = document.getElementById('licenseInput');

  if (!generateBtn) return;

  generateBtn.addEventListener('click', async () => {
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="spinner"></span> Gerando...';

    try {
      const testKey = await generateTestKey();
      const expiryDate = new Date(testKey.expiresAt);
      const expiryStr = expiryDate.toLocaleString('pt-BR');

      testKeyInfo.innerHTML =
        'Chave gerada com sucesso! Clique para copiar:' +
        '<span class="test-key-value" title="Clique para copiar">' + testKey.keyId + '</span>' +
        '<span class="test-key-expiry">⏱ Expira em: ' + expiryStr + '</span>';

      // Preencher o campo de licença automaticamente
      if (licenseInput) {
        licenseInput.value = testKey.keyId;
        licenseInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Copiar ao clicar na chave
      const keyValue = testKeyInfo.querySelector('.test-key-value');
      if (keyValue) {
        keyValue.addEventListener('click', () => {
          navigator.clipboard.writeText(testKey.keyId).then(() => {
            keyValue.style.borderColor = 'var(--success)';
            keyValue.style.color = 'var(--success)';
            setTimeout(() => {
              keyValue.style.borderColor = '';
              keyValue.style.color = '';
            }, 1500);
          });
        });
      }
    } catch (err) {
      testKeyInfo.textContent = 'Erro ao gerar chave: ' + err.message;
      testKeyInfo.style.color = 'var(--accent-light)';
    }

    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fas fa-flask"></i> Gerar Chave de Teste';
  });

  // Mostrar chaves ativas ao iniciar
  getActiveTestKeys().then(keys => {
    if (keys.length > 0) {
      const latest = keys[keys.length - 1];
      const expiryDate = new Date(latest.expiresAt);
      const remaining = latest.expiresAt - Date.now();
      const hoursLeft = Math.floor(remaining / (1000 * 60 * 60));
      const minsLeft = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      if (remaining > 0) {
        testKeyInfo.innerHTML =
          'Última chave ativa:' +
          '<span class="test-key-value" title="Clique para copiar">' + latest.keyId + '</span>' +
          '<span class="test-key-expiry">⏱ Restam ' + hoursLeft + 'h ' + minsLeft + 'min</span>';

        const keyValue = testKeyInfo.querySelector('.test-key-value');
        if (keyValue) {
          keyValue.addEventListener('click', () => {
            navigator.clipboard.writeText(latest.keyId);
            if (licenseInput) {
              licenseInput.value = latest.keyId;
              licenseInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });
        }
      }
    }
  });
});

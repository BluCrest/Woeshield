import './style.css';
import './scan.css';

const API_BASE = '/api';

const form = document.getElementById('scanForm') as HTMLFormElement;
const input = document.getElementById('scanInput') as HTMLInputElement;
const btn = document.getElementById('scanBtn') as HTMLButtonElement;
const loading = document.getElementById('scanLoading') as HTMLElement;
const results = document.getElementById('scanResults') as HTMLElement;

// Example buttons
document.querySelectorAll('.scan-example').forEach(el => {
  el.addEventListener('click', () => {
    input.value = el.getAttribute('data-input') || '';
    input.focus();
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const value = input.value.trim();
  if (!value) return;

  // Show loading
  loading.style.display = 'flex';
  results.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Scanning...';

  try {
    const res = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: value }),
    });

    const data = await res.json();
    renderResults(data);
  } catch (err) {
    renderError(err instanceof Error ? err.message : 'Scan failed');
  } finally {
    loading.style.display = 'none';
    btn.disabled = false;
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Scan`;
  }
});

function renderResults(data: any) {
  results.style.display = 'block';

  // Verdict
  const verdict = document.getElementById('verdict')!;
  verdict.className = `verdict verdict-${data.verdict.toLowerCase()}`;

  const icon = document.getElementById('verdictIcon')!;
  icon.innerHTML = data.verdict === 'SAFE'
    ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>'
    : data.verdict === 'DANGER'
      ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4M12 16h.01"/></svg>'
      : '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4M12 16h.01"/></svg>';

  document.getElementById('verdictLabel')!.textContent = data.verdict;
  document.getElementById('verdictSummary')!.textContent = data.summary;
  document.getElementById('verdictScore')!.textContent = data.riskScore;

  // Risk Factors
  const riskFactors = data.riskFactors || [];
  const riskSection = document.getElementById('riskFactorsSection')!;
  const riskContainer = document.getElementById('riskFactors')!;
  if (riskFactors.length > 0) {
    riskSection.style.display = 'block';
    riskContainer.innerHTML = riskFactors.map((f: any) => `
      <div class="risk-item risk-${f.severity}">
        <span class="risk-badge">${f.severity}</span>
        <span class="risk-desc">${f.description}</span>
      </div>
    `).join('');
  } else {
    riskSection.style.display = 'none';
  }

  // Threat Intel
  const intel = data.layers?.threatIntel || {};
  const intelEntries = Object.entries(intel).filter(([k]) => !k.startsWith('_'));
  const intelSection = document.getElementById('threatIntelSection')!;
  const intelGrid = document.getElementById('threatIntel')!;
  if (intelEntries.length > 0) {
    intelSection.style.display = 'block';
    intelGrid.innerHTML = intelEntries.map(([key, val]: [string, any]) => {
      const status = val?.status === 'ok' ? 'ok' : val?.status === 'skipped' ? 'skip' : 'error';
      const statusLabel = status === 'ok' ? 'Checked' : status === 'skip' ? 'Skipped' : 'Error';
      const detail = val?.found ? 'FOUND' : val?.error || val?.reason || 'No issues';
      return `
        <div class="intel-item intel-${status}">
          <span class="intel-name">${key}</span>
          <span class="intel-status">${statusLabel}</span>
          <span class="intel-detail">${detail}</span>
        </div>
      `;
    }).join('');
  } else {
    intelSection.style.display = 'none';
  }

  // Crypto Analysis
  const crypto = data.layers?.cryptoAnalysis;
  const cryptoSection = document.getElementById('cryptoSection')!;
  const cryptoGrid = document.getElementById('cryptoAnalysis')!;
  if (crypto && (crypto.addressSecurity || crypto.tokenSecurity || crypto.contractAnalysis)) {
    cryptoSection.style.display = 'block';
    let html = '';
    if (crypto.addressSecurity) {
      const a = crypto.addressSecurity;
      html += `<div class="crypto-item"><span class="crypto-label">Address Security</span><span class="crypto-val">${a.isPhishingAddress || a.isScamAddress || a.isHackerAddress || a.isStealerAddress ? 'FLAGGED' : 'Clean'}</span></div>`;
    }
    if (crypto.tokenSecurity?.found) {
      const t = crypto.tokenSecurity;
      html += `<div class="crypto-item"><span class="crypto-label">Honeypot</span><span class="crypto-val">${t.isHoneypot ? 'YES' : 'No'}</span></div>`;
      html += `<div class="crypto-item"><span class="crypto-label">Buy Tax</span><span class="crypto-val">${t.buyTax}%</span></div>`;
      html += `<div class="crypto-item"><span class="crypto-label">Sell Tax</span><span class="crypto-val">${t.sellTax}%</span></div>`;
      html += `<div class="crypto-item"><span class="crypto-label">Open Source</span><span class="crypto-val">${t.isOpenSource ? 'Yes' : 'No'}</span></div>`;
    }
    if (crypto.contractAnalysis) {
      const c = crypto.contractAnalysis;
      html += `<div class="crypto-item"><span class="crypto-label">Contract Verified</span><span class="crypto-val">${c.isVerified ? 'Yes' : 'No'}</span></div>`;
    }
    cryptoGrid.innerHTML = html;
  } else {
    cryptoSection.style.display = 'none';
  }

  // MITRE ATT&CK
  const mitre = data.mitreMapping || [];
  const mitreSection = document.getElementById('mitreSection')!;
  const mitreList = document.getElementById('mitreMapping')!;
  if (mitre.length > 0) {
    mitreSection.style.display = 'block';
    mitreList.innerHTML = mitre.map((m: any) => `
      <div class="mitre-item">
        <span class="mitre-tech">${m.technique}${m.subtechnique ? '.' + m.subtechnique.split('.').pop() : ''}</span>
        <span class="mitre-name">${m.name}</span>
        <span class="mitre-tactic">${m.tactic}</span>
      </div>
    `).join('');
  } else {
    mitreSection.style.display = 'none';
  }

  // Approach Guide
  const guide = data.approachGuide;
  const guideSection = document.getElementById('guideSection')!;
  const guideBox = document.getElementById('approachGuide')!;
  if (guide) {
    guideSection.style.display = 'block';
    guideBox.innerHTML = `
      <p class="guide-rec">${guide.recommendation}</p>
      ${guide.actions?.length ? `<ul class="guide-actions">${guide.actions.map((a: string) => `<li>${a}</li>`).join('')}</ul>` : ''}
    `;
  } else {
    guideSection.style.display = 'none';
  }

  // Evidence
  const evidence = data.evidence || [];
  const evidenceSection = document.getElementById('evidenceSection')!;
  const evidenceList = document.getElementById('evidence')!;
  if (evidence.length > 0) {
    evidenceSection.style.display = 'block';
    evidenceList.innerHTML = evidence.map((e: string) => `<div class="evidence-item">${e}</div>`).join('');
  } else {
    evidenceSection.style.display = 'none';
  }

  // Meta
  document.getElementById('resultsMeta')!.innerHTML = `
    <span>Confidence: ${data.confidence}%</span>
    <span>Scan time: ${data.scanDuration}ms</span>
    <span>Engine v${data.engineVersion}</span>
    ${data.rateLimit ? `<span>Scans remaining today: ${data.rateLimit.remaining}/${data.rateLimit.dailyLimit}</span>` : ''}
  `;

  // Scroll to results
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderError(message: string) {
  results.style.display = 'block';
  document.getElementById('verdict')!.className = 'verdict verdict-error';
  document.getElementById('verdictLabel')!.textContent = 'ERROR';
  document.getElementById('verdictSummary')!.textContent = message;
  document.getElementById('verdictScore')!.textContent = '?';

  document.getElementById('riskFactorsSection')!.style.display = 'none';
  document.getElementById('threatIntelSection')!.style.display = 'none';
  document.getElementById('cryptoSection')!.style.display = 'none';
  document.getElementById('mitreSection')!.style.display = 'none';
  document.getElementById('guideSection')!.style.display = 'none';
  document.getElementById('evidenceSection')!.style.display = 'none';
  document.getElementById('resultsMeta')!.innerHTML = '';
}

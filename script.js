const WPP_NUMBER = '5531985917131';
const STORAGE_KEY = 'briefing_draft_v2';
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── SECTION DEFINITIONS
// Section 11 has items:[] → treated as optional, NOT counted in progress
const SECTIONS = [
  { id: 1, title: '1. Informações Gerais', optional: false,
    items: [
      {kind:'field', name:'nome_empresa'},
      {kind:'field', name:'nome_responsavel'},
      {kind:'field', name:'whatsapp'},
      {kind:'field', name:'email'},
      {kind:'field', name:'cidade'},
      {kind:'field', name:'instagram_site'},
    ]},
  { id: 2, title: '2. Objetivo', optional: false,
    items: [
      {kind:'group', name:'objetivo'},
      {kind:'group', name:'acao'},
    ]},
  { id: 3, title: '3. Sobre a Empresa', optional: false,
    items: [
      {kind:'field', name:'empresa_faz'},
      {kind:'field', name:'tempo_atuacao'},
      {kind:'field', name:'servicos'},
      {kind:'field', name:'diferencial'},
      {kind:'field', name:'porque_escolher'},
    ]},
  { id: 4, title: '4. Público-Alvo', optional: false,
    items: [
      {kind:'field', name:'cliente_ideal'},
      {kind:'field', name:'problemas_cliente'},
      {kind:'field', name:'motivo_busca'},
    ]},
  { id: 5, title: '5. Oferta e Conversão', optional: false,
    items: [
      {kind:'field', name:'oferta'},
      {kind:'field', name:'urgencia'},
    ]},
  { id: 6, title: '6. Autoridade e Prova Social', optional: false,
    items: [
      {kind:'field', name:'qtd_clientes'},
      {kind:'yn', name:'depoimentos'},
      {kind:'yn', name:'resultados'},
      {kind:'yn', name:'parceiros'},
      {kind:'yn', name:'redes_sociais'},
    ]},
  { id: 7, title: '7. Design e Referências', optional: false,
    items: [
      {kind:'yn', name:'identidade_visual'},
      {kind:'yn', name:'logo'},
      {kind:'group', name:'estilo'},
      {kind:'field', name:'sites_referencia'},
      {kind:'field', name:'cores'},
    ]},
  { id: 8, title: '8. Conteúdo', optional: false,
    items: [
      {kind:'yn', name:'fotos'},
      {kind:'yn', name:'videos'},
      {kind:'yn', name:'textos'},
    ]},
  { id: 9, title: '9. Integrações', optional: false,
    items: [
      {kind:'group', name:'canal'},
    ]},
  { id: 10, title: '10. Informações Técnicas', optional: false,
    items: [
      {kind:'yn', name:'dominio'},
      {kind:'yn', name:'hospedagem'},
      {kind:'yn', name:'site_atual'},
    ]},
  { id: 11, title: '11. Observações Livres', optional: true,
    items: [] },
];

// Only non-optional sections count toward progress
const COUNTABLE_SECTIONS = SECTIONS.filter(s => !s.optional);

const REQUIRED_FIELDS = ['nome_empresa','nome_responsavel','whatsapp'];
// Campos de texto extras obrigatórios
const REQUIRED_FIELDS_EXTRA = ['empresa_faz'];
// Grupos (check-items) obrigatórios
const REQUIRED_GROUPS = ['objetivo'];
// Canal de contato obrigatório
const REQUIRED_GROUPS_EXTRA = ['canal'];

// ── STATE ──
const ynState = {};

// ── MOBILE NAV ──
let mobNavOpen = false;
function toggleMobNav() {
  mobNavOpen ? closeMobNav() : openMobNav();
}
function openMobNav() {
  mobNavOpen = true;
  document.getElementById('mobNavBtn').classList.add('open');
  document.getElementById('mobNavOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMobNav() {
  mobNavOpen = false;
  document.getElementById('mobNavBtn').classList.remove('open');
  document.getElementById('mobNavOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function closeMobNav() {
  mobNavOpen = false;
  document.getElementById('mobNavBtn').classList.remove('open');
  document.getElementById('mobNavOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── SWIPE TO CLOSE DRAWER ──
function setupDrawerSwipe() {
  const drawer = document.querySelector('.mob-nav-drawer');
  const handle = document.querySelector('.mob-drawer-handle');
  if (!drawer || !handle) return;

  let startY = 0;
  let currentY = 0;
  let dragging = false;
  const THRESHOLD = 80; // px para confirmar fechamento

  function onStart(e) {
    if (!mobNavOpen) return;
    startY = e.touches ? e.touches[0].clientY : e.clientY;
    currentY = 0;
    dragging = true;
    // Remove transição enquanto arrasta para acompanhar o dedo em tempo real
    drawer.style.transition = 'none';
  }

  function onMove(e) {
    if (!dragging) return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    currentY = Math.max(0, y - startY); // só para baixo
    // Resistência suave: quanto mais arrasta, mais lento
    const resistance = 1 - currentY / (currentY + 300);
    const translateY = currentY * (0.4 + resistance * 0.6);
    drawer.style.transform = `translateY(${translateY}px)`;
    // Escurece o overlay proporcionalmente
    const overlay = document.getElementById('mobNavOverlay');
    const opacity = Math.max(0.1, 1 - currentY / 300);
    overlay.style.background = `rgba(0,0,0,${0.6 * opacity})`;
    if (e.cancelable) e.preventDefault();
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    drawer.style.transition = '';
    const overlay = document.getElementById('mobNavOverlay');
    overlay.style.background = '';

    if (currentY > THRESHOLD) {
      // Passou do threshold — fecha
      closeMobNav();
      drawer.style.transform = '';
    } else {
      // Voltou — snap de volta à posição aberta
      drawer.style.transform = 'translateY(0)';
    }
  }

  // Touch (mobile)
  handle.addEventListener('touchstart', onStart, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onEnd);

  // Mouse (desktop, para testes)
  handle.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', (e) => { if (dragging) onMove(e); });
  window.addEventListener('mouseup', onEnd);
}

function buildMobNav() {
  const list = document.getElementById('mobNavList');
  SECTIONS.forEach(sec => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mob-nav-item';
    btn.dataset.mobNav = sec.id;
    btn.innerHTML = `
      <span class="mob-nav-dot"></span>
      <span>${sec.title}</span>
      <span class="mob-nav-status">${sec.optional ? 'opcional' : '0/' + sec.items.length}</span>
    `;
    btn.addEventListener('click', () => {
      closeMobNav();
      setTimeout(() => {
        document.getElementById('sec-' + sec.id).scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 320);
    });
    list.appendChild(btn);
  });
}

// ── NÃO SE APLICA ──
function toggleNA(btn) {
  const wrap = btn.closest('.na-wrap');
  const field = wrap.querySelector('input, textarea');
  const isActive = btn.classList.contains('active');
  if (isActive) {
    btn.classList.remove('active');
    field.classList.remove('na-active');
    field.removeAttribute('disabled');
  } else {
    btn.classList.add('active');
    field.classList.add('na-active');
    field.setAttribute('disabled', 'disabled');
    field.value = '';
  }
  clearFieldError(field.closest('.field'));
  saveDraft();
  refreshAll();
}

// ── CHECKBOX (com ripple) ──
function toggleCheck(el, ev) {
  if (ev && !REDUCED_MOTION) {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--rx', (ev.clientX - r.left) + 'px');
    el.style.setProperty('--ry', (ev.clientY - r.top) + 'px');
    el.classList.remove('ripple');
    void el.offsetWidth;
    el.classList.add('ripple');
  }
  el.classList.toggle('checked');
  clearFieldError(el.closest('.field'));
  saveDraft();
  refreshAll();
}

// ── YES/NO ──
function toggleYN(btn, ev) {
  // Ripple
  if (ev && !REDUCED_MOTION) {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--rx', (ev.clientX - r.left) + 'px');
    btn.style.setProperty('--ry', (ev.clientY - r.top) + 'px');
    btn.classList.remove('yn-ripple');
    void btn.offsetWidth;
    btn.classList.add('yn-ripple');
  }
  const field = btn.dataset.field;
  const val = btn.dataset.val;
  const wrap = btn.closest('.yn-wrap');
  const btns = wrap.querySelectorAll('.yn-btn');
  btns.forEach(b => b.classList.remove('active-sim','active-nao'));
  if (ynState[field] === val) {
    delete ynState[field];
  } else {
    ynState[field] = val;
    btn.classList.add(val === 'Sim' ? 'active-sim' : 'active-nao');
  }
  clearFieldError(btn.closest('.field'));
  saveDraft();
  refreshAll();
}

// ── ITEM COMPLETENESS ──
function isItemComplete(item) {
  if (item.kind === 'field') {
    const el = document.querySelector(`[name="${item.name}"]`);
    if (!el) return false;
    if (el.classList.contains('na-active')) return true;
    return el.value.trim().length > 0;
  }
  if (item.kind === 'group') {
    return document.querySelectorAll(`.check-item.checked[data-group="${item.name}"]`).length > 0;
  }
  if (item.kind === 'yn') {
    return Object.prototype.hasOwnProperty.call(ynState, item.name);
  }
  return false;
}

function sectionCompletion(sec) {
  if (sec.optional) return { done: 1, total: 1, complete: true, isOptional: true };
  let done = 0;
  sec.items.forEach(it => { if (isItemComplete(it)) done++; });
  return { done, total: sec.items.length, complete: done === sec.items.length, isOptional: false };
}

// ── PROGRESS (count-up) — only counts non-optional sections ──
let currentPct = 0;
let pctRaf;
function animatePct(target) {
  if (REDUCED_MOTION) {
    currentPct = target;
    document.getElementById('progressPct').textContent = target + '%';
    document.getElementById('mobBarPct').textContent = target + '%';
    return;
  }
  cancelAnimationFrame(pctRaf);
  const start = currentPct;
  const t0 = performance.now();
  const dur = 500;
  const tick = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    const v = Math.round(start + (target - start) * eased);
    document.getElementById('progressPct').textContent = v + '%';
    document.getElementById('mobBarPct').textContent = v + '%';
    if (k < 1) pctRaf = requestAnimationFrame(tick);
    else currentPct = target;
  };
  pctRaf = requestAnimationFrame(tick);
}

function refreshAll() {
  let completed = 0;
  SECTIONS.forEach(sec => {
    const { done, total, complete, isOptional } = sectionCompletion(sec);

    if (!isOptional && complete) completed++;

    const secEl = document.getElementById('sec-' + sec.id);
    const badge = document.querySelector(`[data-badge="${sec.id}"]`);
    if (secEl) secEl.classList.toggle('is-complete', complete);
    if (badge) {
      if (isOptional) {
        badge.textContent = 'opcional';
      } else if (complete) {
        badge.textContent = '✓ Completa';
      } else {
        badge.textContent = `${done}/${total}`;
      }
    }

    // Desktop side nav dot
    const navItem = document.querySelector(`.side-nav-item[data-nav="${sec.id}"]`);
    if (navItem) navItem.classList.toggle('complete', complete);

    // Mobile nav item
    const mobItem = document.querySelector(`.mob-nav-item[data-mob-nav="${sec.id}"]`);
    if (mobItem) {
      const statusEl = mobItem.querySelector('.mob-nav-status');
      mobItem.classList.toggle('complete-mob', complete);
      if (statusEl) {
        if (isOptional) {
          statusEl.textContent = 'opcional';
        } else if (complete) {
          statusEl.textContent = '✓ Completa';
        } else {
          statusEl.textContent = `${done}/${total}`;
        }
      }
    }
  });

  const total = COUNTABLE_SECTIONS.length;
  const pct = Math.round((completed / total) * 100);

  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('mobBarFill').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = `${completed} de ${total} seções`;
  animatePct(pct);

  document.getElementById('ambient').style.setProperty('--progress', pct);
}

// ── ERROR HANDLING ──
function clearFieldError(fieldEl) {
  if (fieldEl) fieldEl.classList.remove('has-error');
}

function validateRequired() {
  document.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));

  // Marca todos os erros primeiro
  [...REQUIRED_FIELDS, ...REQUIRED_FIELDS_EXTRA].forEach(name => {
    const input = document.querySelector(`[name="${name}"]`);
    if (!input) return;
    const isNA = input.classList.contains('na-active');
    if (!isNA && !input.value.trim()) {
      input.closest('.field').classList.add('has-error');
    }
  });

  [...REQUIRED_GROUPS, ...REQUIRED_GROUPS_EXTRA].forEach(group => {
    const checked = document.querySelectorAll(`.check-item.checked[data-group="${group}"]`).length;
    if (checked === 0) {
      const fieldEl = document.querySelector(`.check-item[data-group="${group}"]`)?.closest('.field');
      if (fieldEl) fieldEl.classList.add('has-error');
    }
  });

  // Retorna o primeiro erro na ordem visual do DOM
  return document.querySelector('.field.has-error') || null;
}

function ensureValid() {
  const firstError = validateRequired();
  if (firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    mostrarToast('Preencha ou marque como "não se aplica" os campos destacados', true);
    return false;
  }
  return true;
}

// ── WHATSAPP MASK ──
function applyWhatsappMask(el) {
  el.addEventListener('input', () => {
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
    else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5}).*/, '($1) $2');
    else if (v.length > 0) v = v.replace(/(\d{0,2})/, '($1');
    el.value = v;
  });
}

// ── EMAIL VALIDATION ──
function setupEmailValidation() {
  const el = document.querySelector('[name="email"]');
  if (!el) return;
  el.addEventListener('blur', () => {
    const v = el.value.trim();
    if (!v) return;
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    el.style.borderColor = ok ? '' : 'var(--danger)';
  });
  el.addEventListener('input', () => { el.style.borderColor = ''; });
}

// ── INPUT LISTENERS ──
document.querySelectorAll('input, textarea').forEach(el => {
  el.addEventListener('input', () => {
    clearFieldError(el.closest('.field'));
    saveDraft();
    refreshAll();
  });
});

// ── AUTOSAVE ──
let saveTimer;
function saveDraft() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const draft = {};
    document.querySelectorAll('input[name], textarea[name]').forEach(el => {
      draft['field_' + el.name] = el.value;
    });
    document.querySelectorAll('.na-btn.active').forEach(btn => {
      const field = btn.closest('.na-wrap').querySelector('[name]');
      if (field) draft['na_' + field.name] = true;
    });
    const checked = {};
    document.querySelectorAll('.check-item.checked').forEach(el => {
      const g = el.dataset.group;
      if (!checked[g]) checked[g] = [];
      checked[g].push(el.dataset.value);
    });
    draft.checks = checked;
    draft.yn = {...ynState};
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch(e){}
    document.getElementById('autosaveBadge').classList.add('visible');
  }, 700);
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);

    Object.keys(draft).forEach(k => {
      if (k.startsWith('field_')) {
        const name = k.replace('field_', '');
        const el = document.querySelector(`[name="${name}"]`);
        if (el) el.value = draft[k];
      }
    });

    Object.keys(draft).forEach(k => {
      if (k.startsWith('na_') && draft[k]) {
        const name = k.replace('na_', '');
        const el = document.querySelector(`[name="${name}"]`);
        if (el) {
          const wrap = el.closest('.na-wrap');
          if (wrap) {
            const btn = wrap.querySelector('.na-btn');
            if (btn) {
              btn.classList.add('active');
              el.classList.add('na-active');
              el.setAttribute('disabled', 'disabled');
            }
          }
        }
      }
    });

    if (draft.checks) {
      Object.keys(draft.checks).forEach(group => {
        draft.checks[group].forEach(val => {
          const el = document.querySelector(`.check-item[data-group="${group}"][data-value="${val}"]`);
          if (el) el.classList.add('checked');
        });
      });
    }

    if (draft.yn) {
      Object.keys(draft.yn).forEach(field => {
        const val = draft.yn[field];
        const btn = document.querySelector(`.yn-btn[data-field="${field}"][data-val="${val}"]`);
        if (btn) {
          ynState[field] = val;
          btn.classList.add(val === 'Sim' ? 'active-sim' : 'active-nao');
        }
      });
    }

    document.getElementById('autosaveBadge').classList.add('visible');
  } catch(e) {}
}

function limparRascunho() {
  const overlay = document.getElementById('confirmOverlay');
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('open'));
}
function fecharConfirm() {
  const overlay = document.getElementById('confirmOverlay');
  overlay.classList.remove('open');
  setTimeout(() => { overlay.style.display = 'none'; }, 250);
}
function confirmarLimpeza() {
  clearTimeout(saveTimer);
  localStorage.removeItem(STORAGE_KEY);
  document.querySelectorAll('input[name], textarea[name]').forEach(el => {
    el.value = '';
    el.style.borderColor = '';
    el.classList.remove('na-active');
    el.removeAttribute('disabled');
  });
  document.querySelectorAll('.na-btn.active').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.check-item.checked').forEach(el => el.classList.remove('checked'));
  document.querySelectorAll('.yn-btn').forEach(btn => btn.classList.remove('active-sim', 'active-nao'));
  Object.keys(ynState).forEach(key => delete ynState[key]);
  document.querySelectorAll('.field.has-error').forEach(field => field.classList.remove('has-error'));
  document.querySelectorAll('.field').forEach(field => field.classList.add('field-visible'));
  document.getElementById('autosaveBadge').classList.remove('visible');
  fecharConfirm();
  refreshAll();
  mostrarToast('Rascunho limpo');
}

function setupZoomLock() {
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('gesturechange', e => e.preventDefault());
  document.addEventListener('gestureend', e => e.preventDefault());
  document.addEventListener('touchmove', e => {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  document.addEventListener('wheel', e => {
    if (e.ctrlKey) e.preventDefault();
  }, { passive: false });
  document.addEventListener('dblclick', e => e.preventDefault());
}

// ── COLLECT DATA ──
function coletarDados() {
  const data = {};
  document.querySelectorAll('input[name], textarea[name]').forEach(el => {
    if (!el.classList.contains('na-active') && el.value.trim()) {
      data[el.name] = el.value.trim();
    }
    if (el.classList.contains('na-active')) {
      data[el.name] = 'Não se aplica';
    }
  });
  document.querySelectorAll('.check-item.checked').forEach(el => {
    const g = el.dataset.group;
    if (!data[g]) data[g] = [];
    data[g].push(el.dataset.value);
  });
  Object.assign(data, ynState);
  return data;
}

const labels = {
  nome_empresa: 'Nome da empresa', nome_responsavel: 'Responsável',
  whatsapp: 'WhatsApp', email: 'E-mail', cidade: 'Cidade/Região',
  instagram_site: 'Instagram/Site', objetivo: 'Objetivo da página',
  objetivo_outro: 'Objetivo (outro)', acao: 'Ação do visitante',
  acao_outro: 'Ação (outro)', empresa_faz: 'O que a empresa faz',
  tempo_atuacao: 'Tempo de atuação', servicos: 'Serviços divulgados',
  diferencial: 'Diferencial', porque_escolher: 'Por que escolher',
  cliente_ideal: 'Cliente ideal', problemas_cliente: 'Problemas do cliente',
  motivo_busca: 'Motivo de busca', oferta: 'Oferta', urgencia: 'Urgência/Escassez',
  qtd_clientes: 'Clientes atendidos', depoimentos: 'Possui depoimentos',
  resultados: 'Possui resultados/fotos', parceiros: 'Possui parceiros',
  redes_sociais: 'Redes sociais ativas', identidade_visual: 'Identidade visual',
  logo: 'Possui logo', estilo: 'Estilo preferido',
  sites_referencia: 'Sites de referência', cores: 'Cores desejadas',
  fotos: 'Possui fotos', videos: 'Possui vídeos', textos: 'Possui textos',
  canal: 'Canal de contato', dominio: 'Possui domínio',
  hospedagem: 'Possui hospedagem', site_atual: 'Possui site atual',
  observacoes: 'Observações',
};

const sectionsForOutput = [
  { title: '1. Informações Gerais', keys: ['nome_empresa','nome_responsavel','whatsapp','email','cidade','instagram_site'] },
  { title: '2. Objetivo', keys: ['objetivo','objetivo_outro','acao','acao_outro'] },
  { title: '3. Sobre a Empresa', keys: ['empresa_faz','tempo_atuacao','servicos','diferencial','porque_escolher'] },
  { title: '4. Público-Alvo', keys: ['cliente_ideal','problemas_cliente','motivo_busca'] },
  { title: '5. Oferta e Conversão', keys: ['oferta','urgencia'] },
  { title: '6. Autoridade e Prova Social', keys: ['qtd_clientes','depoimentos','resultados','parceiros','redes_sociais'] },
  { title: '7. Design e Referências', keys: ['identidade_visual','logo','estilo','sites_referencia','cores'] },
  { title: '8. Conteúdo', keys: ['fotos','videos','textos'] },
  { title: '9. Integrações', keys: ['canal'] },
  { title: '10. Informações Técnicas', keys: ['dominio','hospedagem','site_atual'] },
  { title: '11. Observações', keys: ['observacoes'] },
];

function formatarTexto(data) {
  let out = 'BRIEFING — PROJETO DIGITAL\n' + '='.repeat(40) + '\n\n';
  sectionsForOutput.forEach(s => {
    let secOut = '';
    s.keys.forEach(k => {
      if (data[k] !== undefined) {
        const val = Array.isArray(data[k]) ? data[k].join(', ') : data[k];
        secOut += `${labels[k] || k}: ${val}\n`;
      }
    });
    if (secOut) out += s.title + '\n' + '-'.repeat(30) + '\n' + secOut + '\n';
  });
  return out;
}

// ── ACTIONS ──
function gerarResumo() {
  if (!ensureValid()) return;
  const data = coletarDados();
  const txt = formatarTexto(data);
  document.getElementById('modalContent').textContent = txt;
  document.getElementById('modalOverlay').classList.add('open');
}
function fecharModal(e) {
  if (e.target === document.getElementById('modalOverlay'))
    document.getElementById('modalOverlay').classList.remove('open');
}
function fecharModalBtn() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function mostrarToast(msg, isError) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.toggle('error', !!isError);
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3200);
}

function copiarModal() {
  const txt = document.getElementById('modalContent').textContent;
  navigator.clipboard.writeText(txt).then(() => mostrarToast('Briefing copiado!'));
}
function copiarTudo() {
  if (!ensureValid()) return;
  const data = coletarDados();
  const txt = formatarTexto(data);
  navigator.clipboard.writeText(txt).then(() => mostrarToast('Briefing copiado!'));
}
function enviarWhatsApp() {
  if (!ensureValid()) return;
  const data = coletarDados();
  const txt = formatarTexto(data);
  const encoded = encodeURIComponent(txt);
  window.open(`https://wa.me/${WPP_NUMBER}?text=${encoded}`, '_blank');
}

function gerarPDF() {
  if (!ensureValid()) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const data = coletarDados();

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const maxW = pageW - margin * 2;
  let y = margin;

  function checkPage(needed) {
    if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
  }

  doc.setFillColor(13, 13, 20);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('BRIEFING — PROJETO DIGITAL', margin, 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(122, 122, 154);
  const now = new Date();
  doc.text(`Gerado em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`, margin, 24);
  y = 36;

  sectionsForOutput.forEach(s => {
    let secLines = [];
    s.keys.forEach(k => {
      if (data[k] !== undefined) {
        const val = Array.isArray(data[k]) ? data[k].join(', ') : data[k];
        const label = labels[k] || k;
        const wrapped = doc.splitTextToSize(`${label}: ${val}`, maxW - 6);
        secLines.push(...wrapped);
      }
    });
    if (!secLines.length) return;

    checkPage(16 + secLines.length * 5.5);

    doc.setFillColor(255, 77, 109);
    doc.roundedRect(margin, y, maxW, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(s.title.toUpperCase(), margin + 4, y + 5.5);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 60);

    secLines.forEach(line => {
      checkPage(6);
      if (line.includes(': ')) {
        const colonIdx = line.indexOf(': ');
        const labelPart = line.substring(0, colonIdx + 2);
        const valuePart = line.substring(colonIdx + 2);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 50);
        doc.text(labelPart, margin + 3, y);
        const labelW = doc.getTextWidth(labelPart);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(70, 70, 90);
        doc.text(valuePart, margin + 3 + labelW, y);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(70, 70, 90);
        doc.text(line, margin + 3, y);
      }
      y += 5.5;
    });

    y += 4;
    doc.setDrawColor(220, 220, 235);
    doc.line(margin, y, margin + maxW, y);
    y += 6;
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(180, 180, 200);
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' });
  }

  const empresa = data.nome_empresa ? data.nome_empresa.replace(/\s+/g, '_') : 'cliente';
  doc.save(`briefing_${empresa}.pdf`);
  mostrarToast('PDF gerado com sucesso!');
}

// ── BUILD DESKTOP SIDE NAV ──
function buildSideNav() {
  const nav = document.getElementById('sideNav');
  SECTIONS.forEach(sec => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'side-nav-item';
    btn.dataset.nav = sec.id;
    btn.innerHTML = `<span class="side-nav-dot"></span><span>${sec.title}</span>`;
    btn.addEventListener('click', () => {
      document.getElementById('sec-' + sec.id).scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    nav.appendChild(btn);
  });
}

// ── FIX: update scroll-offset + side-nav top dynamically ──
function updateScrollOffset() {
  const progressWrap = document.getElementById('progressWrap');
  const progressH = progressWrap.offsetHeight;
  document.documentElement.style.setProperty('--progress-h', progressH + 'px');
  document.documentElement.style.setProperty('--scroll-offset', (progressH + 20) + 'px');

  // Top da nav = onde a barra de progresso termina na tela + margem
  const progressBottom = progressWrap.getBoundingClientRect().bottom;
  const navTop = progressBottom + 16;
  const navMaxH = window.innerHeight - progressBottom - 32;

  const sideNav = document.getElementById('sideNav');
  if (sideNav) {
    sideNav.style.top = navTop + 'px';
  }
}

// ── SCROLL EFFECTS ──
function setupScrollEffects() {
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
    updateScrollOffset();
  }, { passive: true });

  // ── FIELD REVEAL ao rolar ──
  if (REDUCED_MOTION) {
    document.querySelectorAll('.field').forEach(f => f.classList.add('field-instant'));
  } else {
    const fieldObs = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting && !en.target.classList.contains('field-visible')) {
          // Delay em cascata baseado na posição do campo dentro da seção
          const siblings = Array.from(en.target.closest('.section')?.querySelectorAll('.field') || []);
          const idx = siblings.indexOf(en.target);
          const delay = Math.min(idx * 60, 240); // máx 240ms de delay
          setTimeout(() => {
            en.target.classList.add('field-visible');
          }, delay);
          fieldObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.field').forEach(f => fieldObs.observe(f));

    // Campos já visíveis na viewport ao carregar — animar com pequeno delay inicial
    requestAnimationFrame(() => {
      document.querySelectorAll('.field').forEach((f, i) => {
        const rect = f.getBoundingClientRect();
        if (rect.top < window.innerHeight && !f.classList.contains('field-visible')) {
          const delay = i * 55;
          setTimeout(() => f.classList.add('field-visible'), delay);
          fieldObs.unobserve(f);
        }
      });
    });
  }

  // Active section (for side nav + glow)
  const activeObs = new IntersectionObserver((entries) => {
    let best = null;
    entries.forEach(en => {
      if (en.isIntersecting) {
        if (!best || en.intersectionRatio > best.intersectionRatio) best = en;
      }
    });
    if (!best) return;
    const id = best.target.dataset.section;
    document.querySelectorAll('.section.active-view').forEach(s => s.classList.remove('active-view'));
    best.target.classList.add('active-view');

    // Desktop side nav active state
    document.querySelectorAll('.side-nav-item').forEach(i => i.classList.remove('active'));
    const navDesktop = document.querySelector(`.side-nav-item[data-nav="${id}"]`);
    if (navDesktop) navDesktop.classList.add('active');

    // Mobile nav active state
    document.querySelectorAll('.mob-nav-item').forEach(i => i.classList.remove('active-mob'));
    const navMob = document.querySelector(`.mob-nav-item[data-mob-nav="${id}"]`);
    if (navMob) navMob.classList.add('active-mob');

  }, { threshold: [0.25, 0.5, 0.75], rootMargin: '-30% 0px -30% 0px' });

  document.querySelectorAll('.section').forEach(s => activeObs.observe(s));

  // Parallax header + sticky progress tightening
  if (!REDUCED_MOTION) {
    let lastY = -1;
    const onScroll = () => {
      const y = window.scrollY;
      if (y === lastY) return;
      lastY = y;
      const header = document.querySelector('header');
      if (header) {
        header.style.setProperty('--py1', (y * 0.25) + 'px');
        header.style.setProperty('--py2', (-y * 0.18) + 'px');
        const inner = header.querySelector('.header-inner');
        if (inner) {
          const t = Math.min(1, y / 300);
          inner.style.setProperty('--ht', (-y * 0.15) + 'px');
          inner.style.setProperty('--ho', String(1 - t * 0.7));
        }
      }
      updateScrollOffset();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Ambient cursor follow
    window.addEventListener('mousemove', (e) => {
      const amb = document.getElementById('ambient');
      amb.style.setProperty('--mx', (e.clientX) + 'px');
      amb.style.setProperty('--my', (e.clientY) + 'px');
    });
  }

  // Also update on resize
  window.addEventListener('resize', updateScrollOffset, { passive: true });
}

// ── KEYBOARD SHORTCUT (Ctrl/Cmd+S) ──
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    saveDraft();
    mostrarToast('Rascunho salvo');
  }
  // ESC closes mobile nav
  if (e.key === 'Escape' && mobNavOpen) closeMobNav();
});

// ── INIT ──
window.addEventListener('DOMContentLoaded', () => {
  buildSideNav();
  buildMobNav();
  setupZoomLock();
  setupDrawerSwipe();
  loadDraft();
  const wpp = document.querySelector('[name="whatsapp"]');
  if (wpp) applyWhatsappMask(wpp);
  setupEmailValidation();
  setupScrollEffects();
  updateScrollOffset();
  refreshAll();
});

const config = window.WASL_WEB_CONFIG || {};
const responseBlock = document.querySelector('#responseBlock');
const sendBtn = document.querySelector('#sendBtn');
const method = document.querySelector('#method');
const endpoint = document.querySelector('#endpoint');
const gatewayMode = document.querySelector('#gatewayMode');
const payload = document.querySelector('#payload');
const mockMode = document.querySelector('#mockMode');
const traceMode = document.querySelector('#traceMode');

function renderResponse(body) {
  responseBlock.textContent = JSON.stringify(body, null, 2);
}

const gatewayDefaults = {
  'api-gateway': {
    method: 'POST',
    endpoint: '/api/v1/orders',
    payload: JSON.stringify({ orderId: 'ord_908231', amount: 154.50, currency: 'USD' }, null, 2)
  },
  'ai-gateway': {
    method: 'POST',
    endpoint: '/v1/chat/completions',
    payload: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: 'Submit SSN 000-12-3456 to analyze order risk.' }], stream: false }, null, 2)
  },
  'event-gateway': {
    method: 'POST',
    endpoint: '/events/orders.created/records',
    payload: JSON.stringify({ eventId: 'evt_77192', data: { orderId: 'ord_908231', status: 'PAID' } }, null, 2)
  },
  'mcp-gateway': {
    method: 'POST',
    endpoint: '/mcp/customer_support_ops',
    payload: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'lookup_customer', arguments: { id: 'cust_123' } } }, null, 2)
  }
};

function simulateStudioCall() {
  let parsedPayload = {};
  try {
    parsedPayload = JSON.parse(payload?.value || '{}');
  } catch {
    parsedPayload = { raw: payload?.value };
  }

  const now = new Date().toISOString();
  const correlationId = Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  const selectedMode = gatewayMode?.value || 'api-gateway';

  let responseData = {};
  let timelineSteps = [];

  switch (selectedMode) {
    case 'api-gateway':
      responseData = {
        orderId: parsedPayload.orderId || `ord_${correlationId.slice(0, 8)}`,
        status: 'ACCEPTED',
        executionMode: mockMode?.checked ? 'mock' : 'live-direct-proxy',
        processedBy: 'GatewayRouter-v3'
      };
      timelineSteps = [
        { step: 'request.received', at: now },
        { step: mockMode?.checked ? 'mock.policy.evaluated' : 'policy.chain.executed', at: now },
        { step: 'target.resolved.3level', at: now },
        { step: 'response.returned', at: now }
      ];
      break;

    case 'ai-gateway':
      const isRedacted = !mockMode?.checked;
      responseData = {
        routeId: 'private-llm-cluster',
        provider: 'openai-gpt-4o',
        pii_masking: isRedacted ? 'active (masked SSN: ***-**-****)' : 'disabled',
        output: isRedacted 
          ? 'Risk assessment completed successfully. Masked profile classified as Low Risk.'
          : 'Risk assessment completed. Profile for SSN 000-12-3456 classified as Low Risk.',
        usage: { promptTokens: 32, completionTokens: 18, totalTokens: 50, cost_usd: 0.00025 }
      };
      timelineSteps = [
        { step: 'request.received', at: now },
        { step: 'pii.redact.pre', at: now },
        { step: 'semantic.cache.lookup', at: now },
        { step: 'llm.provider.routed', at: now },
        { step: 'cost.limits.evaluated', at: now },
        { step: 'response.returned', at: now }
      ];
      break;

    case 'event-gateway':
      responseData = {
        status: 'published',
        topic: 'orders.created.v1',
        partition: 2,
        offset: 14502,
        contractValidated: true,
        correlationId
      };
      timelineSteps = [
        { step: 'request.received', at: now },
        { step: 'auth.subscription.verified', at: now },
        { step: 'schema.contract.validated', at: now },
        { step: 'kafka.producer.published', at: now },
        { step: 'response.returned', at: now }
      ];
      break;

    case 'mcp-gateway':
      responseData = {
        jsonrpc: '2.0',
        id: parsedPayload.id || 1,
        result: {
          content: [
            {
              type: 'text',
              text: 'Customer ID cust_123 resolved: Jane Doe, Status: VIP, Tier: Enterprise.'
            }
          ]
        }
      };
      timelineSteps = [
        { step: 'mcp.initialize.negotiated', at: now },
        { step: 'origin.validation.passed', at: now },
        { step: 'mcp.agent.grant.verified', at: now },
        { step: 'flow.binding.dispatched', at: now },
        { step: 'mcp.response.formatted', at: now }
      ];
      break;
  }

  const result = {
    request: {
      method: method?.value || 'POST',
      endpoint: endpoint?.value || '/api/v1/orders',
      payload: parsedPayload,
      gateway: selectedMode,
      mode: mockMode?.checked ? 'mock/simulate' : 'live/enforced'
    },
    response: {
      status: 200,
      data: responseData
    },
    trace: traceMode?.checked
      ? {
          correlationId,
          timeline: timelineSteps
        }
      : null
  };

  renderResponse(result);
}

if (gatewayMode) {
  gatewayMode.addEventListener('change', () => {
    const val = gatewayMode.value;
    const defaults = gatewayDefaults[val];
    if (defaults) {
      if (method) method.value = defaults.method;
      if (endpoint) endpoint.value = defaults.endpoint;
      if (payload) payload.value = defaults.payload;
    }
    simulateStudioCall();
  });
}

if (sendBtn) {
  sendBtn.addEventListener('click', simulateStudioCall);
  // Set initial default form values if present
  if (gatewayMode && gatewayDefaults[gatewayMode.value]) {
    const defaults = gatewayDefaults[gatewayMode.value];
    if (method) method.value = defaults.method;
    if (endpoint) endpoint.value = defaults.endpoint;
    if (payload) payload.value = defaults.payload;
  }
  simulateStudioCall();
}

const waitlistForm = document.querySelector('#waitlistForm');
const waitlistMessage = document.querySelector('#waitlistMessage');

function trackEvent(name, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}

function initAnalytics() {
  const measurementId = config?.analytics?.ga4MeasurementId;
  if (measurementId) {
    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(gtagScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);
  }
}

function initLinkedInPixel() {
  const partnerId = config?.pixels?.linkedinPartnerId;
  if (!partnerId) {
    return;
  }
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(partnerId);
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
  document.head.appendChild(script);
}

function initGoogleAds() {
  const adsId = config?.pixels?.googleAdsId;
  if (!adsId) {
    return;
  }
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${adsId}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', adsId);
}

function wireCredibilityLinks() {
  const links = config?.links || {};
  const githubLink = document.querySelector('#githubLink');
  const docsLink = document.querySelector('#docsLink');
  const roadmapLink = document.querySelector('#roadmapLink');
  const linkedinLink = document.querySelector('#linkedinLink');
  const xLink = document.querySelector('#xLink');
  const youtubeLink = document.querySelector('#youtubeLink');
  if (githubLink && links.github) githubLink.href = links.github;
  if (docsLink && links.docs) docsLink.href = links.docs;
  if (roadmapLink && links.roadmap) roadmapLink.href = links.roadmap;
  if (linkedinLink && links.linkedin) linkedinLink.href = links.linkedin;
  if (xLink && links.x) xLink.href = links.x;
  if (youtubeLink && links.youtube) youtubeLink.href = links.youtube;
}

async function submitWaitlist(email) {
  const endpointUrl = config?.waitlist?.endpoint;
  if (!endpointUrl) {
    return { ok: true, mode: 'local' };
  }
  const fieldMap = config?.waitlist?.fieldMap || {};
  const payloadData = {};
  payloadData[fieldMap.email || 'email'] = email;
  if (fieldMap.source) payloadData[fieldMap.source] = 'wasl-web';
  if (fieldMap.product) payloadData[fieldMap.product] = 'wasl';

  const response = await fetch(endpointUrl, {
    method: (config?.waitlist?.method || 'POST').toUpperCase(),
    headers: {
      'Content-Type': config?.waitlist?.contentType || 'application/json'
    },
    body: JSON.stringify(payloadData)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Waitlist request failed (${response.status})`);
  }
  return { ok: true, mode: 'remote' };
}

if (waitlistForm) {
  waitlistForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.querySelector('#email')?.value?.trim();
    if (!email) {
      waitlistMessage.textContent = 'Enter a valid work email.';
      return;
    }
    try {
      await submitWaitlist(email);
      waitlistMessage.textContent = `Thanks. ${email} is registered for wasl early access.`;
      waitlistForm.reset();
      trackEvent('generate_lead', { method: 'waitlist_form' });
    } catch (error) {
      waitlistMessage.textContent = 'Unable to submit right now. Please try again.';
      console.error('[wasl-web] waitlist submit failed', error);
    }
  });
}

function applyVariantByQuery() {
  const params = new URLSearchParams(window.location.search);
  const variant = params.get('variant');
  if (variant === 'enterprise') {
    const heroTitle = document.querySelector('.hero h1');
    const heroCopy = document.querySelector('.hero-copy p:not(.eyebrow)');
    if (heroTitle) {
      heroTitle.textContent = 'Run enterprise-grade API programs on wasl with control, speed, and transparency.';
    }
    if (heroCopy) {
      heroCopy.textContent = 'For platform teams replacing legacy gateways: enforce policy, isolate tenants, manage environments, and scale integrations with open architecture.';
    }
  }
}

function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // observer.unobserve(entry.target); // Uncomment to only reveal once
      }
    });
  }, {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  });

  reveals.forEach(reveal => observer.observe(reveal));
}

function initCardGlow() {
  const cards = document.querySelectorAll('.feature-card, .traffic-card, .architecture-panel, .product-screen');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

function setupMobileNav() {
  const toggle = document.querySelector('#menuToggle');
  const nav = document.querySelector('#primaryNav');
  if (!toggle || !nav) return;

  const close = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  };

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1020) close();
  });
}

function hasTrackers() {
  const a = config?.analytics || {};
  const p = config?.pixels || {};
  return !!(a.ga4MeasurementId || a.gtmId || p.linkedinPartnerId || p.googleAdsId);
}

function initTracking() {
  initAnalytics();
  initLinkedInPixel();
  initGoogleAds();
}

function setupCookieConsent() {
  const KEY = 'wasl-cookie-consent';
  const banner = document.querySelector('#cookieConsent');
  let choice = null;
  try { choice = localStorage.getItem(KEY); } catch { /* storage blocked */ }

  if (choice === 'granted') { initTracking(); return; }
  if (choice === 'denied') return;
  if (!hasTrackers() || !banner) return; // nothing to consent to

  banner.hidden = false;
  const decide = (value) => {
    try { localStorage.setItem(KEY, value); } catch { /* storage blocked */ }
    banner.hidden = true;
    if (value === 'granted') initTracking();
  };
  banner.querySelector('#cookieAccept')?.addEventListener('click', () => decide('granted'));
  banner.querySelector('#cookieDecline')?.addEventListener('click', () => decide('denied'));
}

function initStatCounters() {
  const nums = document.querySelectorAll('.stat strong[data-count]');
  if (!nums.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const animate = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const duration = 1100;
    const start = performance.now();
    el.textContent = '0';
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = String(target);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.6 });
  nums.forEach((n) => io.observe(n));
}

function initStickyHeader() {
  const bar = document.querySelector('.topbar');
  if (!bar) return;
  const onScroll = () => bar.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function setupTabs() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    const targetId = btn.getAttribute('data-tab');
    if (!targetId) return;

    const container = btn.closest('.tabs-container');
    if (!container) return;

    container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    container.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const pane = container.querySelector(`#${targetId}`);
    if (pane) pane.classList.add('active');
  });
}

wireCredibilityLinks();
setupMobileNav();
applyVariantByQuery();
setupCookieConsent();
initScrollReveal();
initCardGlow();
initStatCounters();
initStickyHeader();
setupTabs();

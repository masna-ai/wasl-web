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

function simulateStudioCall() {
  let parsedPayload = {};
  try {
    parsedPayload = JSON.parse(payload?.value || '{}');
  } catch {
    parsedPayload = { raw: payload?.value };
  }

  const now = new Date().toISOString();
  const correlationId = Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  const aiMode = gatewayMode?.value === 'ai-gateway';

  const result = {
    request: {
      method: method?.value || 'POST',
      endpoint: endpoint?.value || '/ai/orchestrate',
      payload: parsedPayload,
      gateway: aiMode ? 'ai-gateway' : 'api-gateway',
      mode: mockMode?.checked ? 'mock' : 'live'
    },
    response: {
      status: 200,
      message: aiMode
        ? (mockMode?.checked ? 'Simulated AI response served from Compliance Preview' : 'Live governed AI response from Provider Fleet')
        : (mockMode?.checked ? 'Mock payload served by Governance Engine Sandbox' : 'Live verified payload from Edge Router'),
      data: aiMode
        ? {
            routeId: 'private-llm-cluster',
            provider: 'secure-internal',
            pii_masking: 'enforced',
            output: 'User feedback has been aggregated and masked for sensitive data securely.',
            usage: {
              promptTokens: 28,
              completionTokens: 19,
              totalTokens: 47
            }
          }
        : {
            orderId: parsedPayload.orderId || `ord_${correlationId.slice(0, 8)}`,
            accepted: true
          }
    },
    trace: traceMode?.checked
      ? {
          correlationId,
          timeline: [
            { step: 'request.received', at: now },
            { step: mockMode?.checked ? 'mock.policy.evaluated' : 'policy.chain.executed', at: now },
            { step: aiMode ? 'ai.route.executed' : 'flow.executed', at: now },
            ...(aiMode ? [{ step: 'stream.normalized', at: now }] : []),
            { step: 'response.returned', at: now }
          ]
        }
      : null
  };

  renderResponse(result);
}

if (sendBtn) {
  sendBtn.addEventListener('click', simulateStudioCall);
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

initAnalytics();
initLinkedInPixel();
initGoogleAds();
wireCredibilityLinks();
setupMobileNav();
applyVariantByQuery();
initScrollReveal();
initCardGlow();

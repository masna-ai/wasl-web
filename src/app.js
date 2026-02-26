const config = window.WASL_WEB_CONFIG || {};
const responseBlock = document.querySelector('#responseBlock');
const sendBtn = document.querySelector('#sendBtn');
const method = document.querySelector('#method');
const endpoint = document.querySelector('#endpoint');
const payload = document.querySelector('#payload');
const mockMode = document.querySelector('#mockMode');
const traceMode = document.querySelector('#traceMode');

function renderResponse(body) {
  responseBlock.textContent = JSON.stringify(body, null, 2);
}

function simulateStudioCall() {
  let parsedPayload = {};
  try {
    parsedPayload = JSON.parse(payload.value || '{}');
  } catch {
    parsedPayload = { raw: payload.value };
  }

  const now = new Date().toISOString();
  const correlationId = Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);

  const result = {
    request: {
      method: method.value,
      endpoint: endpoint.value,
      payload: parsedPayload,
      mode: mockMode.checked ? 'mock' : 'live'
    },
    response: {
      status: 200,
      message: mockMode.checked ? 'Mock response served by Mockgee via WASL API Studio' : 'Live gateway response from WASL',
      data: {
        orderId: parsedPayload.orderId || `ord_${correlationId.slice(0, 8)}`,
        accepted: true
      }
    },
    trace: traceMode.checked
      ? {
          correlationId,
          timeline: [
            { step: 'request.received', at: now },
            { step: mockMode.checked ? 'mock.policy.evaluated' : 'policy.chain.executed', at: now },
            { step: 'flow.executed', at: now },
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
  if (githubLink && links.github) githubLink.href = links.github;
  if (docsLink && links.docs) docsLink.href = links.docs;
  if (roadmapLink && links.roadmap) roadmapLink.href = links.roadmap;
}

async function submitWaitlist(email) {
  const endpointUrl = config?.waitlist?.endpoint;
  if (!endpointUrl) {
    return { ok: true, mode: 'local' };
  }
  const fieldMap = config?.waitlist?.fieldMap || {};
  const payloadData = {};
  payloadData[fieldMap.email || 'email'] = email;
  payloadData[fieldMap.source || 'source'] = 'wasl-web';
  payloadData[fieldMap.product || 'product'] = 'wasl';

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

initAnalytics();
initLinkedInPixel();
initGoogleAds();
wireCredibilityLinks();
applyVariantByQuery();
initScrollReveal();


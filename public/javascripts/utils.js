(() => {
  'use strict';

  // Toast notifications
  function ensureToastRoot() {
    let root = document.getElementById('toast-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toast-root';
      document.body.appendChild(root);
    }
    return root;
  }

  function showToast(message, type = 'info', timeoutMs = 3000) {
    const root = ensureToastRoot();
    const el = document.createElement('div');
    el.textContent = message;
    el.className = `toast-element toast-${type}`;
    root.appendChild(el);
    setTimeout(() => {
      el.classList.add('toast-fade-out');
      setTimeout(() => el.remove(), 220);
    }, timeoutMs);
  }

  // API wrapper with JSON defaults and error handling
  async function apiFetch(path, options = {}) {
    const init = Object.assign({
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    }, options);
    const res = await fetch(path, init);
    let data = null;
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    if (isJson) {
      try { data = await res.json(); } catch (_) { /* ignore parse */ }
    } else {
      try { data = await res.text(); } catch (_) { /* ignore parse */ }
    }
    if (!res.ok) {
      const msg = data && data.error ? data.error : (typeof data === 'string' && data) ? data : `Errore ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    return data;
  }

  // ES6 Class for API Manager
  class ApiManager {
    constructor() {
      this.get = (url) => apiFetch(url, { method: 'GET' });
      this.post = (url, body) => apiFetch(url, { method: 'POST', body: JSON.stringify(body || {}) });
      this.put = (url, body) => apiFetch(url, { method: 'PUT', body: JSON.stringify(body || {}) });
      this.del = (url) => apiFetch(url, { method: 'DELETE' });
    }
  }

  // ES6 Class for Validators
  class Validator {
    constructor() {
      this.required = (v) => (v != null && String(v).trim().length > 0) || 'Campo obbligatorio';
      this.email = (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) || 'Email non valida');
      this.minLen = (n) => (v) => (String(v || '').length >= n || `Minimo ${n} caratteri`);
    }
  }

  function setFieldInvalid(input, message) {
    input.classList.add('is-invalid');
    let fb = input.nextElementSibling;
    if (!fb || !fb.classList.contains('invalid-feedback')) {
      fb = document.createElement('div');
      fb.className = 'invalid-feedback';
      input.insertAdjacentElement('afterend', fb);
    }
    fb.textContent = message;
  }

  function clearFieldInvalid(input) {
    input.classList.remove('is-invalid');
    const fb = input.nextElementSibling;
    if (fb && fb.classList.contains('invalid-feedback')) fb.textContent = '';
  }

  // validateForm(form, rules) where rules: { fieldName: [validatorFn, ...] }
  function validateForm(form, rules) {
    let ok = true;
    Object.entries(rules || {}).forEach(([name, fns]) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) return;
      clearFieldInvalid(input);
      const value = input.type === 'checkbox' ? input.checked : input.value;
      for (const fn of (Array.isArray(fns) ? fns : [fns])) {
        const res = typeof fn === 'function' ? fn(value) : true;
        if (res !== true) {
          setFieldInvalid(input, String(res));
          ok = false;
          break;
        }
      }
    });
    return ok;
  }

  // Index page specific functions
  function scrollToNext() {
    const heroSection = document.querySelector('.hero-section');
    const aboutSection = document.querySelector('.py-5.bg-dark');
    
    if (aboutSection) {
      aboutSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  // Logout binding
  async function doLogout() {
    try {
      const api = new ApiManager();
      await api.post('/api/auth/logout', {});
      showToast('Logout effettuato', 'success');
      setTimeout(() => { window.location.href = '/'; }, 300);
    } catch (err) {
      showToast(err.message || 'Errore durante il logout', 'error');
    }
  }

  function bindLogout() {
    // Buttons/links with data-logout
    document.querySelectorAll('[data-logout]')
      .forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); doLogout(); }));

    // Intercept forms that post to /api/auth/logout
    document.querySelectorAll('form[action="/api/auth/logout"][method="POST"], form[action="/api/auth/logout"][method="post"]')
      .forEach(form => form.addEventListener('submit', (e) => { e.preventDefault(); doLogout(); }));
  }

  // Export utilities
  window.Utils = {
    showToast,
    apiFetch,
    ApiManager,
    Validator,
    setFieldInvalid,
    clearFieldInvalid,
    validateForm,
    scrollToNext,
    doLogout,
    bindLogout
  };
})();

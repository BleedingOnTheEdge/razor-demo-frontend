/* ============================================================
   RAZOR CLOUD — i18n Localization Engine
   ============================================================ */
(function() {
  const STORAGE_KEY = 'rz_culture';
  const savedCulture = localStorage.getItem(STORAGE_KEY) || 'en-US';

  const i18n = {
    currentCulture: savedCulture,
    timezone: savedCulture === 'fa-IR' ? 'Asia/Tehran' : 'UTC',

    t: function(key, fallback = '') {
      const dict = this.currentCulture === 'fa-IR' ? (window.I18N_FA || {}) : (window.I18N_EN || {});
      if (dict[key] !== undefined) {
        return dict[key];
      }
      const enDict = window.I18N_EN || {};
      return enDict[key] !== undefined ? enDict[key] : (fallback || key);
    },

    setCulture: function(culture) {
      if (culture !== 'en-US' && culture !== 'fa-IR') return;
      this.currentCulture = culture;
      this.timezone = culture === 'fa-IR' ? 'Asia/Tehran' : 'UTC';
      localStorage.setItem(STORAGE_KEY, culture);

      const html = document.documentElement;
      const body = document.body;
      const isRtl = culture === 'fa-IR';

      html.setAttribute('lang', isRtl ? 'fa' : 'en');
      html.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
      
      if (isRtl) {
        body.classList.add('rtl');
      } else {
        body.classList.remove('rtl');
      }

      window.dispatchEvent(new CustomEvent('cultureChanged', { detail: { culture, isRtl } }));

      // Re-render UI components if app is loaded
      if (window.RZ) {
        if (typeof window.renderNav === 'function') window.renderNav();
        if (typeof window.renderNotifs === 'function') window.renderNotifs();
        if (window.RZ.go && window.S && window.S.page) {
          window.RZ.go(window.S.page);
        }
      }
    },

    toggleCulture: function() {
      const next = this.currentCulture === 'en-US' ? 'fa-IR' : 'en-US';
      this.setCulture(next);
    },

    formatNumber: function(n, maximumFractionDigits = 0) {
      if (n === null || n === undefined || isNaN(n)) return '—';
      const formatted = Number(n).toLocaleString('en-US', { maximumFractionDigits });
      return this.currentCulture === 'fa-IR' && window.Jalali
        ? window.Jalali.toPersianDigits(formatted)
        : formatted;
    },

    formatCurrency: function(n) {
      if (n === null || n === undefined || isNaN(n)) return '—';
      const sign = n < 0 ? '-' : '';
      const absVal = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const str = `${sign}$${absVal}`;
      return this.currentCulture === 'fa-IR' && window.Jalali
        ? window.Jalali.toPersianDigits(str)
        : str;
    },

    formatPercent: function(n) {
      if (n === null || n === undefined || isNaN(n)) return '—';
      const sign = n >= 0 ? '+' : '';
      const str = `${sign}${Number(n).toFixed(2)}%`;
      return this.currentCulture === 'fa-IR' && window.Jalali
        ? window.Jalali.toPersianDigits(str.replace('%', '٪'))
        : str;
    },

    formatRelativeTime: function(ts) {
      const s = Math.floor((Date.now() - ts) / 1000);
      const isFa = this.currentCulture === 'fa-IR';

      if (s < 60) {
        return isFa ? `${window.Jalali.toPersianDigits(s)} ثانیه پیش` : `${s}s ago`;
      }
      if (s < 3600) {
        const m = Math.floor(s / 60);
        return isFa ? `${window.Jalali.toPersianDigits(m)} دقیقه پیش` : `${m}m ago`;
      }
      if (s < 86400) {
        const h = Math.floor(s / 3600);
        return isFa ? `${window.Jalali.toPersianDigits(h)} ساعت پیش` : `${h}h ago`;
      }
      const d = Math.floor(s / 86400);
      return isFa ? `${window.Jalali.toPersianDigits(d)} روز پیش` : `${d}d ago`;
    },

    formatClock: function(date = new Date()) {
      const pad = n => String(n).padStart(2, '0');
      if (this.currentCulture === 'fa-IR') {
        // Tehran time (+03:30)
        // Convert to Tehran time
        const tehranOffset = 3.5 * 60; // minutes
        const localOffset = -date.getTimezoneOffset(); // local offset in minutes
        const diff = (tehranOffset - localOffset) * 60 * 1000;
        const tehranDate = new Date(date.getTime() + diff);

        const [jy, jm, jd] = window.Jalali.dateToJalali(tehranDate);
        const timeStr = `${pad(tehranDate.getHours())}:${pad(tehranDate.getMinutes())}:${pad(tehranDate.getSeconds())}`;
        const dateStr = `${jy}/${pad(jm)}/${pad(jd)}`;
        return `${window.Jalali.toPersianDigits(dateStr)} ${window.Jalali.toPersianDigits(timeStr)} IRST`;
      } else {
        // UTC
        const y = date.getUTCFullYear();
        const m = pad(date.getUTCMonth() + 1);
        const d = pad(date.getUTCDate());
        const h = pad(date.getUTCHours());
        const min = pad(date.getUTCMinutes());
        const s = pad(date.getUTCSeconds());
        return `${y}-${m}-${d} ${h}:${min}:${s} UTC`;
      }
    }
  };

  window.i18n = i18n;
  window.t = (k, f) => i18n.t(k, f);
  window.fmtN = (n) => i18n.formatNumber(n);
  window.fmtM = (n) => i18n.formatCurrency(n);
  window.fmtP = (n) => i18n.formatPercent(n);
  window.ago = (ts) => i18n.formatRelativeTime(ts);
  window.utcStr = (d) => i18n.formatClock(d);

  // Apply initial culture on load
  document.addEventListener('DOMContentLoaded', () => {
    i18n.setCulture(savedCulture);
  });
})();

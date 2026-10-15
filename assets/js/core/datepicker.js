/* ============================================================
   RAZOR CLOUD — Shamsi & Gregorian DatePicker Component
   ============================================================ */
(function() {
  let activePicker = null;

  function pad(n) { return String(n).padStart(2, '0'); }

  class RazorDatePicker {
    constructor(inputElement, options = {}) {
      this.input = inputElement;
      this.options = Object.assign({
        isShamsi: (window.i18n && window.i18n.currentCulture === 'fa-IR') || document.documentElement.getAttribute('dir') === 'rtl',
        onSelect: null
      }, options);

      this.popup = null;
      this.currentViewYear = null;
      this.currentViewMonth = null;
      this.selectedDate = null; // standard Date object

      this.init();
    }

    init() {
      // Parse initial value if present
      const val = this.input.dataset.iso || this.input.value;
      if (val) {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          this.selectedDate = d;
        }
      }

      // Check current culture mode
      this.updateDisplayValue();

      // Click or focus opens picker
      this.input.setAttribute('readonly', 'readonly');
      this.input.style.cursor = 'pointer';

      this.input.addEventListener('click', (e) => {
        e.stopPropagation();
        this.open();
      });

      // Update when culture changes
      window.addEventListener('cultureChanged', () => {
        this.options.isShamsi = window.i18n.currentCulture === 'fa-IR';
        this.updateDisplayValue();
        if (this.popup) this.renderCalendar();
      });
    }

    updateDisplayValue() {
      if (!this.selectedDate) return;
      const isFa = (window.i18n && window.i18n.currentCulture === 'fa-IR');
      const d = this.selectedDate;
      const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      this.input.dataset.iso = iso;

      if (isFa) {
        const [jy, jm, jd] = window.Jalali.dateToJalali(d);
        this.input.value = window.Jalali.toPersianDigits(`${jy}/${pad(jm)}/${pad(jd)}`);
      } else {
        this.input.value = iso;
      }
    }

    open() {
      if (activePicker && activePicker !== this) {
        activePicker.close();
      }

      this.options.isShamsi = (window.i18n && window.i18n.currentCulture === 'fa-IR');

      if (!this.popup) {
        this.popup = document.createElement('div');
        this.popup.className = 'rz-datepicker-popup';
        document.body.appendChild(this.popup);

        this.popup.addEventListener('click', (e) => e.stopPropagation());
      }

      const refDate = this.selectedDate || new Date();
      if (this.options.isShamsi) {
        const [jy, jm] = window.Jalali.dateToJalali(refDate);
        this.currentViewYear = jy;
        this.currentViewMonth = jm;
      } else {
        this.currentViewYear = refDate.getFullYear();
        this.currentViewMonth = refDate.getMonth() + 1;
      }

      this.renderCalendar();
      this.positionPopup();
      this.popup.style.display = 'block';
      activePicker = this;
    }

    close() {
      if (this.popup) {
        this.popup.style.display = 'none';
      }
      if (activePicker === this) {
        activePicker = null;
      }
    }

    positionPopup() {
      const rect = this.input.getBoundingClientRect();
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const popupWidth = 290;

      let top = rect.bottom + scrollY + 6;
      let left = rect.left + scrollX;

      // Ensure inside viewport
      if (left + popupWidth > window.innerWidth - 10) {
        left = window.innerWidth - popupWidth - 10;
      }
      if (left < 10) left = 10;

      this.popup.style.top = `${top}px`;
      this.popup.style.left = `${left}px`;
    }

    renderCalendar() {
      const isFa = this.options.isShamsi;
      const t = window.t || ((k) => k);

      let headerHtml = '';
      let weekdaysHtml = '';
      let daysHtml = '';

      if (isFa) {
        // Shamsi Mode
        const monthNames = window.Jalali.PersianMonths;
        const weekdays = window.Jalali.PersianWeekDaysShortSaturdayFirst;

        // Nav and Title
        headerHtml = `
          <div class="rz-dp-header">
            <button class="rz-dp-nav-btn" data-act="prevMonth" title="${t('prevMonth', 'ماه قبل')}">${window.ic('chevron', 'spin-prev')}</button>
            <div class="rz-dp-title">
              <select class="rz-dp-select" data-act="selectMonth">
                ${monthNames.map((m, idx) => `<option value="${idx + 1}" ${idx + 1 === this.currentViewMonth ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
              <select class="rz-dp-select" data-act="selectYear">
                ${Array.from({ length: 40 }, (_, i) => 1385 + i).map(y => `<option value="${y}" ${y === this.currentViewYear ? 'selected' : ''}>${window.Jalali.toPersianDigits(y)}</option>`).join('')}
              </select>
            </div>
            <button class="rz-dp-nav-btn" data-act="nextMonth" title="${t('nextMonth', 'ماه بعد')}">${window.ic('chevron', 'spin-next')}</button>
          </div>
        `;

        weekdaysHtml = `<div class="rz-dp-weekdays">${weekdays.map(w => `<span>${w}</span>`).join('')}</div>`;

        // Calculate days in month and starting day of week
        const daysInMonth = window.Jalali.getJalaliMonthDays(this.currentViewYear, this.currentViewMonth);
        const [firstGy, firstGm, firstGd] = window.Jalali.jalaliToGregorian(this.currentViewYear, this.currentViewMonth, 1);
        const firstDayGregorian = new Date(firstGy, firstGm - 1, firstGd).getDay(); // 0 is Sun, 6 is Sat
        // In Persian calendar, Sat is 0, Sun is 1, ..., Fri is 6
        const startDayIndex = (firstDayGregorian + 1) % 7;

        // Empty cells before start
        for (let i = 0; i < startDayIndex; i++) {
          daysHtml += `<div class="rz-dp-day empty"></div>`;
        }

        // Today in Shamsi
        const [todayJy, todayJm, todayJd] = window.Jalali.dateToJalali(new Date());

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
          const isToday = (this.currentViewYear === todayJy && this.currentViewMonth === todayJm && day === todayJd);
          let isSelected = false;
          if (this.selectedDate) {
            const [selJy, selJm, selJd] = window.Jalali.dateToJalali(this.selectedDate);
            isSelected = (this.currentViewYear === selJy && this.currentViewMonth === selJm && day === selJd);
          }
          const dayOfWeekIndex = (startDayIndex + day - 1) % 7;
          const isFriday = dayOfWeekIndex === 6;

          const cls = [
            'rz-dp-day',
            isToday ? 'today' : '',
            isSelected ? 'selected' : '',
            isFriday ? 'friday' : ''
          ].filter(Boolean).join(' ');

          daysHtml += `<div class="${cls}" data-day="${day}">${window.Jalali.toPersianDigits(day)}</div>`;
        }

      } else {
        // Gregorian Mode
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

        headerHtml = `
          <div class="rz-dp-header">
            <button class="rz-dp-nav-btn" data-act="prevMonth" title="Previous Month">${window.ic('chevron')}</button>
            <div class="rz-dp-title">
              <select class="rz-dp-select" data-act="selectMonth">
                ${monthNames.map((m, idx) => `<option value="${idx + 1}" ${idx + 1 === this.currentViewMonth ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
              <select class="rz-dp-select" data-act="selectYear">
                ${Array.from({ length: 40 }, (_, i) => 2010 + i).map(y => `<option value="${y}" ${y === this.currentViewYear ? 'selected' : ''}>${y}</option>`).join('')}
              </select>
            </div>
            <button class="rz-dp-nav-btn" data-act="nextMonth" title="Next Month">${window.ic('chevron')}</button>
          </div>
        `;

        weekdaysHtml = `<div class="rz-dp-weekdays">${weekdays.map(w => `<span>${w}</span>`).join('')}</div>`;

        const daysInMonth = new Date(this.currentViewYear, this.currentViewMonth, 0).getDate();
        const startDayIndex = new Date(this.currentViewYear, this.currentViewMonth - 1, 1).getDay();

        for (let i = 0; i < startDayIndex; i++) {
          daysHtml += `<div class="rz-dp-day empty"></div>`;
        }

        const now = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
          const isToday = (this.currentViewYear === now.getFullYear() && this.currentViewMonth === (now.getMonth() + 1) && day === now.getDate());
          let isSelected = false;
          if (this.selectedDate) {
            isSelected = (this.currentViewYear === this.selectedDate.getFullYear() && this.currentViewMonth === (this.selectedDate.getMonth() + 1) && day === this.selectedDate.getDate());
          }

          const cls = ['rz-dp-day', isToday ? 'today' : '', isSelected ? 'selected' : ''].filter(Boolean).join(' ');
          daysHtml += `<div class="${cls}" data-day="${day}">${day}</div>`;
        }
      }

      const todayLabel = isFa ? 'امروز' : 'Today';
      const clearLabel = isFa ? 'پاک کردن' : 'Clear';
      const closeLabel = isFa ? 'بستن' : 'Close';

      const footerHtml = `
        <div class="rz-dp-footer">
          <button class="primary" data-act="today">${todayLabel}</button>
          <div class="flex gap8">
            <button data-act="clear">${clearLabel}</button>
            <button data-act="close">${closeLabel}</button>
          </div>
        </div>
      `;

      this.popup.innerHTML = headerHtml + weekdaysHtml + `<div class="rz-dp-days">${daysHtml}</div>` + footerHtml;
      this.bindEvents();
    }

    bindEvents() {
      // Prev / Next month buttons
      this.popup.querySelector('[data-act="prevMonth"]').onclick = () => {
        this.currentViewMonth--;
        if (this.currentViewMonth < 1) {
          this.currentViewMonth = 12;
          this.currentViewYear--;
        }
        this.renderCalendar();
      };

      this.popup.querySelector('[data-act="nextMonth"]').onclick = () => {
        this.currentViewMonth++;
        if (this.currentViewMonth > 12) {
          this.currentViewMonth = 1;
          this.currentViewYear++;
        }
        this.renderCalendar();
      };

      // Select month / year
      this.popup.querySelector('[data-act="selectMonth"]').onchange = (e) => {
        this.currentViewMonth = parseInt(e.target.value, 10);
        this.renderCalendar();
      };

      this.popup.querySelector('[data-act="selectYear"]').onchange = (e) => {
        this.currentViewYear = parseInt(e.target.value, 10);
        this.renderCalendar();
      };

      // Day pick
      this.popup.querySelectorAll('.rz-dp-day:not(.empty)').forEach(el => {
        el.onclick = () => {
          const day = parseInt(el.dataset.day, 10);
          this.pickDate(day);
        };
      });

      // Footer actions
      this.popup.querySelector('[data-act="today"]').onclick = () => {
        this.selectedDate = new Date();
        this.updateDisplayValue();
        if (this.options.onSelect) this.options.onSelect(this.selectedDate);
        this.close();
      };

      this.popup.querySelector('[data-act="clear"]').onclick = () => {
        this.selectedDate = null;
        this.input.value = '';
        this.input.dataset.iso = '';
        if (this.options.onSelect) this.options.onSelect(null);
        this.close();
      };

      this.popup.querySelector('[data-act="close"]').onclick = () => {
        this.close();
      };
    }

    pickDate(day) {
      if (this.options.isShamsi) {
        const [gy, gm, gd] = window.Jalali.jalaliToGregorian(this.currentViewYear, this.currentViewMonth, day);
        this.selectedDate = new Date(gy, gm - 1, gd);
      } else {
        this.selectedDate = new Date(this.currentViewYear, this.currentViewMonth - 1, day);
      }

      this.updateDisplayValue();
      if (this.options.onSelect) this.options.onSelect(this.selectedDate);
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
      this.close();
    }
  }

  // Global document click listener to close picker
  document.addEventListener('click', (e) => {
    if (activePicker && !activePicker.input.contains(e.target) && !activePicker.popup.contains(e.target)) {
      activePicker.close();
    }
  });

  window.RazorDatePicker = RazorDatePicker;

  // Auto-initialize helper
  window.initDatePickers = function(container = document) {
    container.querySelectorAll('input[type="date"], input.rz-date').forEach(input => {
      if (!input._rzDatePicker) {
        input._rzDatePicker = new RazorDatePicker(input);
      }
    });
  };
})();

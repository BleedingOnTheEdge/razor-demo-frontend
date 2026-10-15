/* ============================================================
   RAZOR CLOUD — Jalali (Shamsi) Calendar Engine
   ============================================================ */
(function() {
  const PersianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد',
    'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر',
    'دی', 'بهمن', 'اسفند'
  ];

  const PersianWeekDays = [
    'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
  ];

  const PersianWeekDaysShort = [
    'ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'
  ];

  // Calendar starts on Saturday in Iran (index 0 = شنبه)
  const PersianWeekDaysSaturdayFirst = [
    'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'
  ];

  const PersianWeekDaysShortSaturdayFirst = [
    'ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'
  ];

  function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
    let jy = -1595 + (33 * Math.floor(days / 12053));
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    let jm, jd;
    if (days < 186) {
      jm = 1 + Math.floor(days / 31);
      jd = 1 + (days % 31);
    } else {
      jm = 7 + Math.floor((days - 186) / 30);
      jd = 1 + ((days - 186) % 30);
    }
    return [jy, jm, jd];
  }

  function jalaliToGregorian(jy, jm, jd) {
    let jy2 = jy + 1595;
    let days = -355668 + (365 * jy2) + Math.floor(jy2 / 33) * 8 + Math.floor(((jy2 % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    let gy = 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) {
      gy += 100 * Math.floor(--days / 36524);
      days %= 36524;
      if (days >= 365) days++;
    }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      gy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    let gd = days + 1;
    const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 0;
    while (gm < 13 && gd > sal_a[gm]) {
      gd -= sal_a[gm];
      gm++;
    }
    return [gy, gm, gd];
  }

  function isJalaliLeap(jy) {
    const [gy, gm, gd] = jalaliToGregorian(jy, 12, 30);
    const [backJy] = gregorianToJalali(gy, gm, gd);
    return backJy === jy;
  }

  function getJalaliMonthDays(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return isJalaliLeap(jy) ? 30 : 29;
  }

  function toPersianDigits(n) {
    const pDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(n).replace(/[0-9]/g, w => pDigits[+w]);
  }

  function toEnglishDigits(str) {
    if (!str) return '';
    return String(str)
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function dateToJalali(date) {
    const d = date instanceof Date ? date : new Date(date);
    return gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  function formatJalali(date, options = {}) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '—';
    const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    
    if (options.format === 'short') {
      const res = `${jy}/${pad(jm)}/${pad(jd)}`;
      return options.persianDigits ? toPersianDigits(res) : res;
    }
    
    if (options.format === 'full') {
      const monthName = PersianMonths[jm - 1];
      const hours = pad(d.getHours());
      const mins = pad(d.getMinutes());
      const secs = pad(d.getSeconds());
      const res = `${jd} ${monthName} ${jy}، ${hours}:${mins}:${secs}`;
      return options.persianDigits ? toPersianDigits(res) : res;
    }

    // Default friendly date: "۲۴ مهر ۱۴۰۵"
    const monthName = PersianMonths[jm - 1];
    const res = `${jd} ${monthName} ${jy}`;
    return options.persianDigits !== false ? toPersianDigits(res) : res;
  }

  window.Jalali = {
    gregorianToJalali,
    jalaliToGregorian,
    isJalaliLeap,
    getJalaliMonthDays,
    toPersianDigits,
    toEnglishDigits,
    dateToJalali,
    formatJalali,
    PersianMonths,
    PersianWeekDays,
    PersianWeekDaysShort,
    PersianWeekDaysSaturdayFirst,
    PersianWeekDaysShortSaturdayFirst
  };
})();

import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { DatePipe } from '@angular/common';
import { dates } from '@app/shared/i18n/dates';

const intervals = {
  year: 31536000,
  month: 2592000,
  week: 604800,
  day: 86400,
  hour: 3600,
  minute: 60,
  second: 1
};

const precisionThresholds = {
  year: 100,
  month: 18,
  week: 12,
  day: 31,
  hour: 48,
  minute: 90,
  second: 90
};

const russianUnits: Record<string, [string, string, string, string]> = {
  year: ['год', 'года', 'лет', 'год'],
  month: ['месяц', 'месяца', 'месяцев', 'месяц'],
  week: ['неделя', 'недели', 'недель', 'неделю'],
  day: ['день', 'дня', 'дней', 'день'],
  hour: ['час', 'часа', 'часов', 'час'],
  minute: ['минута', 'минуты', 'минут', 'минуту'],
  second: ['секунда', 'секунды', 'секунд', 'секунду'],
};

// Nominative singular, paucal, genitive plural, accusative singular and
// genitive singular (used after «протягом» and for fractional amounts).
const ukrainianUnits: Record<string, [string, string, string, string, string]> = {
  year: ['рік', 'роки', 'років', 'рік', 'року'],
  month: ['місяць', 'місяці', 'місяців', 'місяць', 'місяця'],
  week: ['тиждень', 'тижні', 'тижнів', 'тиждень', 'тижня'],
  day: ['день', 'дні', 'днів', 'день', 'дня'],
  hour: ['година', 'години', 'годин', 'годину', 'години'],
  minute: ['хвилина', 'хвилини', 'хвилин', 'хвилину', 'хвилини'],
  second: ['секунда', 'секунди', 'секунд', 'секунду', 'секунди'],
};

// Singular, paucal, plural, accusative singular and genitive singular.
const polishUnits: Record<string, [string, string, string, string, string]> = {
  year: ['rok', 'lata', 'lat', 'rok', 'roku'],
  month: ['miesiąc', 'miesiące', 'miesięcy', 'miesiąc', 'miesiąca'],
  week: ['tydzień', 'tygodnie', 'tygodni', 'tydzień', 'tygodnia'],
  day: ['dzień', 'dni', 'dni', 'dzień', 'dnia'],
  hour: ['godzina', 'godziny', 'godzin', 'godzinę', 'godziny'],
  minute: ['minuta', 'minuty', 'minut', 'minutę', 'minuty'],
  second: ['sekunda', 'sekundy', 'sekund', 'sekundę', 'sekundy'],
};

// Czech case forms vary with the preposition as well as the count.
// nominative one/few, genitive plural/singular, accusative singular,
// instrumental singular/plural.
const czechUnits: Record<string, [string, string, string, string, string, string, string]> = {
  year: ['rok', 'roky', 'let', 'roku', 'rok', 'rokem', 'lety'],
  month: ['měsíc', 'měsíce', 'měsíců', 'měsíce', 'měsíc', 'měsícem', 'měsíci'],
  week: ['týden', 'týdny', 'týdnů', 'týdne', 'týden', 'týdnem', 'týdny'],
  day: ['den', 'dny', 'dní', 'dne', 'den', 'dnem', 'dny'],
  hour: ['hodina', 'hodiny', 'hodin', 'hodiny', 'hodinu', 'hodinou', 'hodinami'],
  minute: ['minuta', 'minuty', 'minut', 'minuty', 'minutu', 'minutou', 'minutami'],
  second: ['sekunda', 'sekundy', 'sekund', 'sekundy', 'sekundu', 'sekundou', 'sekundami'],
};

const norwegianUnits: Record<string, [string, string]> = {
  year: ['år', 'år'], month: ['måned', 'måneder'], week: ['uke', 'uker'],
  day: ['dag', 'dager'], hour: ['time', 'timer'], minute: ['minutt', 'minutter'],
  second: ['sekund', 'sekunder'],
};

function norwegianDuration(kind: string, unit: string, amount: number): string | null {
  const forms = norwegianUnits[unit];
  if (!forms || !Number.isFinite(amount)) return null;
  const noun = new Intl.PluralRules('nb').select(amount) === 'one' ? forms[0] : forms[1];
  const duration = `${amount.toLocaleString('nb')} ${noun}`;
  switch (kind) {
    case 'since': return `For ${duration} siden`;
    case 'until': return `Om ~${duration}`;
    case 'within': return `Innen ~${duration}`;
    case 'span': return `Etter ${duration}`;
    case 'before': return `${duration} tidligere`;
    default: return duration;
  }
}

const swedishUnits: Record<string, [string, string]> = {
  year: ['år', 'år'], month: ['månad', 'månader'], week: ['vecka', 'veckor'],
  day: ['dag', 'dagar'], hour: ['timme', 'timmar'], minute: ['minut', 'minuter'],
  second: ['sekund', 'sekunder'],
};

function swedishDuration(kind: string, unit: string, amount: number): string | null {
  const forms = swedishUnits[unit];
  if (!forms || !Number.isFinite(amount)) return null;
  const noun = new Intl.PluralRules('sv').select(amount) === 'one' ? forms[0] : forms[1];
  const duration = `${amount.toLocaleString('sv')} ${noun}`;
  switch (kind) {
    case 'since': return `För ${duration} sedan`;
    case 'until': return `Om ~${duration}`;
    case 'within': return `Inom ~${duration}`;
    case 'span': return `Efter ${duration}`;
    case 'before': return `${duration} tidigare`;
    default: return duration;
  }
}

function czechDuration(kind: string, unit: string, amount: number): string | null {
  const forms = czechUnits[unit];
  if (!forms || !Number.isFinite(amount)) return null;
  const category = new Intl.PluralRules('cs').select(amount);
  const base = category === 'one' ? 0 : category === 'few' ? 1 : category === 'many' ? 3 : 2;
  const isPast = kind === 'since' || kind === 'before';
  const index = isPast ? (category === 'one' || category === 'many' ? 5 : 6)
    : kind === 'within' ? (category === 'one' || category === 'many' ? 3 : 2)
    : ['until', 'span'].includes(kind) && category === 'one' ? 4 : base;
  const duration = `${amount.toLocaleString('cs')} ${forms[index]}`;
  switch (kind) {
    case 'since': case 'before': return `Před ${duration}`;
    case 'until': return `Za ~${duration}`;
    case 'within': return `Během ~${duration}`;
    case 'span': return `Za ${duration}`;
    default: return duration;
  }
}

function polishDuration(kind: string, unit: string, amount: number): string | null {
  const forms = polishUnits[unit];
  if (!forms || !Number.isFinite(amount)) return null;
  const category = new Intl.PluralRules('pl').select(amount);
  const index = category === 'one' ? 0 : category === 'few' ? 1 : category === 'many' ? 2 : 4;
  const noun = kind === 'within' ? forms[index === 0 || index === 4 ? 4 : 2]
    : ['since', 'until', 'span', 'before'].includes(kind) && index === 0 ? forms[3] : forms[index];
  const duration = `${amount.toLocaleString('pl')} ${noun}`;
  switch (kind) {
    case 'since': return `${duration} temu`;
    case 'until': return `Za ~${duration}`;
    case 'within': return `W ciągu ~${duration}`;
    case 'span': return `Za ${duration}`;
    case 'before': return `${duration} przed`;
    default: return duration;
  }
}

function ukrainianDuration(kind: string, unit: string, amount: number): string | null {
  const forms = ukrainianUnits[unit];
  if (!forms || !Number.isFinite(amount)) return null;
  const category = new Intl.PluralRules('uk').select(amount);
  const index = category === 'one' ? 0 : category === 'few' ? 1 : category === 'many' ? 2 : 4;
  const noun = kind === 'within' ? forms[index === 0 || index === 4 ? 4 : 2]
    : ['since', 'until', 'span', 'before'].includes(kind) && index === 0 ? forms[3] : forms[index];
  const duration = `${amount.toLocaleString('uk')} ${noun}`;
  switch (kind) {
    case 'since': return `${duration} тому`;
    case 'until': return `Через ~${duration}`;
    case 'within': return `Протягом ~${duration}`;
    case 'span': return `Через ${duration}`;
    case 'before': return `За ${duration} до`;
    default: return duration;
  }
}

function russianDuration(kind: string, unit: string, amount: number): string | null {
  const forms = russianUnits[unit];
  if (!forms || !Number.isFinite(amount)) return null;
  const category = new Intl.PluralRules('ru').select(amount);
  const index = category === 'one' ? 0 : category === 'few' || category === 'other' ? 1 : 2;
  const accusative = kind === 'until' || kind === 'span' || kind === 'before';
  const noun = kind === 'within' && index === 0 ? forms[1] : accusative && index === 0 ? forms[3] : forms[index];
  const duration = `${amount.toLocaleString('ru')} ${noun}`;
  switch (kind) {
    case 'since': return `${duration} назад`;
    case 'until': return `Через ~${duration}`;
    case 'within': return `В течение ~${duration}`;
    case 'span': return `Через ${duration}`;
    case 'before': return `За ${duration} до`;
    default: return duration;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TimeService {

  constructor(private datePipe: DatePipe, @Inject(LOCALE_ID) private locale: string) {}

  calculate(
    time: number,
    kind: 'plain' | 'since' | 'until' | 'span' | 'before' | 'within',
    relative: boolean = false,
    precision: number = 0,
    minUnit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' = 'second',
    showTooltip: boolean = false,
    units: string[] = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'],
    dateString?: string,
    lowercaseStart: boolean = false,
    numUnits: number = 1,
    fractionDigits: number = 0,
  ): { text: string, tooltip: string } {
    if (time == null) {
      return { text: '', tooltip: '' };
    }

    let seconds: number;
    let tooltip: string = '';
    switch (kind) {
      case 'since':
        seconds = Math.floor((+new Date() - +new Date(dateString || time * 1000)) / 1000);
        tooltip = this.datePipe.transform(new Date(dateString || time * 1000), 'yyyy-MM-dd HH:mm') || '';
        break;
      case 'until':
      case 'within':
        seconds = (+new Date(time) - +new Date()) / 1000;
        tooltip = this.datePipe.transform(new Date(time), 'yyyy-MM-dd HH:mm') || '';
        break;
      default:
        seconds = Math.floor(time);
        tooltip = '';
    }

    if (!showTooltip || relative) {
      tooltip = '';
    }

    if (seconds < 1 && kind === 'span') {
      return { tooltip, text: $localize`:@@date-base.immediately:Immediately` };
    } else if (seconds < 60) {
      if (relative || kind === 'since') {
        if (lowercaseStart) {
          return { tooltip, text: $localize`:@@date-base.just-now:Just now`.charAt(0).toLowerCase() + $localize`:@@date-base.just-now:Just now`.slice(1) };
        }
        return { tooltip, text: $localize`:@@date-base.just-now:Just now` };
      } else if (kind === 'until' || kind === 'within') {
        seconds = 60;
      }
    }

    let counter: number;
    const result: string[] = [];
    let usedUnits = 0;
    for (const [index, unit] of units.entries()) {
      let precisionUnit = units[Math.min(units.length - 1, index + precision)];
      counter = Math.floor(seconds / intervals[unit]);
      const precisionCounter = Math.round(seconds / intervals[precisionUnit]);
      if (precisionCounter > precisionThresholds[precisionUnit]) {
        precisionUnit = unit;
      }
      if (units.indexOf(precisionUnit) === units.indexOf(minUnit)) {
        counter = Math.max(1, counter);
      }
      if (counter > 0) {
        let rounded;
        const roundFactor = Math.pow(10,fractionDigits || 0);
        if ((kind === 'until' || kind === 'within') && usedUnits < numUnits) {
          rounded = Math.floor((seconds / intervals[precisionUnit]) * roundFactor) / roundFactor;
        } else {
          rounded = Math.round((seconds / intervals[precisionUnit]) * roundFactor) / roundFactor;
        }
        if ((kind !== 'until' && kind !== 'within')|| numUnits === 1) {
          return { tooltip, text: this.formatTime(kind, precisionUnit, rounded) };
        } else {
          if (!usedUnits) {
            result.push(this.formatTime(kind, precisionUnit, rounded));
          } else {
            result.push(this.formatTime('', precisionUnit, rounded));
          }
          seconds -= (rounded * intervals[precisionUnit]);
          usedUnits++;
          if (usedUnits >= numUnits) {
            return { tooltip, text: result.join(', ') };
          }
        }
      }
    }
    return { tooltip, text: result.join(', ') };
  }

  private formatTime(kind, unit, number): string {
    if (/^nb(?:-|$)/i.test(this.locale)) {
      const localized = norwegianDuration(kind, unit, number);
      if (localized) return localized;
    }
    if (/^sv(?:-|$)/i.test(this.locale)) {
      const localized = swedishDuration(kind, unit, number);
      if (localized) return localized;
    }
    if (/^cs(?:-|$)/i.test(this.locale)) {
      const localized = czechDuration(kind, unit, number);
      if (localized) return localized;
    }
    if (/^pl(?:-|$)/i.test(this.locale)) {
      const localized = polishDuration(kind, unit, number);
      if (localized) return localized;
    }
    if (/^uk(?:-|$)/i.test(this.locale)) {
      const localized = ukrainianDuration(kind, unit, number);
      if (localized) return localized;
    }
    if (/^ru(?:-|$)/i.test(this.locale)) {
      const localized = russianDuration(kind, unit, number);
      if (localized) return localized;
    }
    const dateStrings = dates(number);
    switch (kind) {
      case 'since':
        if (number === 1) {
          switch (unit) { // singular (1 day)
            case 'year': return $localize`:@@time-since:${dateStrings.i18nYear}:DATE: ago`;
            case 'month': return $localize`:@@time-since:${dateStrings.i18nMonth}:DATE: ago`;
            case 'week': return $localize`:@@time-since:${dateStrings.i18nWeek}:DATE: ago`;
            case 'day': return $localize`:@@time-since:${dateStrings.i18nDay}:DATE: ago`;
            case 'hour': return $localize`:@@time-since:${dateStrings.i18nHour}:DATE: ago`;
            case 'minute': return $localize`:@@time-since:${dateStrings.i18nMinute}:DATE: ago`;
            case 'second': return $localize`:@@time-since:${dateStrings.i18nSecond}:DATE: ago`;
          }
        } else {
          switch (unit) { // plural (2 days)
            case 'year': return $localize`:@@time-since:${dateStrings.i18nYears}:DATE: ago`;
            case 'month': return $localize`:@@time-since:${dateStrings.i18nMonths}:DATE: ago`;
            case 'week': return $localize`:@@time-since:${dateStrings.i18nWeeks}:DATE: ago`;
            case 'day': return $localize`:@@time-since:${dateStrings.i18nDays}:DATE: ago`;
            case 'hour': return $localize`:@@time-since:${dateStrings.i18nHours}:DATE: ago`;
            case 'minute': return $localize`:@@time-since:${dateStrings.i18nMinutes}:DATE: ago`;
            case 'second': return $localize`:@@time-since:${dateStrings.i18nSeconds}:DATE: ago`;
          }
        }
        break;
      case 'until':
        if (number === 1) {
          switch (unit) { // singular (In ~1 day)
            case 'year': return $localize`:@@time-until:In ~${dateStrings.i18nYear}:DATE:`;
            case 'month': return $localize`:@@time-until:In ~${dateStrings.i18nMonth}:DATE:`;
            case 'week': return $localize`:@@time-until:In ~${dateStrings.i18nWeek}:DATE:`;
            case 'day': return $localize`:@@time-until:In ~${dateStrings.i18nDay}:DATE:`;
            case 'hour': return $localize`:@@time-until:In ~${dateStrings.i18nHour}:DATE:`;
            case 'minute': return $localize`:@@time-until:In ~${dateStrings.i18nMinute}:DATE:`;
            case 'second': return $localize`:@@time-until:In ~${dateStrings.i18nSecond}:DATE:`;
          }
        } else {
          switch (unit) { // plural (In ~2 days)
            case 'year': return $localize`:@@time-until:In ~${dateStrings.i18nYears}:DATE:`;
            case 'month': return $localize`:@@time-until:In ~${dateStrings.i18nMonths}:DATE:`;
            case 'week': return $localize`:@@time-until:In ~${dateStrings.i18nWeeks}:DATE:`;
            case 'day': return $localize`:@@time-until:In ~${dateStrings.i18nDays}:DATE:`;
            case 'hour': return $localize`:@@time-until:In ~${dateStrings.i18nHours}:DATE:`;
            case 'minute': return $localize`:@@time-until:In ~${dateStrings.i18nMinutes}:DATE:`;
            case 'second': return $localize`:@@time-until:In ~${dateStrings.i18nSeconds}:DATE:`;
          }
        }
        break;
      case 'within':
        if (number === 1) {
          switch (unit) { // singular (In ~1 day)
            case 'year': return $localize`:@@time-within:within ~${dateStrings.i18nYear}:DATE:`;
            case 'month': return $localize`:@@time-within:within ~${dateStrings.i18nMonth}:DATE:`;
            case 'week': return $localize`:@@time-within:within ~${dateStrings.i18nWeek}:DATE:`;
            case 'day': return $localize`:@@time-within:within ~${dateStrings.i18nDay}:DATE:`;
            case 'hour': return $localize`:@@time-within:within ~${dateStrings.i18nHour}:DATE:`;
            case 'minute': return $localize`:@@time-within:within ~${dateStrings.i18nMinute}:DATE:`;
            case 'second': return $localize`:@@time-within:within ~${dateStrings.i18nSecond}:DATE:`;
          }
        } else {
          switch (unit) { // plural (In ~2 days)
            case 'year': return $localize`:@@time-within:within ~${dateStrings.i18nYears}:DATE:`;
            case 'month': return $localize`:@@time-within:within ~${dateStrings.i18nMonths}:DATE:`;
            case 'week': return $localize`:@@time-within:within ~${dateStrings.i18nWeeks}:DATE:`;
            case 'day': return $localize`:@@time-within:within ~${dateStrings.i18nDays}:DATE:`;
            case 'hour': return $localize`:@@time-within:within ~${dateStrings.i18nHours}:DATE:`;
            case 'minute': return $localize`:@@time-within:within ~${dateStrings.i18nMinutes}:DATE:`;
            case 'second': return $localize`:@@time-within:within ~${dateStrings.i18nSeconds}:DATE:`;
          }
        }
        break;
      case 'span':
        if (number === 1) {
          switch (unit) { // singular (1 day)
            case 'year': return $localize`:@@time-span:After ${dateStrings.i18nYear}:DATE:`;
            case 'month': return $localize`:@@time-span:After ${dateStrings.i18nMonth}:DATE:`;
            case 'week': return $localize`:@@time-span:After ${dateStrings.i18nWeek}:DATE:`;
            case 'day': return $localize`:@@time-span:After ${dateStrings.i18nDay}:DATE:`;
            case 'hour': return $localize`:@@time-span:After ${dateStrings.i18nHour}:DATE:`;
            case 'minute': return $localize`:@@time-span:After ${dateStrings.i18nMinute}:DATE:`;
            case 'second': return $localize`:@@time-span:After ${dateStrings.i18nSecond}:DATE:`;
          }
        } else {
          switch (unit) { // plural (2 days)
            case 'year': return $localize`:@@time-span:After ${dateStrings.i18nYears}:DATE:`;
            case 'month': return $localize`:@@time-span:After ${dateStrings.i18nMonths}:DATE:`;
            case 'week': return $localize`:@@time-span:After ${dateStrings.i18nWeeks}:DATE:`;
            case 'day': return $localize`:@@time-span:After ${dateStrings.i18nDays}:DATE:`;
            case 'hour': return $localize`:@@time-span:After ${dateStrings.i18nHours}:DATE:`;
            case 'minute': return $localize`:@@time-span:After ${dateStrings.i18nMinutes}:DATE:`;
            case 'second': return $localize`:@@time-span:After ${dateStrings.i18nSeconds}:DATE:`;
          }
        }
        break;
      case 'before':
      if (number === 1) {
        switch (unit) { // singular (1 day)
          case 'year': return $localize`:@@time-before:${dateStrings.i18nYear}:DATE: before`;
          case 'month': return $localize`:@@time-before:${dateStrings.i18nMonth}:DATE: before`;
          case 'week': return $localize`:@@time-before:${dateStrings.i18nWeek}:DATE: before`;
          case 'day': return $localize`:@@time-before:${dateStrings.i18nDay}:DATE: before`;
          case 'hour': return $localize`:@@time-before:${dateStrings.i18nHour}:DATE: before`;
          case 'minute': return $localize`:@@time-before:${dateStrings.i18nMinute}:DATE: before`;
          case 'second': return $localize`:@@time-before:${dateStrings.i18nSecond}:DATE: before`;
        }
      } else {
        switch (unit) { // plural (2 days)
          case 'year': return $localize`:@@time-before:${dateStrings.i18nYears}:DATE: before`;
          case 'month': return $localize`:@@time-before:${dateStrings.i18nMonths}:DATE: before`;
          case 'week': return $localize`:@@time-before:${dateStrings.i18nWeeks}:DATE: before`;
          case 'day': return $localize`:@@time-before:${dateStrings.i18nDays}:DATE: before`;
          case 'hour': return $localize`:@@time-before:${dateStrings.i18nHours}:DATE: before`;
          case 'minute': return $localize`:@@time-before:${dateStrings.i18nMinutes}:DATE: before`;
          case 'second': return $localize`:@@time-before:${dateStrings.i18nSeconds}:DATE: before`;
        }
      }
      break;
      default:
        if (number === 1) {
          switch (unit) { // singular (1 day)
            case 'year': return dateStrings.i18nYear;
            case 'month': return dateStrings.i18nMonth;
            case 'week': return dateStrings.i18nWeek;
            case 'day': return dateStrings.i18nDay;
            case 'hour': return dateStrings.i18nHour;
            case 'minute': return dateStrings.i18nMinute;
            case 'second': return dateStrings.i18nSecond;
          }
        } else {
          switch (unit) { // plural (2 days)
            case 'year': return dateStrings.i18nYears;
            case 'month': return dateStrings.i18nMonths;
            case 'week': return dateStrings.i18nWeeks;
            case 'day': return dateStrings.i18nDays;
            case 'hour': return dateStrings.i18nHours;
            case 'minute': return dateStrings.i18nMinutes;
            case 'second': return dateStrings.i18nSeconds;
          }
        }
    }
    return '';
  }
}

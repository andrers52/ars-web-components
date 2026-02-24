/**
 * Tests for ArsCalendar
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest, vi } from '@jest/globals';

// Import the module
import { ArsCalendar } from '../components/ars-calendar/ars-calendar.js';

describe('ArsCalendar', () => {
  let element;

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '';
    element = document.createElement('ars-calendar');
    element.id = 'test-calendar';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Static properties', () => {
    it('should have observedAttributes', () => {
      expect(ArsCalendar.observedAttributes).toContain('localized_abbreviated_days');
      expect(ArsCalendar.observedAttributes).toContain('localized_months');
      expect(ArsCalendar.observedAttributes).toContain('localized_today');
      expect(ArsCalendar.observedAttributes).toContain('custom-css');
      expect(ArsCalendar.observedAttributes).toContain('css-vars');
    });
  });

  describe('Initialization', () => {
    it('should initialize events array', () => {
      expect(element.events).toEqual([]);
    });

    it('should initialize default months', () => {
      expect(element.months).toHaveLength(12);
      expect(element.months[0]).toBe('January');
    });

    it('should initialize default abbreviated days', () => {
      expect(element.localizedAbbreviatedDays).toHaveLength(7);
    });

    it('should initialize default today text', () => {
      expect(element.localizedToday).toBe('Today');
    });

    it('should initialize day slots', () => {
      expect(element.daySlots).toBeDefined();
      expect(element.daySlots.length).toBe(42); // 6 weeks * 7 days
    });
  });

  describe('Date utilities', () => {
    it('should get days in month correctly', () => {
      expect(element.numDaysInMonth(0, 2024)).toBe(31); // January
      expect(element.numDaysInMonth(1, 2024)).toBe(29); // February (leap year)
      expect(element.numDaysInMonth(1, 2023)).toBe(28); // February (non-leap)
      expect(element.numDaysInMonth(3, 2024)).toBe(30); // April
    });

    it('should get first day slot in month correctly', () => {
      const firstDay = element.firstDaySlotInMonth(0, 2024); // January 2024
      expect(firstDay).toBe(1); // Monday
    });
  });

  describe('Month navigation', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      jest.advanceTimersByTime(10);
    });

    it('should go to next month', () => {
      element.monthToShow = 0; // January
      element.yearToShow = 2024;
      
      element.nextMonth();
      
      expect(element.monthToShow).toBe(1);
      expect(element.yearToShow).toBe(2024);
    });

    it('should go to next year when wrapping', () => {
      element.monthToShow = 11; // December
      element.yearToShow = 2024;
      
      element.nextMonth();
      
      expect(element.monthToShow).toBe(0);
      expect(element.yearToShow).toBe(2025);
    });

    it('should go to previous month', () => {
      element.monthToShow = 1; // February
      element.yearToShow = 2024;
      
      element.previousMonth();
      
      expect(element.monthToShow).toBe(0);
      expect(element.yearToShow).toBe(2024);
    });

    it('should go to previous year when wrapping', () => {
      element.monthToShow = 0; // January
      element.yearToShow = 2024;
      
      element.previousMonth();
      
      expect(element.monthToShow).toBe(11);
      expect(element.yearToShow).toBe(2023);
    });

    it('should go to previous year', () => {
      element.yearToShow = 2024;
      
      element.previousYear();
      
      expect(element.yearToShow).toBe(2023);
    });

    it('should go to next year', () => {
      element.yearToShow = 2024;
      
      element.nextYear();
      
      expect(element.yearToShow).toBe(2025);
    });
  });

  describe('Event management', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      jest.advanceTimersByTime(10);
    });

    it('should add event', () => {
      const event = { day: 15, month: 0, year: 2024, text: 'Test Event', color: 'red' };
      
      element.addEvent(event);
      
      expect(element.events).toContainEqual(event);
    });

    it('should not add duplicate event', () => {
      const event = { day: 15, month: 0, year: 2024, text: 'Test Event', color: 'red' };
      
      element.addEvent(event);
      element.addEvent(event);
      
      expect(element.events).toHaveLength(1);
    });

    it('should remove event', () => {
      const event = { day: 15, month: 0, year: 2024, text: 'Test Event', color: 'red' };
      element.addEvent(event);
      
      element.removeEvent(event);
      
      expect(element.events).toHaveLength(0);
    });

    it('should change event', () => {
      const event = { day: 15, month: 0, year: 2024, text: 'Test Event', color: 'red' };
      element.addEvent(event);
      
      element.changeEvent({ day: 15, month: 0, year: 2024 }, 'Updated Event', 'blue');
      
      const updatedEvent = element.events[0];
      expect(updatedEvent.text).toBe('Updated Event');
      expect(updatedEvent.color).toBe('blue');
    });

    it('should get events by date', () => {
      const event1 = { day: 15, month: 0, year: 2024, text: 'Event 1', color: 'red' };
      const event2 = { day: 15, month: 0, year: 2024, text: 'Event 2', color: 'blue' };
      const event3 = { day: 16, month: 0, year: 2024, text: 'Event 3', color: 'green' };
      
      element.addEvent(event1);
      element.addEvent(event2);
      element.addEvent(event3);
      
      const events = element.getEventsByDate(15, 0, 2024);
      
      expect(events).toHaveLength(2);
    });

    it('should clear all data', () => {
      element.addEvent({ day: 15, month: 0, year: 2024, text: 'Event', color: 'red' });
      
      element.clearAllData();
      
      expect(element.events).toHaveLength(0);
    });
  });

  describe('Date selection', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      jest.advanceTimersByTime(10);
    });

    it('should select date', () => {
      const eventHandler = jest.fn();
      element.addEventListener('ars-calendar:daySelected', eventHandler);
      
      element.selectDate(15, 0, 2024);
      
      expect(element.selectedDay).toBe(15);
      expect(element.selectedMonth).toBe(0);
      expect(element.selectedYear).toBe(2024);
      expect(eventHandler).toHaveBeenCalled();
    });

    it('should set selected date to today', () => {
      element.setSelectedDateToToday();
      
      const today = new Date();
      expect(element.selectedDay).toBe(today.getDate());
      expect(element.selectedMonth).toBe(today.getMonth());
      expect(element.selectedYear).toBe(today.getFullYear());
    });

    it('should clear selected date', () => {
      element.selectDate(15, 0, 2024);
      
      element.clearSelectedDate();
      
      expect(element.selectedDay).toBeNull();
      expect(element.selectedMonth).toBeNull();
      expect(element.selectedYear).toBeNull();
    });
  });

  describe('Customization', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      jest.advanceTimersByTime(10);
    });

    it('should set custom template', () => {
      const templateFn = (cal) => '<div>Custom</div>';
      
      element.setCustomTemplate(templateFn);
      
      expect(element.customTemplate).toBe(templateFn);
    });

    it('should set CSS vars', () => {
      const cssVars = { 'ars-calendar-bg': '#ffffff' };
      
      element.setCSSVars(cssVars);
      
      expect(element.cssVars).toEqual(cssVars);
    });

    it('should get CSS vars', () => {
      element.cssVars = { 'ars-calendar-bg': '#ffffff' };
      
      const result = element.getCSSVars();
      
      expect(result).toEqual({ 'ars-calendar-bg': '#ffffff' });
    });

    it('should apply localized months from attribute', () => {
      const months = ['Enero', 'Febrero', 'Marzo'];
      element.setAttribute('localized_months', JSON.stringify(months));
      
      expect(element.months).toEqual(months);
    });

    it('should apply localized abbreviated days from attribute', () => {
      const days = ['Dom', 'Lun', 'Mar'];
      element.setAttribute('localized_abbreviated_days', JSON.stringify(days));
      
      expect(element.localizedAbbreviatedDays).toEqual(days);
    });

    it('should apply localized today from attribute', () => {
      element.setAttribute('localized_today', 'Hoy');
      
      expect(element.localizedToday).toBe('Hoy');
    });
  });

  describe('Helper methods', () => {
    it('should return month string', () => {
      const result = element.monthToShowString(0);
      
      expect(result).toBe('January');
    });

    it('should build day and class slots', () => {
      element.buildDayAndClassSlots();
      
      expect(element.daySlots).toBeDefined();
      expect(element.daySlotsColors).toBeDefined();
    });

    it('should get color canvas from date', () => {
      element.addEvent({ day: 15, month: 0, year: 2024, text: 'Event', color: 'red' });
      
      const canvas = element.getColorCanvasFromDate(15, 0, 2024);
      
      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    });
  });

  describe('Lifecycle', () => {
    it('should have connectedCallback', () => {
      expect(typeof element.connectedCallback).toBe('function');
    });

    it('should have attributeChangedCallback', () => {
      expect(typeof element.attributeChangedCallback).toBe('function');
    });

    it('should create shadow DOM on connect', () => {
      document.body.appendChild(element);
      expect(element.shadowRoot).toBeDefined();
    });
  });
});
/**
 * Tests for ArsPage
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest, vi, afterEach } from '@jest/globals';

// Import the module
import { ArsPage } from '../components/ars-page/ars-page.js';

describe('ArsPage', () => {
  let element;
  let page1;
  let page2;

  beforeEach(() => {
    document.body.innerHTML = '';
    
    element = document.createElement('ars-page');
    element.id = 'test-router';
    
    page1 = document.createElement('div');
    page1.id = 'page1';
    page1.textContent = 'Page 1';
    
    page2 = document.createElement('div');
    page2.id = 'page2';
    page2.textContent = 'Page 2';
    
    element.appendChild(page1);
    element.appendChild(page2);
  });

  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  describe('Static properties', () => {
    it('should have observedAttributes', () => {
      expect(ArsPage.observedAttributes).toContain('default-page');
      expect(ArsPage.observedAttributes).toContain('routes');
      expect(ArsPage.observedAttributes).toContain('base-path');
    });

    it('should have defaultAttributeValue', () => {
      expect(ArsPage.defaultAttributeValue('routes')).toBe('{}');
      expect(ArsPage.defaultAttributeValue('unknown')).toBeNull();
    });
  });

  describe('Initialization', () => {
    it('should initialize pages map', () => {
      document.body.appendChild(element);
      
      expect(element._pages.size).toBe(2);
    });

    it('should have null current page initially', () => {
      expect(element._currentPage).toBeNull();
    });
  });

  describe('Page visibility', () => {
    beforeEach(() => {
      document.body.appendChild(element);
    });

    it('should show a page', () => {
      element.showPage('page1');
      
      expect(element._currentPage).toBe('page1');
      expect(page1.style.display).toBe('block');
    });

    it('should hide previous page when showing new one', () => {
      element.showPage('page1');
      element.showPage('page2');
      
      expect(page1.style.display).toBe('none');
      expect(page2.style.display).toBe('block');
    });

    it('should hide a page', () => {
      element.showPage('page1');
      
      element.hidePage('page1');
      
      expect(element._currentPage).toBeNull();
      expect(page1.style.display).toBe('none');
    });

    it('should show all pages', () => {
      element.showAllPages();
      
      expect(page1.style.display).toBe('block');
      expect(page2.style.display).toBe('block');
    });

    it('should hide all pages', () => {
      element.showPage('page1');
      
      element.hideAllPages();
      
      expect(element._currentPage).toBeNull();
      expect(page1.style.display).toBe('none');
      expect(page2.style.display).toBe('none');
    });
  });

  describe('Page info', () => {
    beforeEach(() => {
      document.body.appendChild(element);
    });

    it('should get current page info', () => {
      element.showPage('page1');
      
      const info = element.getCurrentPage();
      
      expect(info.currentPage).toBe('page1');
      expect(info.availablePages).toContain('page1');
      expect(info.availablePages).toContain('page2');
    });

    it('should get page info', () => {
      element.setAttribute('default-page', 'page1');
      
      const info = element.getPageInfo();
      
      expect(info.totalPages).toBe(2);
      expect(info.defaultPage).toBe('page1');
      expect(info.availablePages).toContain('page1');
      expect(info.availablePages).toContain('page2');
    });
  });

  describe('Route handling', () => {
    beforeEach(() => {
      element.setAttribute('routes', JSON.stringify({
        'page1': '/page1',
        'page2': '/page2'
      }));
      document.body.appendChild(element);
    });

    it('should navigate to route', () => {
      const result = element.navigateToRoute('/page1');
      
      expect(result.success).toBe(true);
      expect(element._currentPage).toBe('page1');
    });

    it('should return current route info', () => {
      element.showPage('page1');
      
      const info = element.getCurrentRoute();
      
      expect(info.currentPage).toBe('page1');
      expect(info.availableRoutes).toContain('/page1');
    });

    it('should build route maps', () => {
      expect(element._routeToPageMap.size).toBeGreaterThan(0);
      expect(element._pageToRouteMap.size).toBeGreaterThan(0);
    });
  });

  describe('Default page', () => {
    it('should show default page on connect', () => {
      element.setAttribute('default-page', 'page2');
      document.body.appendChild(element);
      
      expect(element._currentPage).toBe('page2');
    });
  });

  describe('Events', () => {
    beforeEach(() => {
      document.body.appendChild(element);
    });

    it('should dispatch page-changed event', () => {
      const eventHandler = jest.fn();
      element.addEventListener('ars-page:page-changed', eventHandler);
      
      element.showPage('page1');
      
      expect(eventHandler).toHaveBeenCalled();
    });

    it('should include page info in event detail', () => {
      let eventDetail = null;
      element.addEventListener('ars-page:page-changed', (e) => {
        eventDetail = e.detail;
      });
      
      element.showPage('page1');
      
      expect(eventDetail.currentPage).toBe('page1');
    });
  });

  describe('Lifecycle', () => {
    it('should have connectedCallback', () => {
      expect(typeof element.connectedCallback).toBe('function');
    });

    it('should have disconnectedCallback', () => {
      expect(typeof element.disconnectedCallback).toBe('function');
    });

    it('should clear pages on disconnect', () => {
      document.body.appendChild(element);
      expect(element._pages.size).toBe(2);
      
      element.disconnectedCallback();
      
      expect(element._pages.size).toBe(0);
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      document.body.appendChild(element);
    });

    it('should handle invalid page id', () => {
      const result = element.showPage('nonexistent');
      
      expect(result.success).toBe(false);
    });

    it('should handle invalid route', () => {
      const result = element.navigateToRoute('/nonexistent');
      
      expect(result.success).toBe(false);
    });
  });
});
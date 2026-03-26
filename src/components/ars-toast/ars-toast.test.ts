/**
 * Tests for ArsToast
 * @vi-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ArsToast } from "./ars-toast.js";

describe("ArsToast", () => {
  let element: ArsToast;

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
    element = new ArsToast();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Registration ---

  it("registers the ars-toast custom element", () => {
    expect(customElements.get("ars-toast")).toBe(ArsToast);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  // --- Declarative rendering ---

  it("renders toast content when open attribute is set", () => {
    element.setAttribute("message", "Hello");
    element.setAttribute("open", "");
    document.body.appendChild(element);
    expect(element.shadowRoot!.querySelector(".toast")).toBeTruthy();
    expect(element.shadowRoot!.querySelector(".message")?.textContent).toContain("Hello");
  });

  it("does not render toast when open is not set", () => {
    element.setAttribute("message", "Hidden");
    document.body.appendChild(element);
    expect(element.shadowRoot!.querySelector(".toast")).toBeNull();
  });

  // --- Severity ---

  it("defaults severity to info", () => {
    expect(element.severity).toBe("info");
  });

  it("applies severity class to toast element", () => {
    element.setAttribute("severity", "error");
    element.setAttribute("open", "");
    document.body.appendChild(element);
    expect(element.shadowRoot!.querySelector(".toast--error")).toBeTruthy();
  });

  it("supports all four severity levels", () => {
    document.body.appendChild(element);
    element.setAttribute("open", "");
    for (const sev of ["info", "success", "warning", "error"] as const) {
      element.severity = sev;
      expect(element.shadowRoot!.querySelector(`.toast--${sev}`)).toBeTruthy();
    }
  });

  // --- Dismissible ---

  it("shows close button when dismissible", () => {
    element.setAttribute("dismissible", "");
    element.setAttribute("open", "");
    document.body.appendChild(element);
    expect(element.shadowRoot!.querySelector(".close-btn")).toBeTruthy();
  });

  it("hides close button when not dismissible", () => {
    element.setAttribute("open", "");
    document.body.appendChild(element);
    expect(element.shadowRoot!.querySelector(".close-btn")).toBeNull();
  });

  // --- Auto-dismiss ---

  it("auto-dismisses after duration", () => {
    element.setAttribute("open", "");
    element.setAttribute("duration", "3000");
    document.body.appendChild(element);

    const events: string[] = [];
    element.addEventListener("ars-toast:dismiss", (e) => {
      events.push((e as CustomEvent).detail.reason);
    });

    vi.advanceTimersByTime(3000);

    expect(events).toContain("timeout");
  });

  it("does not auto-dismiss when duration is 0", () => {
    element.setAttribute("open", "");
    element.setAttribute("duration", "0");
    document.body.appendChild(element);

    const events: any[] = [];
    element.addEventListener("ars-toast:dismiss", () => events.push(true));

    vi.advanceTimersByTime(10000);

    expect(events).toEqual([]);
  });

  it("defaults duration to 5000ms", () => {
    expect(element.duration).toBe(5000);
  });

  // --- dismiss() method ---

  it("dismiss() emits ars-toast:dismiss with reason", () => {
    element.setAttribute("open", "");
    document.body.appendChild(element);
    const events: string[] = [];
    element.addEventListener("ars-toast:dismiss", (e) => {
      events.push((e as CustomEvent).detail.reason);
    });

    element.dismiss("user");
    expect(events).toEqual(["user"]);
  });

  it("dismiss() defaults to programmatic reason", () => {
    element.setAttribute("open", "");
    document.body.appendChild(element);
    const events: string[] = [];
    element.addEventListener("ars-toast:dismiss", (e) => {
      events.push((e as CustomEvent).detail.reason);
    });

    element.dismiss();
    expect(events).toEqual(["programmatic"]);
  });

  // --- Close button click ---

  it("dismisses on close button click", () => {
    element.setAttribute("open", "");
    element.setAttribute("dismissible", "");
    document.body.appendChild(element);
    const events: string[] = [];
    element.addEventListener("ars-toast:dismiss", (e) => {
      events.push((e as CustomEvent).detail.reason);
    });

    element.shadowRoot!.querySelector(".close-btn")!.dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );

    expect(events).toEqual(["user"]);
  });

  // --- Static API ---

  it("ArsToast.show() creates and appends a toast to the body", () => {
    const toast = ArsToast.show("Test message");
    expect(toast).toBeInstanceOf(ArsToast);
    expect(toast.message).toBe("Test message");
    expect(toast.hasAttribute("open")).toBe(true);
  });

  it("ArsToast.show() applies severity option", () => {
    const toast = ArsToast.show("Error!", { severity: "error" });
    expect(toast.severity).toBe("error");
  });

  it("ArsToast.show() applies dismissible option", () => {
    const toast = ArsToast.show("Info", { dismissible: true });
    expect(toast.dismissible).toBe(true);
  });

  it("ArsToast.show() creates container with aria-live", () => {
    ArsToast.show("Test", { position: "bottom-left" });
    const container = document.querySelector(".ars-toast-container--bottom-left");
    expect(container).toBeTruthy();
    expect(container!.getAttribute("aria-live")).toBe("polite");
  });

  // --- Slots ---

  it("provides a default slot for custom content", () => {
    element.setAttribute("open", "");
    document.body.appendChild(element);
    expect(element.shadowRoot!.querySelector("slot:not([name])")).toBeTruthy();
  });

  it("provides an action slot", () => {
    element.setAttribute("open", "");
    document.body.appendChild(element);
    expect(element.shadowRoot!.querySelector('slot[name="action"]')).toBeTruthy();
  });

  // --- Observed attributes ---

  it("observes the expected attributes", () => {
    const attrs = ArsToast.observedAttributes;
    for (const attr of ["message", "severity", "duration", "dismissible", "open"]) {
      expect(attrs).toContain(attr);
    }
  });

  // --- Property setters ---

  it("reflects message via property", () => {
    element.message = "Hello";
    expect(element.getAttribute("message")).toBe("Hello");
  });

  it("reflects severity via property", () => {
    element.severity = "warning";
    expect(element.getAttribute("severity")).toBe("warning");
  });

  it("reflects duration via property", () => {
    element.duration = 8000;
    expect(element.getAttribute("duration")).toBe("8000");
  });

  // --- CSS tokens ---

  it("uses design token variables in styles", () => {
    element.setAttribute("open", "");
    document.body.appendChild(element);
    const styles = element.shadowRoot!.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-color-success");
    expect(styles).toContain("--arswc-color-warning");
    expect(styles).toContain("--arswc-color-danger");
    expect(styles).toContain("--arswc-color-accent");
  });

  // --- XSS ---

  it("escapes HTML in message", () => {
    element.setAttribute("message", "<script>alert(1)</script>");
    element.setAttribute("open", "");
    document.body.appendChild(element);
    const msg = element.shadowRoot!.querySelector(".message");
    expect(msg?.textContent).toContain("<script>alert(1)</script>");
    expect(msg?.querySelector("script")).toBeNull();
  });

  // --- Reduced motion ---

  it("includes prefers-reduced-motion media query", () => {
    element.setAttribute("open", "");
    document.body.appendChild(element);
    const styles = element.shadowRoot!.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("prefers-reduced-motion");
  });

  // --- ARIA ---

  it("has role=alert on the toast element", () => {
    element.setAttribute("open", "");
    document.body.appendChild(element);
    expect(element.shadowRoot!.querySelector('[role="alert"]')).toBeTruthy();
  });
});

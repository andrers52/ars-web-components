/**
 * Tests for ArsAvatar
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ArsAvatar } from "./ars-avatar.js";

describe("ArsAvatar", () => {
  let element: ArsAvatar;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsAvatar();
  });

  it("registers the ars-avatar custom element", () => {
    expect(customElements.get("ars-avatar")).toBe(ArsAvatar);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  it("defaults to md size and circle shape", () => {
    document.body.appendChild(element);
    const avatar = element.shadowRoot?.querySelector(".avatar");
    expect(avatar?.classList.contains("avatar--md")).toBe(true);
    expect(avatar?.classList.contains("avatar--circle")).toBe(true);
  });

  it("shows fallback text when no src is provided", () => {
    element.setAttribute("fallback", "JD");
    document.body.appendChild(element);
    const fallback = element.shadowRoot?.querySelector(".avatar__fallback");
    expect(fallback?.textContent?.trim()).toBe("JD");
  });

  it("renders an img when src is provided", () => {
    element.setAttribute("src", "https://example.com/photo.jpg");
    document.body.appendChild(element);
    const img = element.shadowRoot?.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("https://example.com/photo.jpg");
  });

  it("reflects size attribute", () => {
    element.setAttribute("size", "xl");
    document.body.appendChild(element);
    const avatar = element.shadowRoot?.querySelector(".avatar");
    expect(avatar?.classList.contains("avatar--xl")).toBe(true);
  });

  it("reflects shape attribute", () => {
    element.setAttribute("shape", "rounded");
    document.body.appendChild(element);
    const avatar = element.shadowRoot?.querySelector(".avatar");
    expect(avatar?.classList.contains("avatar--rounded")).toBe(true);
  });

  it("sets aria-label from alt attribute", () => {
    element.setAttribute("alt", "User profile");
    document.body.appendChild(element);
    const avatar = element.shadowRoot?.querySelector(".avatar");
    expect(avatar?.getAttribute("aria-label")).toBe("User profile");
  });

  it("updates src via property setter", () => {
    document.body.appendChild(element);
    element.src = "new-image.jpg";
    const img = element.shadowRoot?.querySelector("img");
    expect(img?.getAttribute("src")).toBe("new-image.jpg");
  });

  it("emits ars-avatar:error on image load failure", () => {
    element.setAttribute("src", "invalid.jpg");
    document.body.appendChild(element);

    const errors: any[] = [];
    element.addEventListener("ars-avatar:error", (e) => {
      errors.push((e as CustomEvent).detail);
    });

    const img = element.shadowRoot?.querySelector("img") as HTMLImageElement;
    img.dispatchEvent(new Event("error"));

    expect(errors.length).toBe(1);
    expect(errors[0].src).toBe("invalid.jpg");
  });

  it("uses design token variables in styles", () => {
    document.body.appendChild(element);
    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-color-surface");
    expect(styles).toContain("--arswc-color-border");
  });
});

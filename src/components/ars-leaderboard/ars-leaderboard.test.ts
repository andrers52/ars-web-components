/**
 * Tests for ArsLeaderboard
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ArsLeaderboard } from "./ars-leaderboard.js";

describe("ArsLeaderboard", () => {
  let element: ArsLeaderboard;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsLeaderboard();
  });

  it("registers the ars-leaderboard custom element", () => {
    expect(customElements.get("ars-leaderboard")).toBe(ArsLeaderboard);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  it("defaults max-entries to 10", () => {
    expect(element.maxEntries).toBe(10);
  });

  it("reflects max-entries attribute", () => {
    element.setAttribute("max-entries", "5");
    expect(element.maxEntries).toBe(5);
  });

  it("renders entries sorted by score descending", () => {
    document.body.appendChild(element);
    element.setEntries([
      { id: "a", name: "Alice", score: 100 },
      { id: "b", name: "Bob", score: 300 },
      { id: "c", name: "Carol", score: 200 },
    ]);

    const rows = element.shadowRoot?.querySelectorAll("tbody tr");
    expect(rows?.length).toBe(3);
    expect(rows?.[0].querySelector(".leaderboard__name")?.textContent).toBe("Bob");
    expect(rows?.[1].querySelector(".leaderboard__name")?.textContent).toBe("Carol");
    expect(rows?.[2].querySelector(".leaderboard__name")?.textContent).toBe("Alice");
  });

  it("limits entries to max-entries", () => {
    element.maxEntries = 2;
    document.body.appendChild(element);
    element.setEntries([
      { id: "a", name: "Alice", score: 100 },
      { id: "b", name: "Bob", score: 300 },
      { id: "c", name: "Carol", score: 200 },
    ]);

    const rows = element.shadowRoot?.querySelectorAll("tbody tr");
    expect(rows?.length).toBe(2);
  });

  it("highlights the row matching highlight-id", () => {
    document.body.appendChild(element);
    element.highlightId = "b";
    element.setEntries([
      { id: "a", name: "Alice", score: 100 },
      { id: "b", name: "Bob", score: 300 },
    ]);

    const rows = element.shadowRoot?.querySelectorAll("tbody tr");
    // Sorted by score descending: Bob (300) first, Alice (100) second.
    expect(rows?.[0].classList.contains("leaderboard__row--highlight")).toBe(true);
    expect(rows?.[1].classList.contains("leaderboard__row--highlight")).toBe(false);
  });

  it("escapes HTML in names", () => {
    document.body.appendChild(element);
    element.setEntries([
      { id: "x", name: "<script>alert(1)</script>", score: 0 },
    ]);

    const nameCell = element.shadowRoot?.querySelector(".leaderboard__name");
    expect(nameCell?.textContent).toBe("<script>alert(1)</script>");
    expect(nameCell?.innerHTML).not.toContain("<script>");
  });

  it("uses design token variables in styles", () => {
    document.body.appendChild(element);
    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-color-text");
    expect(styles).toContain("--arswc-color-border");
  });
});

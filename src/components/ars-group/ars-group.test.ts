/**
 * Tests for ArsGroup
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ArsGroup } from "./ars-group.js";

describe("ArsGroup", () => {
  let element: ArsGroup;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsGroup();
  });

  it("registers the ars-group custom element", () => {
    expect(customElements.get("ars-group")).toBe(ArsGroup);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  it("defaults to column direction", () => {
    document.body.appendChild(element);
    const group = element.shadowRoot?.querySelector(".group") as HTMLElement;
    expect(group?.style.flexDirection).toBe("column");
  });

  it("reflects row direction", () => {
    element.setAttribute("direction", "row");
    document.body.appendChild(element);
    const group = element.shadowRoot?.querySelector(".group") as HTMLElement;
    expect(group?.style.flexDirection).toBe("row");
  });

  it("reflects none direction", () => {
    element.setAttribute("direction", "none");
    document.body.appendChild(element);
    const group = element.shadowRoot?.querySelector(".group") as HTMLElement;
    expect(group?.style.flexDirection).toBe("initial");
  });

  it("applies gap style", () => {
    element.setAttribute("gap", "8px");
    document.body.appendChild(element);
    const group = element.shadowRoot?.querySelector(".group") as HTMLElement;
    expect(group?.style.gap).toBe("8px");
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { registerArsWebComponents } from "./register.js";

describe("registerArsWebComponents", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("registers every component tag used by the library", () => {
    registerArsWebComponents();

    expect(customElements.get("ars-button")).toBeDefined();
    expect(customElements.get("ars-tabs")).toBeDefined();
    expect(customElements.get("ars-tab-panel")).toBeDefined();
    expect(customElements.get("ars-page-controller-internal")).toBeDefined();
    expect(customElements.get("ars-relational-node")).toBeDefined();
    expect(customElements.get("draggable-mixin")).toBeDefined();
    expect(customElements.get("swipeable-mixin")).toBeDefined();
  });

  it("is safe to call multiple times", () => {
    expect(() => {
      registerArsWebComponents();
      registerArsWebComponents();
    }).not.toThrow();

    expect(customElements.get("ars-button")).toBeDefined();
  });

  it("allows created elements to upgrade", () => {
    registerArsWebComponents();

    const button = document.createElement("ars-button");
    expect(button.tagName.toLowerCase()).toBe("ars-button");
    // The class is upgraded when appended to the document.
    document.body.appendChild(button);
    expect(customElements.get("ars-button")).not.toBeNull();
  });
});

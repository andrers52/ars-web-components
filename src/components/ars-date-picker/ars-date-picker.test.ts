import { describe, expect, it, vi } from "vitest";

// Ensure the custom element is registered before tests run.
import "./ars-date-picker.js";

describe("ArsDatePicker", () => {
  it("renders hidden by default", () => {
    const picker = document.createElement("ars-date-picker");
    document.body.appendChild(picker);

    const el = picker.shadowRoot!.querySelector(".picker") as HTMLElement;
    expect(el.style.display).toBe("none");

    picker.remove();
  });

  it("renders visible when open attribute is set", () => {
    const picker = document.createElement("ars-date-picker");
    picker.setAttribute("open", "");
    document.body.appendChild(picker);

    const el = picker.shadowRoot!.querySelector(".picker") as HTMLElement;
    expect(el.style.display).toBe("block");

    picker.remove();
  });

  it("open() makes the picker visible", () => {
    const picker = document.createElement("ars-date-picker") as HTMLElement & { open(): void };
    document.body.appendChild(picker);

    picker.open();
    const el = picker.shadowRoot!.querySelector(".picker") as HTMLElement;
    expect(el.style.display).toBe("block");

    picker.remove();
  });

  it("close() hides the picker", () => {
    const picker = document.createElement("ars-date-picker") as HTMLElement & { open(): void; close(): void };
    picker.setAttribute("open", "");
    document.body.appendChild(picker);

    picker.close();
    const el = picker.shadowRoot!.querySelector(".picker") as HTMLElement;
    expect(el.style.display).toBe("none");

    picker.remove();
  });

  it("dispatches ars-date-picker:select with the current input value on OK click", () => {
    const picker = document.createElement("ars-date-picker") as HTMLElement & { open(): void };
    picker.setAttribute("value", "2026-05-21");
    document.body.appendChild(picker);
    picker.open();

    const handler = vi.fn();
    picker.addEventListener("ars-date-picker:select", handler);

    const okBtn = picker.shadowRoot!.querySelector(".btn--ok") as HTMLButtonElement;
    okBtn.click();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]![0]).toMatchObject({
      detail: { date: "2026-05-21" },
    });

    picker.remove();
  });

  it("dispatches ars-date-picker:cancel on Cancel click", () => {
    const picker = document.createElement("ars-date-picker") as HTMLElement & { open(): void };
    document.body.appendChild(picker);
    picker.open();

    const handler = vi.fn();
    picker.addEventListener("ars-date-picker:cancel", handler);

    const cancelBtn = picker.shadowRoot!.querySelector(".btn--cancel") as HTMLButtonElement;
    cancelBtn.click();

    expect(handler).toHaveBeenCalledTimes(1);

    picker.remove();
  });

  it("dispatches select on Enter key inside the shadow root", () => {
    const picker = document.createElement("ars-date-picker") as HTMLElement & { open(): void };
    picker.setAttribute("value", "2026-12-25");
    document.body.appendChild(picker);
    picker.open();

    const handler = vi.fn();
    picker.addEventListener("ars-date-picker:select", handler);

    const input = picker.shadowRoot!.querySelector("input[type=date]") as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]![0]).toMatchObject({
      detail: { date: "2026-12-25" },
    });

    picker.remove();
  });

  it("dispatches cancel on Escape key inside the shadow root", () => {
    const picker = document.createElement("ars-date-picker") as HTMLElement & { open(): void };
    document.body.appendChild(picker);
    picker.open();

    const handler = vi.fn();
    picker.addEventListener("ars-date-picker:cancel", handler);

    const input = picker.shadowRoot!.querySelector("input[type=date]") as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(handler).toHaveBeenCalledTimes(1);

    picker.remove();
  });

  it("defaults value to today when no attribute is provided", () => {
    const picker = document.createElement("ars-date-picker");
    document.body.appendChild(picker);

    const today = new Date().toISOString().split("T")[0];
    const input = picker.shadowRoot!.querySelector("input[type=date]") as HTMLInputElement;
    expect(input.value).toBe(today);

    picker.remove();
  });

  it("reflects the label attribute in the header", () => {
    const picker = document.createElement("ars-date-picker");
    picker.setAttribute("label", "Pick a birthday");
    document.body.appendChild(picker);

    const header = picker.shadowRoot!.querySelector(".header") as HTMLElement;
    expect(header.textContent).toBe("Pick a birthday");

    picker.remove();
  });
});

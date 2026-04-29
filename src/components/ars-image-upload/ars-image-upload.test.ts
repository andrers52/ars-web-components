/**
 * Tests for ArsImageUpload
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import { ArsImageUpload } from "./ars-image-upload.js";

// Helper to create a FileList that jsdom will accept for HTMLInputElement.files
function createFileList(files: File[]): FileList {
  const list = Object.create(FileList.prototype);
  files.forEach((f, i) => { list[i] = f; });
  Object.defineProperty(list, "length", { value: files.length });
  Object.defineProperty(list, "item", { value: (i: number) => list[i] });
  return list;
}

describe("ArsImageUpload", () => {
  let element: ArsImageUpload;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsImageUpload();
  });

  it("registers the ars-image-upload custom element", () => {
    expect(customElements.get("ars-image-upload")).toBe(ArsImageUpload);
  });

  it("creates a shadow root on construction", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  it("defaults to max-files=1 and max-size=5242880", () => {
    expect(element.maxFiles).toBe(1);
    expect(element.maxSize).toBe(5 * 1024 * 1024);
  });

  it("defaults accept to image/*", () => {
    expect(element.accept).toBe("image/*");
  });

  it("returns empty files by default", () => {
    expect(element.getFiles()).toEqual([]);
  });

  it("reflects multiple attribute", () => {
    element.setAttribute("multiple", "");
    expect(element.multiple).toBe(true);
    element.multiple = false;
    expect(element.hasAttribute("multiple")).toBe(false);
  });

  it("reflects max-files attribute", () => {
    element.setAttribute("max-files", "5");
    expect(element.maxFiles).toBe(5);
    element.maxFiles = 3;
    expect(element.getAttribute("max-files")).toBe("3");
  });

  it("clears all files and dispatches change event", () => {
    document.body.appendChild(element);
    const changes: any[] = [];
    element.addEventListener("ars-image-upload:change", (e) => {
      changes.push((e as CustomEvent).detail);
    });

    element.clear();
    expect(element.getFiles()).toEqual([]);
    expect(changes.length).toBe(1);
    expect(changes[0].files).toEqual([]);
  });

  it("renders a dropzone with file input", () => {
    document.body.appendChild(element);
    const dropzone = element.shadowRoot?.querySelector(".dropzone");
    const input = element.shadowRoot?.querySelector('input[type="file"]');
    expect(dropzone).toBeTruthy();
    expect(input).toBeTruthy();
    expect(input?.getAttribute("accept")).toBe("image/*");
    expect(input?.hasAttribute("multiple")).toBe(false);
  });

  it("emits ars-image-upload:error when max-files exceeded", () => {
    element.setAttribute("multiple", "");
    element.setAttribute("max-files", "0");
    document.body.appendChild(element);

    const errors: any[] = [];
    element.addEventListener("ars-image-upload:error", (e) => {
      errors.push((e as CustomEvent).detail);
    });

    const file = new File([""], "test.jpg", { type: "image/jpeg" });

    const input = element.shadowRoot?.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, "files", { value: createFileList([file]), writable: true, configurable: true });
    input.dispatchEvent(new Event("change"));

    expect(errors.length).toBe(1);
    expect(errors[0].reason).toBe("max-files");
  });

  it("emits ars-image-upload:error when max-size exceeded", () => {
    element.setAttribute("max-size", "10"); // 10 bytes
    document.body.appendChild(element);

    const errors: any[] = [];
    element.addEventListener("ars-image-upload:error", (e) => {
      errors.push((e as CustomEvent).detail);
    });

    const file = new File(["this is more than 10 bytes"], "big.jpg", { type: "image/jpeg" });

    const input = element.shadowRoot?.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, "files", { value: createFileList([file]), writable: true, configurable: true });
    input.dispatchEvent(new Event("change"));

    expect(errors.length).toBe(1);
    expect(errors[0].reason).toBe("max-size");
  });

  it("uses design token variables in styles", () => {
    document.body.appendChild(element);
    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-color-border");
    expect(styles).toContain("--arswc-color-accent");
    expect(styles).toContain("--arswc-focus-ring");
  });
});

/**
 * Tests for ArsTable
 * @vi-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";

import { ArsTable } from "./ars-table.js";

const SAMPLE_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "age", label: "Age", align: "end" as const },
  { key: "city", label: "City" },
];

const SAMPLE_DATA = [
  { name: "Alice", age: 30, city: "NYC" },
  { name: "Bob", age: 25, city: "LA" },
  { name: "Charlie", age: 35, city: "Chicago" },
];

describe("ArsTable", () => {
  let element: ArsTable;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = new ArsTable();
  });

  function mount(cols = SAMPLE_COLUMNS, data = SAMPLE_DATA) {
    element.columns = cols;
    element.data = data;
    document.body.appendChild(element);
    return element;
  }

  // --- Registration ---

  it("registers the ars-table custom element", () => {
    expect(customElements.get("ars-table")).toBe(ArsTable);
  });

  it("creates a shadow root", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  // --- Rendering ---

  it("renders a table with grid role", () => {
    mount();
    expect(element.shadowRoot!.querySelector('[role="grid"]')).toBeTruthy();
  });

  it("renders header cells for each column", () => {
    mount();
    const headers = element.shadowRoot!.querySelectorAll('[role="columnheader"]');
    expect(headers.length).toBe(3);
    expect(headers[0].textContent).toContain("Name");
    expect(headers[1].textContent).toContain("Age");
  });

  it("renders data rows", () => {
    mount();
    const rows = element.shadowRoot!.querySelectorAll("tbody tr");
    expect(rows.length).toBe(3);
  });

  it("renders cell data", () => {
    mount();
    const cells = element.shadowRoot!.querySelectorAll("tbody td.td");
    expect(cells[0].textContent).toContain("Alice");
    expect(cells[1].textContent).toContain("30");
  });

  // --- Empty state ---

  it("shows empty state when data is empty", () => {
    element.columns = SAMPLE_COLUMNS;
    element.data = [];
    document.body.appendChild(element);
    expect(element.shadowRoot!.querySelector(".empty")).toBeTruthy();
    expect(element.shadowRoot!.querySelector('[name="empty"]')).toBeTruthy();
  });

  // --- Sorting ---

  it("emits ars-table:sort on sortable column header click", () => {
    element.setAttribute("sortable", "");
    mount();
    const events: any[] = [];
    element.addEventListener("ars-table:sort", (e) => {
      events.push((e as CustomEvent).detail);
    });

    const th = element.shadowRoot!.querySelector('[data-col="name"]') as HTMLElement;
    th.click();

    expect(events.length).toBe(1);
    expect(events[0].column).toBe("name");
    expect(events[0].direction).toBe("asc");
  });

  it("toggles sort direction on repeated click", () => {
    element.setAttribute("sortable", "");
    mount();
    const events: any[] = [];
    element.addEventListener("ars-table:sort", (e) => {
      events.push((e as CustomEvent).detail);
    });

    const th = element.shadowRoot!.querySelector('[data-col="name"]') as HTMLElement;
    th.click();
    // Re-query after re-render
    element.shadowRoot!.querySelector<HTMLElement>('[data-col="name"]')!.click();

    expect(events[1].direction).toBe("desc");
  });

  it("sorts data in-component when auto-sort is enabled", () => {
    element.setAttribute("sortable", "");
    element.setAttribute("auto-sort", "");
    mount();

    element.shadowRoot!.querySelector<HTMLElement>('[data-col="name"]')!.click();

    const cells = element.shadowRoot!.querySelectorAll("tbody tr");
    const firstRow = cells[0].querySelectorAll("td");
    expect(firstRow[0].textContent).toContain("Alice");
  });

  it("sets aria-sort on sorted column", () => {
    element.setAttribute("sortable", "");
    mount();
    element.shadowRoot!.querySelector<HTMLElement>('[data-col="age"]')!.click();
    const th = element.shadowRoot!.querySelector('[data-col="age"]');
    expect(th!.getAttribute("aria-sort")).toBe("ascending");
  });

  // --- Row selection ---

  it("renders checkboxes when selectable=single", () => {
    element.setAttribute("selectable", "single");
    mount();
    const checkboxes = element.shadowRoot!.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(3);
  });

  it("selects a row on click in single mode", () => {
    element.setAttribute("selectable", "single");
    mount();
    const events: any[] = [];
    element.addEventListener("ars-table:select", (e) => {
      events.push((e as CustomEvent).detail);
    });

    const row = element.shadowRoot!.querySelector("[data-row-idx]") as HTMLElement;
    row.click();

    expect(events.length).toBe(1);
    expect(events[0].selectedRows).toEqual([0]);
    expect(events[0].action).toBe("select");
  });

  it("deselects in single mode when clicking selected row", () => {
    element.setAttribute("selectable", "single");
    mount();

    const row = element.shadowRoot!.querySelector("[data-row-idx]") as HTMLElement;
    row.click();
    // Re-query after re-render
    element.shadowRoot!.querySelector<HTMLElement>("[data-row-idx]")!.click();

    expect(element.selectedRows).toEqual([]);
  });

  it("allows multiple selections in multiple mode", () => {
    element.setAttribute("selectable", "multiple");
    mount();

    const rows = element.shadowRoot!.querySelectorAll("[data-row-idx]");
    (rows[0] as HTMLElement).click();
    element.shadowRoot!.querySelectorAll<HTMLElement>("[data-row-idx]")[1].click();

    expect(element.selectedRows.length).toBe(2);
  });

  // --- Row click event ---

  it("emits ars-table:row-click with row data", () => {
    mount();
    const events: any[] = [];
    element.addEventListener("ars-table:row-click", (e) => {
      events.push((e as CustomEvent).detail);
    });

    const row = element.shadowRoot!.querySelector("[data-row-idx]") as HTMLElement;
    // Click on a td, not the checkbox
    const td = row.querySelector(".td:not(.td--select)") as HTMLElement;
    td.click();

    expect(events.length).toBe(1);
    expect(events[0].row.name).toBe("Alice");
    expect(events[0].index).toBe(0);
  });

  // --- Striped ---

  it("adds striped class to alternate rows", () => {
    element.setAttribute("striped", "");
    mount();
    const stripedRows = element.shadowRoot!.querySelectorAll(".row--striped");
    expect(stripedRows.length).toBeGreaterThan(0);
  });

  // --- Compact ---

  it("uses compact styles when compact attribute is set", () => {
    element.setAttribute("compact", "");
    mount();
    const styles = element.shadowRoot!.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("4px 8px");
  });

  // --- Virtual scrolling ---

  it("shows virtual controls with large datasets", () => {
    element.setAttribute("virtual-scroll", "");
    const bigData = Array.from({ length: 200 }, (_, i) => ({
      name: `Person ${i}`,
      age: 20 + (i % 50),
      city: "City",
    }));
    element.columns = SAMPLE_COLUMNS;
    element.data = bigData;
    document.body.appendChild(element);

    expect(element.shadowRoot!.querySelector(".virtual-controls")).toBeTruthy();
    expect(element.shadowRoot!.querySelector(".virtual-info")).toBeTruthy();
  });

  it("renders only a window of rows in virtual mode", () => {
    element.setAttribute("virtual-scroll", "");
    const bigData = Array.from({ length: 200 }, (_, i) => ({
      name: `Person ${i}`,
      age: 20 + i,
      city: "City",
    }));
    element.columns = SAMPLE_COLUMNS;
    element.data = bigData;
    document.body.appendChild(element);

    const rows = element.shadowRoot!.querySelectorAll("tbody tr");
    expect(rows.length).toBeLessThan(200);
    expect(rows.length).toBe(50); // default visible count
  });

  // --- Custom render ---

  it("uses custom render function for column cells", () => {
    element.columns = [
      { key: "score", label: "Score", render: (v) => `<strong>${v}</strong>` },
    ];
    element.data = [{ score: 100 }];
    document.body.appendChild(element);

    const cell = element.shadowRoot!.querySelector("td.td strong");
    expect(cell?.textContent).toBe("100");
  });

  // --- Column width and align ---

  it("applies column width and alignment", () => {
    element.columns = [
      { key: "name", label: "Name", width: "200px", align: "center" },
    ];
    element.data = [{ name: "Test" }];
    document.body.appendChild(element);

    const th = element.shadowRoot!.querySelector("th");
    expect(th!.style.width).toBe("200px");
    expect(th!.style.textAlign).toBe("center");
  });

  // --- Observed attributes ---

  it("observes the expected attributes", () => {
    const attrs = ArsTable.observedAttributes;
    for (const attr of ["selectable", "sortable", "striped", "compact", "virtual-scroll", "auto-sort"]) {
      expect(attrs).toContain(attr);
    }
  });

  // --- CSS tokens ---

  it("uses design token variables in styles", () => {
    mount();
    const styles = element.shadowRoot!.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("--arswc-color-accent");
    expect(styles).toContain("--arswc-color-border");
    expect(styles).toContain("--arswc-color-muted");
    expect(styles).toContain("--arswc-font-size-sm");
  });

  // --- XSS ---

  it("escapes HTML in cell data", () => {
    element.columns = [{ key: "val", label: "Value" }];
    element.data = [{ val: "<script>alert(1)</script>" }];
    document.body.appendChild(element);

    const cell = element.shadowRoot!.querySelector("td.td");
    expect(cell?.textContent).toContain("<script>alert(1)</script>");
    expect(cell?.querySelector("script")).toBeNull();
  });

  // --- Data property ---

  it("clears selection when data changes", () => {
    element.setAttribute("selectable", "single");
    mount();

    const row = element.shadowRoot!.querySelector("[data-row-idx]") as HTMLElement;
    row.click();
    expect(element.selectedRows.length).toBe(1);

    element.data = [{ name: "New", age: 1, city: "X" }];
    expect(element.selectedRows.length).toBe(0);
  });
});

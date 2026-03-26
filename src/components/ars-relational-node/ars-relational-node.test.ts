/**
 * Tests for the deprecated ars-relational-node re-export.
 * Verifies that importing from the old path still works.
 * @vi-environment jsdom
 */

import { describe, expect, it } from "vitest";

import { ArsRelationalNode } from "./ars-relational-node.js";
import { ArsInfoTile } from "../ars-info-tile/ars-info-tile.js";

describe("ars-relational-node (deprecated re-export)", () => {
  it("ArsRelationalNode is the same class as ArsInfoTile", () => {
    expect(ArsRelationalNode).toBe(ArsInfoTile);
  });

  it("instances created via the re-export are functional", () => {
    const element = new ArsRelationalNode();
    element.data = { id: "test", title: "Test Tile" };
    document.body.appendChild(element);
    expect(element.shadowRoot?.querySelector(".title")?.textContent).toContain("Test Tile");
  });
});

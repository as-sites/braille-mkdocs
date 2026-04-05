import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  buildPath,
  getAncestorPaths,
  getDepth,
  getParentPath,
  getSlug,
  isChildOf,
  isDescendantOf,
} from "./path";

describe("path utilities", () => {
  test("getParentPath handles nested and root-like values", () => {
    assert.equal(getParentPath("nemeth/chapter-3/rule-7"), "nemeth/chapter-3");
    assert.equal(getParentPath("nemeth"), null);
    assert.equal(getParentPath(""), null);
    assert.equal(getParentPath("/"), null);
    assert.equal(getParentPath("/nemeth/chapter-3/"), "nemeth");
  });

  test("getDepth counts path segments", () => {
    assert.equal(getDepth("nemeth/chapter-3"), 2);
    assert.equal(getDepth(""), 0);
    assert.equal(getDepth("/"), 0);
    assert.equal(getDepth("///nemeth///chapter-3///rule-7///"), 3);
  });

  test("getSlug returns the final segment", () => {
    assert.equal(getSlug("nemeth/chapter-3"), "chapter-3");
    assert.equal(getSlug("nemeth"), "nemeth");
    assert.equal(getSlug(""), "");
    assert.equal(getSlug("///"), "");
  });

  test("getAncestorPaths returns all ancestors", () => {
    assert.deepEqual(getAncestorPaths("nemeth/chapter-3/rule-7"), [
      "nemeth",
      "nemeth/chapter-3",
    ]);
    assert.deepEqual(getAncestorPaths("nemeth"), []);
    assert.deepEqual(getAncestorPaths(""), []);
  });

  test("isChildOf checks direct parent only", () => {
    assert.equal(isChildOf("nemeth/chapter-3", "nemeth"), true);
    assert.equal(isChildOf("nemeth/chapter-3/rule-7", "nemeth"), false);
    assert.equal(isChildOf("nemeth", "nemeth"), false);
    assert.equal(isChildOf("nemeth/chapter-3", "other"), false);
  });

  test("isDescendantOf checks any depth", () => {
    assert.equal(isDescendantOf("nemeth/chapter-3", "nemeth"), true);
    assert.equal(isDescendantOf("nemeth/chapter-3/rule-7", "nemeth"), true);
    assert.equal(isDescendantOf("nemeth", "nemeth"), false);
    assert.equal(isDescendantOf("nemeth/chapter-3", ""), false);
    assert.equal(isDescendantOf("nemeth/chapter-3", "other"), false);
  });

  test("buildPath combines parent and slug safely", () => {
    assert.equal(buildPath("nemeth/chapter-3", "rule-7"), "nemeth/chapter-3/rule-7");
    assert.equal(buildPath(null, "nemeth"), "nemeth");
    assert.equal(buildPath("", "nemeth"), "nemeth");
    assert.equal(buildPath("nemeth", ""), "nemeth");
    assert.equal(buildPath("/nemeth/", "/chapter-3/"), "nemeth/chapter-3");
  });
});
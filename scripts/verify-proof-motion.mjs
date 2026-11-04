import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const stylesSource = readFileSync(
  new URL("../src/styles.css", import.meta.url),
  "utf8",
);

function assertIncludes(source, expected) {
  assert.ok(
    source.includes(expected),
    `Expected source to include ${JSON.stringify(expected)}`,
  );
}

test("proof package section uses scroll-staged pinned motion", () => {
  assertIncludes(appSource, "proof-packages__pin");
  assertIncludes(appSource, "proof-packages__ghost");
  assertIncludes(appSource, "ProofAnimatedRow");
  assertIncludes(appSource, "ProofAnimatedCell");
  assertIncludes(appSource, "useSpring");
});

test("proof package motion has visual depth and QR scan styling", () => {
  assert.match(stylesSource, /\.proof-packages__pin\s*\{/);
  assertIncludes(stylesSource, "position: sticky");
  assert.match(stylesSource, /\.proof-row__glow\s*\{/);
  assert.match(stylesSource, /\.proof-cell__scan\s*\{/);
});

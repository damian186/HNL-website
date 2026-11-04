import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const normalizedAppSource = appSource.replace(/\s+/g, " ");

test("route close uses check available routes CTA language", () => {
  assert.ok(appSource.includes('<a href="#reserve">Check available routes</a>'));
  assert.doesNotMatch(appSource, /Get Your Spot Now/);
});

test("masthead keeps the 3D stamp logo prominent", () => {
  assert.ok(appSource.includes('src="/hln-logo-3d-mark.png"'));
  assert.ok(styleSource.includes("width: 9rem;"));
  assert.ok(styleSource.includes("height: 4.1rem;"));
  assert.ok(styleSource.includes("width: 6.6rem;"));
  assert.ok(styleSource.includes("height: 3.05rem;"));
});

test("route close renders the dark Calendly inline widget", () => {
  assert.ok(
    appSource.includes(
      'const CALENDLY_EMBED_URL = "https://calendly.com/keith-smartcadence/30min?hide_event_type_details=1&hide_gdpr_banner=1&background_color=000000&text_color=fbebd0&primary_color=f7955c";',
    ),
  );
  assert.ok(appSource.includes("calendly-inline-widget"));
  assert.ok(appSource.includes("https://assets.calendly.com/assets/external/widget.js"));
  assert.ok(appSource.includes("data-url={CALENDLY_EMBED_URL}"));
  assert.ok(appSource.includes('className="section calendly-section"'));
  assert.doesNotMatch(appSource, /href=\{CALENDLY_URL\}/);
  assert.doesNotMatch(appSource, /className="lead-form"/);
  assert.doesNotMatch(appSource, /WEBHOOK_URL/);
});

test("calendly embed explicitly initializes and resizes the booking flow", () => {
  assert.ok(appSource.includes("widgetRef"));
  assert.ok(appSource.includes("window.Calendly?.initInlineWidget"));
  assert.ok(appSource.includes("parentElement: widget"));
  assert.ok(appSource.includes("resize: true"));
  assert.ok(appSource.includes('data-auto-load="false"'));
  assert.ok(appSource.includes('data-resize="true"'));
  assert.ok(appSource.includes('style={{ minWidth: "320px", minHeight: "700px" }}'));
  assert.doesNotMatch(styleSource, /\\.calendly-inline-widget\\s*\\{[^}]*overflow:\\s*hidden/s);
  assert.doesNotMatch(styleSource, /\\.calendly-inline-widget\\s*\\{[^}]*height:\\s*700px/s);
});

test("route close keeps the custom liquid CTA button", () => {
  assert.ok(appSource.includes("<LiquidLink"));
  assert.ok(appSource.includes('className="route-cta-copy"'));
  assert.ok(
    normalizedAppSource.includes(
      "Schedule a quick discovery call to discuss which plan fits your budget and which route fits your needs.",
    ),
  );
  assert.ok(appSource.includes('className="route-cta"'));
  assert.ok(appSource.includes('href="#reserve"'));
  assert.ok(appSource.includes("onClick={openCalendly}"));
  assert.ok(appSource.includes('aria-controls="calendly-booking"'));
  assert.ok(appSource.includes("aria-expanded={isCalendlyOpen}"));
  assert.ok(appSource.includes("Check available routes"));
  assert.doesNotMatch(appSource, /href=\{CALENDLY_EMBED_URL\}/);
  assert.doesNotMatch(appSource, /target="_blank"/);
  assert.ok(styleSource.includes(".route-cta-copy"));
  assert.ok(styleSource.includes(".route-cta"));
  assert.ok(styleSource.includes(".calendly-section__launch"));
  assert.ok(styleSource.includes(".calendly-badge-widget"));
});

test("calendly stays closed until the liquid CTA is clicked", () => {
  assert.ok(appSource.includes("isCalendlyOpen"));
  assert.ok(appSource.includes("setIsCalendlyOpen(true)"));
  assert.ok(appSource.includes("{isCalendlyOpen && ("));
  assert.ok(appSource.includes('id="calendly-booking"'));
  assert.ok(appSource.includes('className="calendly-section__booking"'));
  assert.doesNotMatch(appSource, /<CalendlyInlineWidget\s*\/>\s*<\/section>/);
  assert.ok(styleSource.includes(".calendly-section__booking"));
});

test("calendly section does not add copy outside the provided widget", () => {
  assert.doesNotMatch(appSource, /calendar-panel__rules/);
  assert.doesNotMatch(appSource, /Book a 15 minute discovery call/);
  assert.doesNotMatch(appSource, /See what card fits your budget/);
  assert.doesNotMatch(appSource, /30 minutes reserved/);
  assert.doesNotMatch(appSource, /form-intro/);
  assert.doesNotMatch(styleSource, /form-section/);
  assert.doesNotMatch(styleSource, /form-intro/);
  assert.doesNotMatch(styleSource, /calendar-panel/);
});

import assert from "node:assert/strict";
import test from "node:test";

const { PROOF_PACKAGES } = await import("../src/proofPackages.ts");

test("proof packages match the requested route rows", () => {
  assert.deepEqual(PROOF_PACKAGES, [
    {
      homes: "2,500",
      rate: "$0.10",
      spend: "$250",
      qr: "QR",
      qrLabel: "Tracking included",
      entrance: "left",
    },
    {
      homes: "5,000",
      rate: "$0.10",
      spend: "$500",
      qr: "QR",
      qrLabel: "included",
      entrance: "right",
    },
    {
      homes: "7,500",
      rate: "$0.10",
      spend: "$750",
      qr: "QR",
      qrLabel: "included",
      entrance: "left",
    },
    {
      homes: "10,000",
      rate: "$0.10",
      spend: "$1,000",
      qr: "QR",
      qrLabel: "included",
      entrance: "right",
    },
  ]);
});

test("every proof package keeps the shared mailbox price", () => {
  assert.equal(PROOF_PACKAGES.length, 4);
  assert.ok(PROOF_PACKAGES.every((packageRow) => packageRow.rate === "$0.10"));
});

export type ProofPackage = {
  homes: string;
  rate: "$0.10";
  spend: string;
  qr: "QR";
  qrLabel: "Tracking included" | "included";
  entrance: "left" | "right";
};

export const PROOF_PACKAGES: ProofPackage[] = [
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
];

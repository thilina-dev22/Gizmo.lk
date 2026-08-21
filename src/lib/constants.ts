export const SRI_LANKA_DISTRICTS = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Moneragala",
  "Ratnapura",
  "Kegalle",
] as const;

export type District = (typeof SRI_LANKA_DISTRICTS)[number];

export const CATEGORIES = [
  { id: "all", name: "All Products" },
  { id: "Smartphones", name: "Smartphones & Mobile" },
  { id: "Audio", name: "Audio & Wireless Earbuds" },
  { id: "Smartwatches", name: "Smartwatches & Bands" },
  { id: "Computer Accessories", name: "Computer & PC Gear" },
  { id: "Car Gadgets", name: "Car Gadgets & Mounts" },
] as const;

export const FLAT_DELIVERY_FEE_LKR = 450;
export const PAYMENT_GATEWAY_FEE_PERCENT = 0.04; // 4% Processing fee for card & online payment gateway
export const FREE_SHIPPING_THRESHOLD_LKR = 15000;

export const BANK_ACCOUNTS = [
  {
    bankName: "HNB Bank (Hatton National Bank)",
    accountName: "Thushara L G T",
    accountNumber: "082020343118",
    branch: "Kaduwela Branch",
    swiftCode: "HBLILKLX",
    logoColor: "bg-amber-500",
  },
];

export const TRUST_BADGES = [
  {
    title: "Islandwide Delivery",
    desc: "Delivered to your doorstep in 2-4 business days across Sri Lanka",
    icon: "Truck",
  },
  {
    title: "Cash on Delivery",
    desc: "Pay safely in cash when your order arrives",
    icon: "Banknote",
  },
  {
    title: "Direct Bank Deposit",
    desc: "Quick slip upload verification for bank transfers",
    icon: "Building2",
  },
  {
    title: "Quality Guarantee",
    desc: "100% genuine tech products with 7-day replacement support",
    icon: "ShieldCheck",
  },
];

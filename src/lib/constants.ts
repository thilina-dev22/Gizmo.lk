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

export const FREE_SHIPPING_THRESHOLD_LKR = 15000;

export const BANK_ACCOUNTS = [
  {
    bankName: "Commercial Bank of Ceylon",
    accountName: "GizmoTek LK (Pvt) Ltd",
    accountNumber: "8009-1234-5678",
    branch: "Kollupitiya Branch (005)",
    swiftCode: "CCEYLKX",
    logoColor: "bg-blue-600",
  },
  {
    bankName: "Sampath Bank",
    accountName: "GizmoTek LK (Pvt) Ltd",
    accountNumber: "1004-5566-7788",
    branch: "City Office Branch (001)",
    swiftCode: "SAMPLKX",
    logoColor: "bg-amber-600",
  },
  {
    bankName: "Bank of Ceylon (BOC)",
    accountName: "GizmoTek LK (Pvt) Ltd",
    accountNumber: "0007-7123-9840",
    branch: "Corporate Branch (002)",
    swiftCode: "BCEYLKX",
    logoColor: "bg-emerald-600",
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
    title: "1-Year Local Warranty",
    desc: "100% genuine tech products with warranty support",
    icon: "ShieldCheck",
  },
];

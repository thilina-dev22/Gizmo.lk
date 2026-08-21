export interface FAQItem {
  id: string;
  category: "Delivery & Tracking" | "Payments & Orders" | "Returns & Quality" | "Support & Contact";
  question: string;
  answer: string;
  badge?: string;
  highlight?: boolean;
}

export const FAQ_CATEGORIES = [
  "All Questions",
  "Delivery & Tracking",
  "Payments & Orders",
  "Returns & Quality",
  "Support & Contact",
] as const;

export const FAQ_DATA: FAQItem[] = [
  {
    id: "delivery-fee",
    category: "Delivery & Tracking",
    question: "What is the islandwide delivery fee?",
    answer: "Delivery to any city, town, or village across all 25 districts of Sri Lanka is a flat rate of Rs. 450. Cash on Delivery and Bank Deposit have 0% gateway fees. Online card payments via PayHere include a standard 4% payment gateway fee.",
    badge: "Rs. 450 Any City",
    highlight: true,
  },
  {
    id: "delivery-time",
    category: "Delivery & Tracking",
    question: "How many days does islandwide delivery take?",
    answer: "Delivery typically takes 2 to 3 business days across Sri Lanka. Depending on your specific location and distance from Colombo, delivery to outstation districts may take 3 to 4 business days.",
    badge: "2-3 Days Islandwide",
    highlight: true,
  },
  {
    id: "order-tracking",
    category: "Delivery & Tracking",
    question: "How do I track my order status?",
    answer: "Once your package is dispatched with our certified courier partners (Koombiyo, PromptX, Pronto), your tracking number is updated in our system. You can track your package online directly on the courier partner's portal or by messaging our delivery support team.",
    badge: "Live Tracking",
  },
  {
    id: "cash-on-delivery",
    category: "Payments & Orders",
    question: "Is Cash on Delivery (COD) available?",
    answer: "Yes! We support Cash on Delivery (COD) islandwide across all 25 districts in Sri Lanka. We also offer non-COD prepaid methods including online card payments (Visa/MasterCard via PayHere) and direct bank deposit.",
    badge: "COD & Prepaid",
    highlight: true,
  },
  {
    id: "order-cancellation",
    category: "Payments & Orders",
    question: "Can I cancel my order after placing it?",
    answer: "You can cancel your order after placing it as long as the item has not been dispatched with the courier yet. Once the package has been handed over for delivery, orders cannot be cancelled.",
    badge: "Pre-Dispatch Cancellation",
  },
  {
    id: "bank-details",
    category: "Payments & Orders",
    question: "What are GizmoTek's official bank account details for direct transfer?",
    answer: "Our official bank transfer details:\n• Bank Name: HNB Bank (Hatton National Bank)\n• Branch: Kaduwela Branch\n• Account Name: Thushara L G T\n• Account Number: 082020343118\n\nAfter making your bank transfer or cash deposit, simply attach your deposit slip or transaction screenshot at checkout for fast 1-2 hour verification.",
    badge: "HNB Bank Transfer",
    highlight: true,
  },
  {
    id: "damaged-wrong-product",
    category: "Returns & Quality",
    question: "What should I do if I receive a damaged or wrong product?",
    answer: "If you receive a damaged or incorrect product, please notify our support team within 24 hours of package delivery. A continuous unboxing video is required as verification, and we will provide an immediate brand-new replacement.",
    badge: "24h Replacement",
    highlight: true,
  },
  {
    id: "returns-policy",
    category: "Returns & Quality",
    question: "What is your return & replacement policy?",
    answer: "We accept returns and replacements exclusively under these valid conditions:\n• Damaged items in transit\n• Wrong or mismatched product delivered\n• Out-of-the-box manufacturing defects\n\nPlease note: Returns are not accepted for change of mind or personal preference.",
    badge: "Replacement Policy",
  },
  {
    id: "product-originality",
    category: "Returns & Quality",
    question: "Are your products original and quality guaranteed?",
    answer: "Yes! We supply top-tier, high-quality imported gadgets and tech accessories. Every single unit undergoes a strict quality and functionality check before being packaged and shipped to your doorstep.",
    badge: "100% Quality Checked",
  },
  {
    id: "contact-support",
    category: "Support & Contact",
    question: "How can I contact customer support?",
    answer: "You can easily reach our customer support desk through:\n• Direct Call / WhatsApp: +94 72 141 0369\n• Email: orders@gizmotek.lk | support@gizmotek.lk\n• Interactive Contact Us Form on our website\n\nSending a message via WhatsApp is the fastest way to receive quick support!",
    badge: "WhatsApp: +94 72 141 0369",
    highlight: true,
  },
];

/**
 * This module contains the small, relevant slices of the BookLeaf policy used
 * for ticket triage and response drafting. Keeping it structured lets a real
 * LLM receive only the category it needs instead of the full handbook.
 */
export const policies = {
  "Royalty & Payments":
    "Royalties use an 80/20 split of net profit. They are calculated quarterly and paid within 45 days of quarter end. Amounts under Rs. 1,000 roll over. Payouts use the bank account linked in the dashboard.",
  "ISBN & Metadata Issues":
    "Every BookLeaf book gets a unique ISBN under the BookLeaf imprint. A duplicate, wrong, or mismatched ISBN is high priority and must be escalated to Production with a 48-hour update.",
  "Printing & Quality":
    "After verification of misprints, binding defects, or colour issues, BookLeaf arranges a free reprint. Ask for photos of the defective copy. Standard print turnaround is 5-7 business days.",
  "Distribution & Availability":
    "New listings normally go live 7-10 business days after publication. An unavailable listing is usually a stock-sync issue; the team can trigger a re-sync in 24-48 hours.",
  "Book Status & Production Updates":
    "Production progresses from manuscript through editing, cover design, typesetting, proofreading, ISBN assignment, printing, distribution setup, then Published & Live. Delays often relate to cover approval or proofreading revisions.",
  "General Inquiry":
    "Metadata updates can be submitted through the dashboard or support. Platform changes typically appear in 3-5 business days.",
};

/** Returns a compact, category-specific policy excerpt for the AI prompt. */
export function policyFor(category) {
  return policies[category] ?? policies["General Inquiry"];
}

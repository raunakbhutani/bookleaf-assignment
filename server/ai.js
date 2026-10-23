import { policyFor } from "./knowledge.js";

/**
 * This module is the only place that knows about AI providers. It defaults to
 * a deterministic local fallback so tickets remain usable with no API key.
 * Set GEMINI_API_KEY and AI_MODE=gemini to use the server-side Gemini API.
 */
const categoryRules = [
  ["Royalty & Payments", /royalt|payout|payment|bank|earnings|sold|sale/i],
  [
    "ISBN & Metadata Issues",
    /isbn|metadata|author bio|description|wrong book/i,
  ],
  [
    "Printing & Quality",
    /print|quality|misprint|binding|blurry|colour|color|page/i,
  ],
  [
    "Distribution & Availability",
    /amazon|flipkart|unavailable|listing|stock|distribution/i,
  ],
  [
    "Book Status & Production Updates",
    /production|typesett|cover|proof|status|publish/i,
  ],
];

/** Classifies a ticket locally when a provider is unavailable or not configured. */
export function classifyLocally(subject, description) {
  const text = `${subject} ${description}`;
  const category =
    categoryRules.find(([, rule]) => rule.test(text))?.[0] ?? "General Inquiry";
  const priority =
    /urgent|six months|6 months|never received|duplicate|wrong isbn|legal/i.test(
      text,
    )
      ? "Critical"
      : /overdue|error|issue|unavailable|defect|damaged/i.test(text)
        ? "High"
        : category === "General Inquiry"
          ? "Low"
          : "Medium";
  return { category, priority, source: "rules" };
}

/** Creates an empathetic, policy-informed response even when no LLM is reachable. */
export function draftLocally(ticket, author, book) {
  const name = author.name.split(" ")[0];
  const details = book
    ? `For ${book.title}, the current status is ${book.status}${book.royalty_pending ? ` and the dashboard shows Rs. ${book.royalty_pending.toLocaleString("en-IN")} pending royalty` : ""}.`
    : "We have opened this as an account-level request.";
  const nextStep =
    ticket.category === "Printing & Quality"
      ? "Please reply with clear photos of the affected pages and cover; once verified, we will arrange a complimentary reprint within 5-7 business days."
      : ticket.category === "ISBN & Metadata Issues"
        ? "We have escalated this to our Production team and will update you within 48 hours."
        : ticket.category === "Distribution & Availability"
          ? "We will trigger a platform re-sync and share an update within 24-48 hours."
          : ticket.category === "Royalty & Payments"
            ? "We will verify the quarterly calculation and linked bank details, then share a clear update within 48 hours."
            : "Our team will review the request and send you a specific next update within 48 hours.";
  return `Hi ${name},\n\nThank you for writing to us. I understand why this needs clarity. ${details}\n\n${policyFor(ticket.category)}\n\n${nextStep}\n\nWarm regards,\nBookLeaf Author Support`;
}

/**
 * Requests a concise Gemini response, falling back safely if the call fails.
 * The prompt includes only the current ticket, relevant book data, and one
 * policy excerpt to minimise token use and avoid sending ticket history.
 */
export async function generateDraft(ticket, author, book) {
  if (process.env.AI_MODE !== "gemini" || !process.env.GEMINI_API_KEY)
    return {
      text: draftLocally(ticket, author, book),
      source: "local fallback",
    };
  try {
    const prompt = `You are an empathetic BookLeaf support representative. Draft a concise reply. Acknowledge the concern, use concrete data if supplied, own BookLeaf errors, provide a timeline, and end with a next step. Do not invent facts.\n\nTicket: ${ticket.subject}\n${ticket.description}\nCategory: ${ticket.category}\nAuthor: ${author.name}\nBook: ${book ? `${book.title}; status ${book.status}; pending royalty ${book.royalty_pending ?? 0}` : "Account-level"}\nPolicy: ${policyFor(ticket.category)}`;
    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 350,
        },
      }),
    });
    if (!response.ok) throw new Error(`provider returned ${response.status}`);
    const body = await response.json();
    const text = body.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();
    if (!text) throw new Error("provider returned no text");
    return { text, source: `Gemini (${model})` };
  } catch (error) {
    console.warn("AI drafting failed; using fallback:", error.message);
    return {
      text: draftLocally(ticket, author, book),
      source: "local fallback",
    };
  }
}

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(
  fs.readFileSync(
    path.join(dirname, "../data/bookleaf-sample-data.json"),
    "utf8",
  ),
);

/** Flattens book ownership once, making secure lookups inexpensive for the API. */
export const authors = source.authors;
export const books = authors.flatMap((author) =>
  author.books.map((book) => ({ ...book, author_id: author.author_id })),
);

/** Demo records make both portals meaningful on their first visit. */
export const tickets = [
  {
    id: "TKT-1001",
    authorId: "AUTH002",
    bookId: "BK004",
    subject: "Amazon listing is unavailable",
    description:
      "Startup Sutra is live but Amazon shows it as currently unavailable.",
    category: "Distribution & Availability",
    priority: "High",
    status: "In Progress",
    assignedTo: "Aisha (Ops)",
    notes: "Distribution re-sync requested.",
    createdAt: "2026-10-18T08:45:00.000Z",
    response:
      "Hi Rohit, thanks for flagging this. We have triggered a stock re-sync for Startup Sutra. This is normally resolved within 24-48 hours, and we will update you once the listing is active again.",
    respondedAt: "2026-10-18T12:15:00.000Z",
  },
  {
    id: "TKT-1002",
    authorId: "AUTH003",
    bookId: "BK005",
    subject: "Royalty payout clarification",
    description:
      "I would like to understand when my first royalty payout will be processed.",
    category: "Royalty & Payments",
    priority: "Medium",
    status: "Open",
    assignedTo: null,
    notes: "",
    createdAt: "2026-10-19T05:30:00.000Z",
    response: null,
    respondedAt: null,
  },
];

/** Finds an author by their seeded identity; passwords are demo-only at login. */
export function findAuthor(id) {
  return authors.find((author) => author.author_id === id);
}
/** Finds a book, including its owner ID, for author access checks. */
export function findBook(id) {
  return books.find((book) => book.book_id === id);
}
/** Generates stable, human-readable ticket IDs for the in-memory demo store. */
export function nextTicketId() {
  return `TKT-${1000 + tickets.length + 1}`;
}

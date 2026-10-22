/**
 * Express REST API for the BookLeaf portal. Authentication is deliberately
 * simple for the assignment demo; production should replace in-memory tokens
 * with hashed passwords, a database, expiry, and signed HTTP-only cookies.
 */
import "dotenv/config";
import cors from "cors";
import express from "express";
import crypto from "node:crypto";
import {
  authors,
  books,
  tickets,
  findAuthor,
  findBook,
  nextTicketId,
} from "./store.js";
import { classifyLocally, generateDraft } from "./ai.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const sessions = new Map();
const streams = new Set();
const categories = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];
const priorities = ["Critical", "High", "Medium", "Low"];
const statuses = ["Open", "In Progress", "Resolved", "Closed"];

app.use(cors());
app.use(express.json({ limit: "100kb" }));

/** Publishes a lightweight SSE event so connected dashboards refresh instantly. */
function notify(event, data) {
  for (const stream of streams)
    stream.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
/** Returns a standard machine-readable error body instead of unhelpful 500s. */
function fail(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}
/** Resolves the bearer token and attaches the current role to the request. */
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const session = sessions.get(token);
  if (!session)
    return fail(res, 401, "UNAUTHENTICATED", "Please sign in to continue.");
  req.user = session;
  next();
}
/** Rejects authors before an admin-only route can access cross-author data. */
function requireAdmin(req, res, next) {
  return req.user.role === "admin"
    ? next()
    : fail(res, 403, "FORBIDDEN", "Admin access is required.");
}
/** Validates the selected book belongs to the authenticated author. */
function allowedBook(authorId, bookId) {
  return !bookId || findBook(bookId)?.author_id === authorId;
}

/** Issues an in-memory role token for documented demo credentials. */
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password)
    return fail(
      res,
      400,
      "VALIDATION_ERROR",
      "Email and password are required.",
    );
  const normalized = String(email).trim().toLowerCase();
  const isAdmin =
    normalized === "ops@bookleaf.test" && password === "Bookleaf123!";
  const author = authors.find(
    (item) => item.email.toLowerCase() === normalized,
  );
  if (!isAdmin && (!author || password !== "Bookleaf123!"))
    return fail(
      res,
      401,
      "INVALID_CREDENTIALS",
      "Use a seeded email and the demo password.",
    );
  const token = crypto.randomUUID();
  const user = isAdmin
    ? { role: "admin", name: "Aisha, Operations" }
    : { role: "author", authorId: author.author_id, name: author.name };
  sessions.set(token, user);
  res.json({ token, user });
});

/** Provides responsive cross-tab updates without requiring a WebSocket package. */
app.get("/api/events", requireAuth, (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("event: ready\ndata: {}\n\n");
  streams.add(res);
  req.on("close", () => streams.delete(res));
});

/** Returns only the signed-in author's profile. */
app.get("/api/author/me", requireAuth, (req, res) => {
  if (req.user.role !== "author")
    return fail(res, 403, "FORBIDDEN", "Author access is required.");
  const author = findAuthor(req.user.authorId);
  res.json({ ...author, books: undefined });
});
/** Returns only books owned by the signed-in author. */
app.get("/api/author/books", requireAuth, (req, res) => {
  if (req.user.role !== "author")
    return fail(res, 403, "FORBIDDEN", "Author access is required.");
  res.json(books.filter((book) => book.author_id === req.user.authorId));
});
/** Returns only tickets belonging to the signed-in author. */
app.get("/api/author/tickets", requireAuth, (req, res) => {
  if (req.user.role !== "author")
    return fail(res, 403, "FORBIDDEN", "Author access is required.");
  res.json(tickets.filter((ticket) => ticket.authorId === req.user.authorId));
});
/** Validates, classifies, and stores a new author ticket before notifying dashboards. */
app.post("/api/author/tickets", requireAuth, (req, res) => {
  if (req.user.role !== "author")
    return fail(res, 403, "FORBIDDEN", "Author access is required.");
  const {
    bookId = null,
    subject,
    description,
    attachmentName = null,
  } = req.body ?? {};
  if (!subject?.trim() || !description?.trim())
    return fail(
      res,
      400,
      "VALIDATION_ERROR",
      "A subject and detailed description are required.",
    );
  if (subject.length > 140 || description.length > 4000)
    return fail(
      res,
      400,
      "VALIDATION_ERROR",
      "Please keep the subject under 140 characters and description under 4,000.",
    );
  if (!allowedBook(req.user.authorId, bookId))
    return fail(
      res,
      403,
      "FORBIDDEN",
      "You can only open tickets for your own books.",
    );
  const triage = classifyLocally(subject, description);
  const ticket = {
    id: nextTicketId(),
    authorId: req.user.authorId,
    bookId,
    subject: subject.trim(),
    description: description.trim(),
    attachmentName,
    ...triage,
    status: "Open",
    assignedTo: null,
    notes: "",
    createdAt: new Date().toISOString(),
    response: null,
    respondedAt: null,
  };
  tickets.unshift(ticket);
  notify("ticketChanged", { ticketId: ticket.id });
  res.status(201).json(ticket);
});

/** Lists the ops queue with explicit server-side filters for triage workflows. */
app.get("/api/admin/tickets", requireAuth, requireAdmin, (req, res) => {
  const filtered = tickets
    .filter((ticket) =>
      ["status", "category", "priority"].every(
        (field) => !req.query[field] || ticket[field] === req.query[field],
      ),
    )
    .filter((ticket) => !req.query.from || ticket.createdAt >= req.query.from)
    .sort(
      (a, b) =>
        priorities.indexOf(a.priority) - priorities.indexOf(b.priority) ||
        new Date(a.createdAt) - new Date(b.createdAt),
    );
  res.json(
    filtered.map((ticket) => ({
      ...ticket,
      author: findAuthor(ticket.authorId),
      book: ticket.bookId ? findBook(ticket.bookId) : null,
    })),
  );
});
/** Produces a policy-aware draft on demand; it never blocks ticket creation. */
app.post(
  "/api/admin/tickets/:id/draft",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const ticket = tickets.find((item) => item.id === req.params.id);
    if (!ticket) return fail(res, 404, "NOT_FOUND", "Ticket not found.");
    res.json(
      await generateDraft(
        ticket,
        findAuthor(ticket.authorId),
        ticket.bookId ? findBook(ticket.bookId) : null,
      ),
    );
  },
);
/** Lets an admin override AI fields, add private notes, and send a visible reply. */
app.patch("/api/admin/tickets/:id", requireAuth, requireAdmin, (req, res) => {
  const ticket = tickets.find((item) => item.id === req.params.id);
  if (!ticket) return fail(res, 404, "NOT_FOUND", "Ticket not found.");
  const { category, priority, status, assignedTo, notes, response } =
    req.body ?? {};
  if (category && !categories.includes(category))
    return fail(res, 400, "VALIDATION_ERROR", "Unknown category.");
  if (priority && !priorities.includes(priority))
    return fail(res, 400, "VALIDATION_ERROR", "Unknown priority.");
  if (status && !statuses.includes(status))
    return fail(res, 400, "VALIDATION_ERROR", "Unknown status.");
  Object.assign(ticket, {
    ...(category && { category }),
    ...(priority && { priority }),
    ...(status && { status }),
    ...(assignedTo !== undefined && { assignedTo }),
    ...(notes !== undefined && { notes }),
  });
  if (response?.trim()) {
    ticket.response = response.trim();
    ticket.respondedAt = new Date().toISOString();
    if (ticket.status === "Open") ticket.status = "In Progress";
  }
  notify("ticketChanged", { ticketId: ticket.id });
  res.json(ticket);
});

/** Health endpoint supports local checks and future deployment monitoring. */
app.get("/api/health", (req, res) =>
  res.json({ ok: true, aiMode: process.env.AI_MODE || "local" }),
);
app.use((err, req, res, next) => {
  console.error(err);
  fail(res, 500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
});
app.listen(port, () =>
  console.log(`BookLeaf API listening on http://localhost:${port}`),
);

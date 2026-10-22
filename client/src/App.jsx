/**
 * The portal UI deliberately keeps author and operations work in one concise
 * component for an assignment-sized build. Each mode still talks only to its
 * role-protected REST endpoints; no sensitive records are filtered in client.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const date = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "-";
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

/** Renders the demo sign-in screen and returns the selected API identity. */
function Login({ onLogin }) {
  const [email, setEmail] = useState("priya.sharma@email.com");
  const [password, setPassword] = useState("Bookleaf123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      onLogin(
        await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand">
          book<span>leaf</span>
          <small>AUTHOR PARTNER PORTAL</small>
        </div>
        <h1>Support that keeps your story moving.</h1>
        <p>
          Sign in to your author dashboard or the BookLeaf operations workspace.
        </p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="credentials">
          <strong>Demo credentials</strong>
          <br />
          Any seeded author email / <code>Bookleaf123!</code>
          <br />
          Ops: <code>ops@bookleaf.test</code> / <code>Bookleaf123!</code>
        </div>
      </section>
    </main>
  );
}

/** Gives every ticket a consistent status, priority, or category visual label. */
function Badge({ value }) {
  return (
    <span
      className={`badge ${String(value).toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}`}
    >
      {value}
    </span>
  );
}

/** Shows the author overview along with compact totals calculated from their books. */
function AuthorOverview({ author, books, onNewTicket }) {
  const totals = useMemo(
    () =>
      books.reduce(
        (sum, book) => ({
          sold: sum.sold + book.total_copies_sold,
          pending: sum.pending + book.royalty_pending,
          earned: sum.earned + book.total_royalty_earned,
        }),
        { sold: 0, pending: 0, earned: 0 },
      ),
    [books],
  );
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">AUTHOR DASHBOARD</p>
          <h2>Hello, {author.name.split(" ")[0]}</h2>
          <p>Here is the latest view of your BookLeaf account.</p>
        </div>
        <button onClick={onNewTicket}>+ Raise a support ticket</button>
      </div>
      <section className="metrics">
        <Metric label="Books" value={books.length} note="Across your account" />
        <Metric
          label="Copies sold"
          value={totals.sold.toLocaleString("en-IN")}
          note="Published titles"
        />
        <Metric
          label="Royalty earned"
          value={currency.format(totals.earned)}
          note="Lifetime earnings"
        />
        <Metric
          label="Pending royalty"
          value={currency.format(totals.pending)}
          note="Next eligible payout"
        />
      </section>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h3>Your books</h3>
            <p>
              Publishing and royalty information from your BookLeaf account.
            </p>
          </div>
        </div>
        <BookTable books={books} />
      </section>
    </>
  );
}

/** Displays a title's operational data without hiding zero or in-production states. */
function BookTable({ books }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Book</th>
            <th>Status</th>
            <th>Published</th>
            <th>Sales</th>
            <th>Royalty earned</th>
            <th>Pending</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.book_id}>
              <td>
                <strong>{book.title}</strong>
                <small>
                  {book.genre} · {book.isbn}
                </small>
              </td>
              <td>
                <Badge value={book.status} />
              </td>
              <td>{date(book.publication_date)}</td>
              <td>{book.total_copies_sold.toLocaleString("en-IN")}</td>
              <td>{currency.format(book.total_royalty_earned)}</td>
              <td>
                <strong>{currency.format(book.royalty_pending)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Displays one immutable metric tile. */
function Metric({ label, value, note }) {
  return (
    <article className="metric">
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

/** Collects a ticket with author-owned book selection and UI-only attachment name. */
function TicketForm({ books, onCreated, onCancel }) {
  const [bookId, setBookId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/author/tickets", {
        method: "POST",
        body: JSON.stringify({
          bookId: bookId || null,
          subject,
          description,
          attachmentName,
        }),
      });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h3>Raise a support ticket</h3>
          <p>
            Our team receives your request immediately. Attachment selection is
            included for the assignment demo.
          </p>
        </div>
        <button className="quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <form className="ticket-form" onSubmit={submit}>
        <label>
          Related book
          <select value={bookId} onChange={(e) => setBookId(e.target.value)}>
            <option value="">General / Account level</option>
            {books.map((book) => (
              <option key={book.book_id} value={book.book_id}>
                {book.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Subject
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength="140"
            required
            placeholder="A concise summary of your concern"
          />
        </label>
        <label className="full">
          Tell us what happened
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength="4000"
            required
            placeholder="Include relevant order, platform, or payout details..."
          />
        </label>
        <label className="full attachment">
          Attachment (optional, UI only)
          <input
            type="file"
            onChange={(e) => setAttachmentName(e.target.files?.[0]?.name || "")}
          />
          {attachmentName && <small>Selected: {attachmentName}</small>}
        </label>
        {error && <p className="error full">{error}</p>}
        <div className="full form-actions">
          <button type="submit" disabled={saving}>
            {saving ? "Submitting..." : "Submit ticket"}
          </button>
        </div>
      </form>
    </section>
  );
}

/** Shows author-visible queries and only the response that ops actually sent. */
function AuthorTickets({ tickets }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h3>My tickets</h3>
          <p>Updates appear automatically when the support team responds.</p>
        </div>
      </div>
      {tickets.length ? (
        <div className="ticket-list">
          {tickets.map((ticket) => (
            <article className="ticket" key={ticket.id}>
              <div className="ticket-top">
                <div>
                  <small>
                    {ticket.id} · {date(ticket.createdAt)}
                  </small>
                  <h4>{ticket.subject}</h4>
                </div>
                <div>
                  <Badge value={ticket.priority} />{" "}
                  <Badge value={ticket.status} />
                </div>
              </div>
              <p>{ticket.description}</p>
              {ticket.attachmentName && (
                <small>Attachment: {ticket.attachmentName}</small>
              )}
              {ticket.response && (
                <div className="response">
                  <strong>BookLeaf support</strong>
                  <p>{ticket.response}</p>
                  <small>Sent {date(ticket.respondedAt)}</small>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">You have not raised a ticket yet.</div>
      )}
    </section>
  );
}

/** Presents the queue controls and opens a selected ticket in the admin workbench. */
function AdminQueue({ tickets, onSelect }) {
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
  });
  const shown = tickets.filter((ticket) =>
    Object.entries(filters).every(
      ([key, value]) => !value || ticket[key] === value,
    ),
  );
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">OPERATIONS WORKSPACE</p>
          <h2>Ticket queue</h2>
          <p>Prioritised by urgency, then oldest unresolved request.</p>
        </div>
        <div className="queue-count">{shown.length} visible</div>
      </div>
      <section className="panel">
        <div className="filters">
          <Filter
            label="Status"
            values={statuses}
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
          />
          <Filter
            label="Category"
            values={categories}
            value={filters.category}
            onChange={(value) => setFilters({ ...filters, category: value })}
          />
          <Filter
            label="Priority"
            values={priorities}
            value={filters.priority}
            onChange={(value) => setFilters({ ...filters, priority: value })}
          />
        </div>
        <div className="ticket-list">
          {shown.map((ticket) => (
            <button
              className="queue-ticket"
              key={ticket.id}
              onClick={() => onSelect(ticket)}
            >
              <div>
                <small>
                  {ticket.id} · {date(ticket.createdAt)}
                </small>
                <h4>{ticket.subject}</h4>
                <p>
                  {ticket.author.name}{" "}
                  {ticket.book ? `· ${ticket.book.title}` : "· Account-level"}
                </p>
              </div>
              <div>
                <Badge value={ticket.priority} />
                <Badge value={ticket.status} />
              </div>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

/** Renders one labelled dropdown used to filter the admin queue. */
function Filter({ label, values, value, onChange }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All {label.toLowerCase()}es</option>
        {values.map((entry) => (
          <option key={entry}>{entry}</option>
        ))}
      </select>
    </label>
  );
}

/** Lets ops review AI triage, draft/edit a response, and save operational updates. */
function TicketWorkbench({ ticket, onBack, onSaved }) {
  const [form, setForm] = useState({
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    assignedTo: ticket.assignedTo || "Aisha (Ops)",
    notes: ticket.notes || "",
    response: ticket.response || "",
  });
  const [draftState, setDraftState] = useState("");
  const [message, setMessage] = useState("");
  const update = (key, value) => setForm({ ...form, [key]: value });
  async function draft() {
    setDraftState("Drafting...");
    try {
      const result = await api(`/admin/tickets/${ticket.id}/draft`, {
        method: "POST",
      });
      update("response", result.text);
      setDraftState(`Draft supplied by ${result.source}.`);
    } catch (err) {
      setDraftState(err.message);
    }
  }
  async function save() {
    setMessage("");
    try {
      await api(`/admin/tickets/${ticket.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setMessage("Ticket saved and the author view has been updated.");
      onSaved();
    } catch (err) {
      setMessage(err.message);
    }
  }
  return (
    <>
      <button className="back" onClick={onBack}>
        ← Back to queue
      </button>
      <div className="workbench">
        <section className="panel customer-context">
          <p className="eyebrow">
            {ticket.id} · {date(ticket.createdAt)}
          </p>
          <h2>{ticket.subject}</h2>
          <p>{ticket.description}</p>
          <hr />
          <h3>{ticket.author.name}</h3>
          <p>
            {ticket.author.email} · {ticket.author.city}
          </p>
          {ticket.book && (
            <div className="book-context">
              <strong>{ticket.book.title}</strong>
              <span>{ticket.book.status}</span>
              <span>
                Pending: {currency.format(ticket.book.royalty_pending)}
              </span>
            </div>
          )}
        </section>
        <section className="panel admin-form">
          <div className="section-heading">
            <div>
              <h3>Resolve ticket</h3>
              <p>AI suggestions can always be overridden before you send.</p>
            </div>
          </div>
          <div className="fields">
            <label>
              Category
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
              >
                {categories.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select
                value={form.priority}
                onChange={(e) => update("priority", e.target.value)}
              >
                {priorities.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                {statuses.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Assigned to
              <input
                value={form.assignedTo}
                onChange={(e) => update("assignedTo", e.target.value)}
              />
            </label>
            <label className="full">
              Internal note <span>(not visible to author)</span>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </label>
            <div className="full draft-header">
              <strong>Author response</strong>
              <button className="secondary" onClick={draft}>
                Generate AI draft
              </button>
            </div>
            <small className="full draft-note">
              {draftState ||
                "Uses relevant BookLeaf policy and current book information only."}
            </small>
            <label className="full">
              <textarea
                className="response-editor"
                value={form.response}
                onChange={(e) => update("response", e.target.value)}
                placeholder="Write a helpful response, or generate a draft..."
              />
            </label>
          </div>
          {message && (
            <p className={message.includes("saved") ? "success" : "error"}>
              {message}
            </p>
          )}
          <button onClick={save}>
            Save changes {form.response ? "& send response" : ""}
          </button>
        </section>
      </div>
    </>
  );
}

/** Coordinates session state, API loading, navigation, and automatic refreshes. */
export default function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bookleaf-user"));
    } catch {
      return null;
    }
  });
  const [data, setData] = useState({ author: null, books: [], tickets: [] });
  const [page, setPage] = useState("overview");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(Boolean(session));
  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      if (session.role === "admin") {
        const tickets = await api("/admin/tickets");
        setData((old) => ({ ...old, tickets }));
      } else {
        const [author, books, tickets] = await Promise.all([
          api("/author/me"),
          api("/author/books"),
          api("/author/tickets"),
        ]);
        setData({ author, books, tickets });
      }
    } finally {
      setLoading(false);
    }
  }, [session]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!session) return;
    const timer = setInterval(load, 12000);
    return () => clearInterval(timer);
  }, [load, session]);
  function login(result) {
    localStorage.setItem("bookleaf-token", result.token);
    localStorage.setItem("bookleaf-user", JSON.stringify(result.user));
    setSession(result.user);
  }
  function logout() {
    localStorage.removeItem("bookleaf-token");
    localStorage.removeItem("bookleaf-user");
    setSession(null);
    setData({ author: null, books: [], tickets: [] });
    setPage("overview");
  }
  if (!session) return <Login onLogin={login} />;
  const admin = session.role === "admin";
  return (
    <div className="app-shell">
      <aside>
        <div className="brand">
          book<span>leaf</span>
          <small>{admin ? "OPERATIONS" : "AUTHOR PORTAL"}</small>
        </div>
        <nav>
          {admin ? (
            <button
              className={page === "queue" ? "active" : ""}
              onClick={() => {
                setPage("queue");
                setSelected(null);
              }}
            >
              Ticket queue
            </button>
          ) : (
            <>
              <button
                className={page === "overview" ? "active" : ""}
                onClick={() => setPage("overview")}
              >
                Overview
              </button>
              <button
                className={page === "books" ? "active" : ""}
                onClick={() => setPage("books")}
              >
                My books
              </button>
              <button
                className={page === "tickets" ? "active" : ""}
                onClick={() => setPage("tickets")}
              >
                My tickets
              </button>
            </>
          )}
        </nav>
        <div className="user-box">
          <strong>{session.name}</strong>
          <small>{admin ? "Admin workspace" : "Author account"}</small>
          <button onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="content">
        {loading ? (
          <div className="loading">Loading your workspace...</div>
        ) : admin ? (
          selected ? (
            <TicketWorkbench
              ticket={selected}
              onBack={() => setSelected(null)}
              onSaved={() => {
                load();
                setSelected(null);
              }}
            />
          ) : (
            <AdminQueue tickets={data.tickets} onSelect={setSelected} />
          )
        ) : page === "new" ? (
          <TicketForm
            books={data.books}
            onCreated={() => {
              load();
              setPage("tickets");
            }}
            onCancel={() => setPage("overview")}
          />
        ) : page === "tickets" ? (
          <>
            <div className="page-title">
              <div>
                <p className="eyebrow">AUTHOR SUPPORT</p>
                <h2>My tickets</h2>
                <p>Track requests and replies from the BookLeaf team.</p>
              </div>
              <button onClick={() => setPage("new")}>
                + Raise a support ticket
              </button>
            </div>
            <AuthorTickets tickets={data.tickets} />
          </>
        ) : page === "books" ? (
          <>
            <div className="page-title">
              <div>
                <p className="eyebrow">CATALOGUE</p>
                <h2>My books</h2>
                <p>Sales, status and royalty details for every title.</p>
              </div>
            </div>
            <section className="panel">
              <BookTable books={data.books} />
            </section>
          </>
        ) : (
          <AuthorOverview
            author={data.author}
            books={data.books}
            onNewTicket={() => setPage("new")}
          />
        )}
      </main>
    </div>
  );
}

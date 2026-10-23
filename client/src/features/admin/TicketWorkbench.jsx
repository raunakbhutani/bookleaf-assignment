import { useState } from "react";
import { api } from "../../api.js";
import { categories, priorities, statuses } from "../../lib/constants.js";
import { currency, date } from "../../lib/format.js";

/** Lets ops review AI triage, draft/edit a response, and save operational updates. */
export default function TicketWorkbench({ ticket, onBack, onSaved }) {
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

  const author = ticket.author;

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
          <h3>{author?.name || "Unknown author"}</h3>
          <p>
            {author?.email || "No email on file"}
            {author?.city ? ` · ${author.city}` : ""}
          </p>
          {ticket.book && (
            <div className="book-context">
              <strong>{ticket.book.title}</strong>
              <span>{ticket.book.status}</span>
              <span>Pending: {currency(ticket.book.royalty_pending)}</span>
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

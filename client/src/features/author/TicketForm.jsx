import { useState } from "react";
import { api } from "../../api.js";

/** Collects a ticket with author-owned book selection and UI-only attachment name. */
export default function TicketForm({ books, onCreated, onCancel }) {
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

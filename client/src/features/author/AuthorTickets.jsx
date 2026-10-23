import Badge from "../../components/Badge.jsx";
import { date } from "../../lib/format.js";

/** Shows author-visible queries and only the response that ops actually sent. */
export default function AuthorTickets({ tickets }) {
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

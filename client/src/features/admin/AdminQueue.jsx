import { useState } from "react";
import Badge from "../../components/Badge.jsx";
import Filter from "../../components/Filter.jsx";
import { categories, priorities, statuses } from "../../lib/constants.js";
import { date } from "../../lib/format.js";

/** Presents the queue controls and opens a selected ticket in the admin workbench. */
export default function AdminQueue({ tickets, onSelect }) {
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
                  {ticket.author?.name || "Unknown author"}{" "}
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

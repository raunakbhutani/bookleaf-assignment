import { useMemo } from "react";
import BookTable from "../../components/BookTable.jsx";
import Metric from "../../components/Metric.jsx";
import { currency, firstName } from "../../lib/format.js";

/** Shows the author overview along with compact totals calculated from their books. */
export default function AuthorOverview({ author, books, onNewTicket }) {
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

  if (!author) {
    return <div className="loading">Loading your workspace...</div>;
  }

  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">AUTHOR DASHBOARD</p>
          <h2>Hello, {firstName(author.name) || "there"}</h2>
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
          value={currency(totals.earned)}
          note="Lifetime earnings"
        />
        <Metric
          label="Pending royalty"
          value={currency(totals.pending)}
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

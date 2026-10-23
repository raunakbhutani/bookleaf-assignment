import Badge from "./Badge.jsx";
import { currency, date } from "../lib/format.js";

/** Displays a title's operational data without hiding zero or in-production states. */
export default function BookTable({ books }) {
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
              <td>{currency(book.total_royalty_earned)}</td>
              <td>
                <strong>{currency(book.royalty_pending)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

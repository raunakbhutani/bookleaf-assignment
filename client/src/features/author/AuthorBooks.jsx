import BookTable from "../../components/BookTable.jsx";

/** Author catalogue page with sales, status, and royalty details. */
export default function AuthorBooks({ books }) {
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">CATALOGUE</p>
          <h2>My books</h2>
          <p>Sales, status and royalty details for every title.</p>
        </div>
      </div>
      <section className="panel">
        <BookTable books={books} />
      </section>
    </>
  );
}

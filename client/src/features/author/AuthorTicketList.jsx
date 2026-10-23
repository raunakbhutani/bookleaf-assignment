import AuthorTickets from "./AuthorTickets.jsx";

/** Author support inbox with a shortcut to raise a new ticket. */
export default function AuthorTicketList({ tickets, onNewTicket }) {
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">AUTHOR SUPPORT</p>
          <h2>My tickets</h2>
          <p>Track requests and replies from the BookLeaf team.</p>
        </div>
        <button onClick={onNewTicket}>+ Raise a support ticket</button>
      </div>
      <AuthorTickets tickets={tickets} />
    </>
  );
}

/** Shared sidebar and content frame for the author and operations workspaces. */
export default function AppShell({
  admin,
  session,
  page,
  onNavigate,
  onLogout,
  children,
}) {
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
              onClick={() => onNavigate("queue")}
            >
              Ticket queue
            </button>
          ) : (
            <>
              <button
                className={page === "overview" ? "active" : ""}
                onClick={() => onNavigate("overview")}
              >
                Overview
              </button>
              <button
                className={page === "books" ? "active" : ""}
                onClick={() => onNavigate("books")}
              >
                My books
              </button>
              <button
                className={page === "tickets" ? "active" : ""}
                onClick={() => onNavigate("tickets")}
              >
                My tickets
              </button>
            </>
          )}
        </nav>
        <div className="user-box">
          <strong>{session.name}</strong>
          <small>{admin ? "Admin workspace" : "Author account"}</small>
          <button onClick={onLogout}>Sign out</button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

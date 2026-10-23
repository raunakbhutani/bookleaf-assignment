import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import AppShell from "./components/AppShell.jsx";
import Login from "./features/auth/Login.jsx";
import AuthorOverview from "./features/author/AuthorOverview.jsx";
import AuthorBooks from "./features/author/AuthorBooks.jsx";
import AuthorTicketList from "./features/author/AuthorTicketList.jsx";
import TicketForm from "./features/author/TicketForm.jsx";
import AdminQueue from "./features/admin/AdminQueue.jsx";
import TicketWorkbench from "./features/admin/TicketWorkbench.jsx";

const emptyData = { author: null, books: [], tickets: [] };

function readStoredSession() {
  try {
    return JSON.parse(localStorage.getItem("bookleaf-user"));
  } catch {
    return null;
  }
}

/** Coordinates session state, API loading, navigation, and automatic refreshes. */
export default function App() {
  const [session, setSession] = useState(readStoredSession);
  const [data, setData] = useState(emptyData);
  const [page, setPage] = useState("overview");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(Boolean(session));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const logout = useCallback(() => {
    localStorage.removeItem("bookleaf-token");
    localStorage.removeItem("bookleaf-user");
    setSession(null);
    setData(emptyData);
    setPage("overview");
    setSelected(null);
    setError("");
    setLoading(false);
    setReady(false);
  }, []);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      if (session.role === "admin") {
        const tickets = await api("/admin/tickets");
        setData((old) => ({ ...old, tickets: tickets || [] }));
      } else {
        const [author, books, tickets] = await Promise.all([
          api("/author/me"),
          api("/author/books"),
          api("/author/tickets"),
        ]);
        setData({
          author: author || null,
          books: Array.isArray(books) ? books : [],
          tickets: Array.isArray(tickets) ? tickets : [],
        });
      }
      setError("");
      setReady(true);
    } catch (err) {
      const message = err.message || "Could not load your workspace.";
      if (/sign in/i.test(message)) {
        logout();
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [session, logout]);

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
    setData(emptyData);
    setError("");
    setPage(result.user.role === "admin" ? "queue" : "overview");
    setSelected(null);
    setReady(false);
    setLoading(true);
    setSession(result.user);
  }

  function navigate(nextPage) {
    setPage(nextPage);
    if (nextPage === "queue") setSelected(null);
  }

  if (!session) return <Login onLogin={login} />;

  const admin = session.role === "admin";

  let content;
  if (!ready && loading) {
    content = <div className="loading">Loading your workspace...</div>;
  } else if (!ready) {
    content = (
      <div className="empty">
        {error || "Your workspace could not be loaded."}
        <div className="form-actions">
          <button onClick={load}>Try again</button>
        </div>
      </div>
    );
  } else if (admin) {
    content = selected ? (
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
    );
  } else if (page === "new") {
    content = (
      <TicketForm
        books={data.books}
        onCreated={() => {
          load();
          setPage("tickets");
        }}
        onCancel={() => setPage("overview")}
      />
    );
  } else if (page === "tickets") {
    content = (
      <AuthorTicketList
        tickets={data.tickets}
        onNewTicket={() => setPage("new")}
      />
    );
  } else if (page === "books") {
    content = <AuthorBooks books={data.books} />;
  } else {
    content = (
      <AuthorOverview
        author={data.author}
        books={data.books}
        onNewTicket={() => setPage("new")}
      />
    );
  }

  return (
    <AppShell
      admin={admin}
      session={session}
      page={page}
      onNavigate={navigate}
      onLogout={logout}
    >
      {error && ready && <p className="error">{error}</p>}
      {content}
    </AppShell>
  );
}

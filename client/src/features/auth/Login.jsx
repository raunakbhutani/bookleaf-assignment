import { useState } from "react";
import { api } from "../../api.js";

/** Renders the demo sign-in screen and returns the selected API identity. */
export default function Login({ onLogin }) {
  const [email, setEmail] = useState("priya.sharma@email.com");
  const [password, setPassword] = useState("Bookleaf123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      onLogin(
        await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand">
          book<span>leaf</span>
          <small>AUTHOR PARTNER PORTAL</small>
        </div>
        <h1>Support that keeps your story moving.</h1>
        <p>
          Sign in to your author dashboard or the BookLeaf operations workspace.
        </p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="credentials">
          <strong>Demo credentials</strong>
          <br />
          Any seeded author email / <code>Bookleaf123!</code>
          <br />
          Ops: <code>ops@bookleaf.test</code> / <code>Bookleaf123!</code>
        </div>
      </section>
    </main>
  );
}

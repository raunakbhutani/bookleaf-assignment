/** Displays one immutable metric tile. */
export default function Metric({ label, value, note }) {
  return (
    <article className="metric">
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

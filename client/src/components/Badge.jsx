/** Gives every ticket a consistent status, priority, or category visual label. */
export default function Badge({ value }) {
  return (
    <span
      className={`badge ${String(value).toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}`}
    >
      {value}
    </span>
  );
}

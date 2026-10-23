/** Renders one labelled dropdown used to filter the admin queue. */
export default function Filter({ label, values, value, onChange }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All {label.toLowerCase()}es</option>
        {values.map((entry) => (
          <option key={entry}>{entry}</option>
        ))}
      </select>
    </label>
  );
}

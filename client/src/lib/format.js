const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function currency(value) {
  return currencyFormatter.format(value || 0);
}

export function date(value) {
  return value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "-";
}

export function firstName(name) {
  return String(name || "")
    .trim()
    .split(" ")[0];
}

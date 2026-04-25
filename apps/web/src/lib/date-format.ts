function getOrdinalSuffix(day: number) {
  const remainder = day % 10;
  const teen = day % 100;

  if (teen >= 11 && teen <= 13) {
    return "th";
  }

  if (remainder === 1) {
    return "st";
  }

  if (remainder === 2) {
    return "nd";
  }

  if (remainder === 3) {
    return "rd";
  }

  return "th";
}

export function formatShortTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatLongDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(date);
  const month = new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(date);
  const day = date.getDate();
  const year = date.getFullYear();
  const time = formatShortTime(date);

  return `${weekday}, ${month} ${day}${getOrdinalSuffix(day)}, ${year} at ${time}`;
}

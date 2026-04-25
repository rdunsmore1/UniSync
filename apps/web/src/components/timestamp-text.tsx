import { formatLongDateTime, formatShortTime } from "../lib/date-format";

export function TimestampText({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <time className={className} dateTime={value} title={formatLongDateTime(value)}>
      {formatShortTime(value)}
    </time>
  );
}

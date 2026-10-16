import { describeViolation, type LogViolation } from "@/lib/violations/types";

/** Hareket saatinin yanında gösterilen kırmızı ihlal etiketi. */
export function ViolationBadge({ violation }: { violation: LogViolation }) {
  return (
    <span className="inline-flex items-center rounded-md border border-danger/20 bg-danger/10 px-1.5 py-0.5 font-sans text-xs font-medium whitespace-nowrap text-danger">
      {describeViolation(violation)}
    </span>
  );
}

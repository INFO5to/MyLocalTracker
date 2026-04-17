import { getStatusMeta, type OrderStatus } from "@/lib/tracking";

const toneClassName = {
  slate: "bg-slate-200/80 text-slate-700",
  amber: "bg-amber-100 text-amber-700",
  orange: "bg-orange-100 text-orange-700",
  teal: "bg-teal-100 text-teal-700",
  green: "bg-emerald-100 text-emerald-700",
} as const;

export function StatusPill({ status }: { status: OrderStatus }) {
  const meta = getStatusMeta(status);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${toneClassName[meta.tone]}`}
    >
      <span
        className="status-dot"
        style={{
          backgroundColor: meta.dot,
        }}
      />
      {meta.label}
    </span>
  );
}

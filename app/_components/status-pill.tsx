import { getStatusMeta, type OrderStatus } from "@/lib/tracking";

const toneClassName = {
  slate: {
    background: "color-mix(in srgb, var(--foreground) 10%, transparent 90%)",
    borderColor: "color-mix(in srgb, var(--foreground) 12%, transparent 88%)",
    color: "var(--muted)",
  },
  amber: {
    background: "color-mix(in srgb, var(--warning) 18%, transparent 82%)",
    borderColor: "color-mix(in srgb, var(--warning) 24%, transparent 76%)",
    color: "color-mix(in srgb, var(--warning) 36%, var(--foreground) 64%)",
  },
  orange: {
    background: "color-mix(in srgb, var(--brand) 16%, transparent 84%)",
    borderColor: "color-mix(in srgb, var(--brand) 26%, transparent 74%)",
    color: "var(--brand-deep)",
  },
  teal: {
    background: "color-mix(in srgb, var(--accent) 14%, transparent 86%)",
    borderColor: "color-mix(in srgb, var(--accent) 22%, transparent 78%)",
    color: "color-mix(in srgb, var(--accent) 54%, var(--foreground) 46%)",
  },
  green: {
    background: "color-mix(in srgb, var(--success) 18%, transparent 82%)",
    borderColor: "color-mix(in srgb, var(--success) 24%, transparent 76%)",
    color: "color-mix(in srgb, var(--success) 58%, var(--foreground) 42%)",
  },
} as const;

export function StatusPill({ status }: { status: OrderStatus }) {
  const meta = getStatusMeta(status);

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
      style={toneClassName[meta.tone]}
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

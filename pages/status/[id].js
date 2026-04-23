// pages/status/[id].js
//
// npm install @supabase/supabase-js
// Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

import { createClient } from "@supabase/supabase-js";
import Head from "next/head";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STATUS_STEPS = ["created", "started", "packaging", "delivered"];

const STATUS_META = {
  created:   { label: "Order Created", color: "#94a3b8" },
  started:   { label: "Work Started",  color: "#6366f1" },
  packaging: { label: "Packaging",     color: "#f59e0b" },
  delivered: { label: "Delivered",     color: "#22c55e" },
};

function formatEta(eta) {
  if (!eta) return null;
  const trimmed = eta.trim();
  // Already MM/DD/YYYY — return as-is
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) return trimmed;
  // MM/DD with no year — append current year
  if (/^\d{1,2}\/\d{1,2}$/.test(trimmed)) {
    return `${trimmed}/${new Date().getFullYear()}`;
  }
  // ISO date (YYYY-MM-DD) — convert to MM/DD/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [yyyy, mm, dd] = trimmed.split("-");
    return `${mm}/${dd}/${yyyy}`;
  }
  // Anything else (e.g. "May 10", "this weekend") — show as-is, don't try to parse
  return trimmed;
}

export async function getServerSideProps({ params }) {
  const orderNumber = params.id.toUpperCase();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !order) return { props: { order: null, orderNumber } };
  return { props: { order, orderNumber } };
}

export default function StatusPage({ order, orderNumber }) {
  if (!order) {
    return (
      <>
        <Head><title>Order Not Found</title></Head>
        <div style={s.page}>
          <div style={s.card}>
            <p style={s.notFoundNumber}>{orderNumber}</p>
            <p style={s.notFoundText}>No order found with this number.</p>
          </div>
        </div>
      </>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(order.status);
  const accent = STATUS_META[order.status]?.color ?? "#94a3b8";
  const displayEta = formatEta(order.eta);

  const createdAt = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <>
      <Head>
        <title>Order {order.order_number}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={s.page}>
        <div style={s.card}>

          {/* Order number */}
          <p style={s.orderNum}>{order.order_number}</p>

          {/* Progress bar */}
          <div style={s.stepsRow}>
            {STATUS_STEPS.map((step, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              const stepColor = done || active ? accent : "#e2e8f0";
              return (
                <div key={step} style={s.stepWrapper}>
                  <div style={{ ...s.stepDot, backgroundColor: stepColor, boxShadow: active ? `0 0 0 3px ${accent}33` : "none" }} />
                  {i < STATUS_STEPS.length - 1 && (
                    <div style={{ ...s.stepLine, backgroundColor: done ? accent : "#e2e8f0" }} />
                  )}
                  <p style={{ ...s.stepLabel, color: active ? accent : done ? "#64748b" : "#cbd5e1", fontWeight: active ? 600 : 400 }}>
                    {STATUS_META[step].label}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={s.divider} />

          {/* Info rows */}
          <div style={s.infoList}>
            <Row label="Customer" value={order.discord_username} />
            <Row label="Order Placed" value={createdAt} />
            <Row label="Paid" value={order.is_paid ? "✅ Yes" : "❌ No"} />
            {displayEta && <Row label="ETA" value={displayEta} accent={accent} />}
          </div>

          {order.note && (
            <div style={{ ...s.note, borderColor: accent + "44" }}>
              <p style={{ ...s.noteLabel, color: accent }}>Note from our team</p>
              <p style={s.noteText}>{order.note}</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

function Row({ label, value, accent }) {
  return (
    <div style={s.row}>
      <span style={s.rowLabel}>{label}</span>
      <span style={{ ...s.rowValue, color: accent ?? "#1e293b" }}>{value}</span>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 24px rgba(0,0,0,0.06)",
    padding: "36px",
    width: "100%",
    maxWidth: "480px",
  },
  orderNum: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#94a3b8",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    margin: "0 0 28px",
  },
  stepsRow: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "28px",
  },
  stepWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  stepDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    flexShrink: 0,
    transition: "background-color 0.2s",
    zIndex: 1,
  },
  stepLine: {
    position: "absolute",
    top: "5px",
    left: "50%",
    width: "100%",
    height: "2px",
    zIndex: 0,
  },
  stepLabel: {
    fontSize: "10px",
    marginTop: "8px",
    textAlign: "center",
    lineHeight: 1.3,
  },
  divider: {
    height: "1px",
    backgroundColor: "#f1f5f9",
    margin: "0 0 20px",
  },
  infoList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginBottom: "20px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    fontSize: "13px",
    color: "#94a3b8",
    fontWeight: 500,
  },
  rowValue: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#1e293b",
  },
  note: {
    borderRadius: "10px",
    border: "1px solid",
    padding: "14px 16px",
    backgroundColor: "#fafafa",
    marginTop: "8px",
  },
  noteLabel: {
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    margin: "0 0 6px",
  },
  noteText: {
    fontSize: "13px",
    color: "#475569",
    margin: 0,
    lineHeight: 1.6,
  },
  notFoundNumber: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#94a3b8",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    margin: "0 0 8px",
  },
  notFoundText: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
};
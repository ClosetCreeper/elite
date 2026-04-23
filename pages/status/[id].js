// pages/status/[id].js
//
// Dependencies to install in your Vercel project:
//   npm install @supabase/supabase-js
//
// Environment variables to add in Vercel project settings:
//   NEXT_PUBLIC_SUPABASE_URL        — your Supabase project URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY   — your Supabase anon/public key
//
// App Router users: see the comment at the bottom of this file.

import { createClient } from "@supabase/supabase-js";
import Head from "next/head";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STATUS_STEPS = ["created", "started", "packaging", "delivered"];

const STATUS_META = {
  created: {
    label: "Order Created",
    icon: "🆕",
    description: "Your order has been received and is in our queue.",
    color: "#99aab5",
  },
  started: {
    label: "Work Started",
    icon: "🔨",
    description: "Our team has started building your server.",
    color: "#5865f2",
  },
  packaging: {
    label: "Packaging",
    icon: "📦",
    description: "Your server is being packaged and prepared for delivery.",
    color: "#ffa500",
  },
  delivered: {
    label: "Delivered",
    icon: "✅",
    description: "Your order has been delivered. Enjoy your new server!",
    color: "#57f287",
  },
};

// Formats any stored ETA string to MM/DD/YYYY if it's parseable as a date.
// Plain text values like "this weekend" pass through unchanged.
function formatEta(eta) {
  if (!eta) return null;
  // Already MM/DD/YYYY — return as-is
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(eta.trim())) return eta.trim();
  // Try to parse as a date (handles ISO strings, "May 10 2025", etc.)
  const parsed = new Date(eta);
  if (!isNaN(parsed.getTime())) {
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    const yyyy = parsed.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }
  // Plain text fallback — show as-is
  return eta;
}

export async function getServerSideProps({ params }) {
  const orderNumber = params.id.toUpperCase();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !order) {
    return { props: { order: null, orderNumber } };
  }

  return { props: { order, orderNumber } };
}

export default function StatusPage({ order, orderNumber }) {
  if (!order) {
    return (
      <>
        <Head>
          <title>Order Not Found — Elite Server Designs</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        </Head>
        <div style={styles.root}>
          <div style={styles.notFound}>
            <div style={styles.notFoundIcon}>🔍</div>
            <h1 style={styles.notFoundTitle}>Order Not Found</h1>
            <p style={styles.notFoundSub}>
              No order was found for <code style={styles.code}>{orderNumber}</code>.<br />
              Double-check your order number and try again.
            </p>
            <p style={styles.brandTag}>Elite Server Designs</p>
          </div>
        </div>
      </>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const currentMeta = STATUS_META[order.status] ?? STATUS_META.created;
  const accentColor = currentMeta.color;

  const createdAt = new Date(order.created_at);
  const formattedDate = createdAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayEta = formatEta(order.eta);

  return (
    <>
      <Head>
        <title>Order {order.order_number} — Elite Server Designs</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={`Track your Elite Server Designs order ${order.order_number}`} />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <div style={styles.root}>
        <header style={styles.header}>
          <div style={styles.headerInner}>
            <span style={styles.brand}>Elite Server Designs</span>
            <span style={{
              ...styles.badge,
              backgroundColor: accentColor + "22",
              color: accentColor,
              border: `1px solid ${accentColor}55`,
            }}>
              {currentMeta.icon} {currentMeta.label}
            </span>
          </div>
        </header>

        <main style={styles.main}>
          <div style={{ ...styles.accentBar, backgroundColor: accentColor }} />

          <div style={styles.card}>
            <div style={styles.orderHeader}>
              <div>
                <p style={styles.orderLabel}>Order Number</p>
                <h1 style={styles.orderNumber}>{order.order_number}</h1>
              </div>
              <div style={styles.paidBadge}>
                {order.is_paid
                  ? <span style={{ ...styles.pill, backgroundColor: "#57f28722", color: "#57f287", border: "1px solid #57f28755" }}>💳 Paid</span>
                  : <span style={{ ...styles.pill, backgroundColor: "#ed424522", color: "#ed4245", border: "1px solid #ed424555" }}>❌ Unpaid</span>
                }
              </div>
            </div>

            {/* Progress Steps */}
            <div style={styles.stepsContainer}>
              {STATUS_STEPS.map((step, i) => {
                const meta = STATUS_META[step];
                const isComplete = i < currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const isPending = i > currentStepIndex;

                return (
                  <div key={step} style={styles.stepRow}>
                    {i > 0 && (
                      <div style={{
                        ...styles.connector,
                        backgroundColor: isComplete || isCurrent ? accentColor : "#2a2a2a",
                      }} />
                    )}
                    <div style={styles.stepContent}>
                      <div style={{
                        ...styles.stepCircle,
                        backgroundColor: isCurrent ? accentColor : isComplete ? accentColor + "44" : "#1a1a1a",
                        border: `2px solid ${isCurrent || isComplete ? accentColor : "#333"}`,
                        boxShadow: isCurrent ? `0 0 16px ${accentColor}88` : "none",
                      }}>
                        <span style={{ fontSize: isCurrent ? "18px" : "14px", opacity: isPending ? 0.3 : 1 }}>
                          {meta.icon}
                        </span>
                      </div>
                      <div style={styles.stepText}>
                        <span style={{
                          ...styles.stepLabel,
                          color: isCurrent ? "#fff" : isComplete ? "#aaa" : "#444",
                          fontWeight: isCurrent ? 700 : 400,
                        }}>
                          {meta.label}
                        </span>
                        {isCurrent && (
                          <span style={styles.stepDescription}>{meta.description}</span>
                        )}
                      </div>
                      {isComplete && (
                        <span style={{ ...styles.checkmark, color: accentColor }}>✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info Grid */}
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Customer</span>
                <span style={styles.infoValue}>{order.discord_username}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Order Placed</span>
                <span style={styles.infoValue}>{formattedDate}</span>
              </div>
              {displayEta && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Estimated Delivery</span>
                  <span style={{ ...styles.infoValue, color: accentColor, fontWeight: 600 }}>
                    {displayEta}
                  </span>
                </div>
              )}
            </div>

            {order.note && (
              <div style={{ ...styles.noteBox, borderColor: accentColor + "44" }}>
                <span style={{ ...styles.noteLabel, color: accentColor }}>📝 Note from our team</span>
                <p style={styles.noteText}>{order.note}</p>
              </div>
            )}
          </div>

          <p style={styles.footer}>
            Questions? Reach out to us on Discord.<br />
            <span style={styles.footerSub}>
              Use <code style={styles.code}>/status {order.order_number}</code> in our server for quick updates.
            </span>
          </p>
        </main>
      </div>
    </>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    backgroundColor: "#0d0d0d",
    color: "#e0e0e0",
    fontFamily: "'DM Sans', sans-serif",
  },
  header: { borderBottom: "1px solid #1e1e1e", padding: "16px 24px" },
  headerInner: {
    maxWidth: "640px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "16px",
    letterSpacing: "-0.02em",
    color: "#fff",
  },
  badge: {
    fontSize: "12px",
    fontWeight: 600,
    padding: "4px 12px",
    borderRadius: "999px",
    letterSpacing: "0.02em",
  },
  main: { maxWidth: "640px", margin: "0 auto", padding: "40px 24px 80px" },
  accentBar: { height: "3px", borderRadius: "999px", marginBottom: "32px", opacity: 0.7 },
  card: {
    backgroundColor: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: "16px",
    padding: "32px",
  },
  orderHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "32px",
  },
  orderLabel: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#555",
    margin: "0 0 6px",
  },
  orderNumber: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "28px",
    fontWeight: 800,
    color: "#fff",
    margin: 0,
    letterSpacing: "-0.03em",
  },
  paidBadge: { paddingTop: "4px" },
  pill: { fontSize: "12px", fontWeight: 600, padding: "6px 14px", borderRadius: "999px" },
  stepsContainer: { marginBottom: "32px" },
  stepRow: { display: "flex", flexDirection: "column" },
  connector: { width: "2px", height: "24px", marginLeft: "23px", borderRadius: "1px" },
  stepContent: { display: "flex", alignItems: "center", gap: "16px" },
  stepCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepText: { flex: 1, display: "flex", flexDirection: "column", gap: "2px" },
  stepLabel: { fontSize: "15px", letterSpacing: "-0.01em" },
  stepDescription: { fontSize: "12px", color: "#888", fontWeight: 300 },
  checkmark: { fontSize: "16px", fontWeight: 700 },
  infoGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "24px 0",
    borderTop: "1px solid #1e1e1e",
    borderBottom: "1px solid #1e1e1e",
    marginBottom: "24px",
  },
  infoItem: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  infoLabel: {
    fontSize: "12px",
    color: "#555",
    fontWeight: 500,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  infoValue: { fontSize: "14px", color: "#ccc", fontWeight: 500, textAlign: "right", maxWidth: "60%" },
  noteBox: { border: "1px solid", borderRadius: "10px", padding: "16px 20px", backgroundColor: "#0a0a0a" },
  noteLabel: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: "8px",
  },
  noteText: { fontSize: "14px", color: "#bbb", margin: 0, lineHeight: 1.6 },
  footer: { textAlign: "center", marginTop: "32px", fontSize: "13px", color: "#444", lineHeight: 1.8 },
  footerSub: { color: "#333", fontSize: "12px" },
  code: {
    fontFamily: "monospace",
    backgroundColor: "#1a1a1a",
    padding: "2px 6px",
    borderRadius: "4px",
    color: "#888",
    fontSize: "12px",
  },
  notFound: { maxWidth: "480px", margin: "0 auto", padding: "120px 24px", textAlign: "center" },
  notFoundIcon: { fontSize: "48px", marginBottom: "24px" },
  notFoundTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "28px",
    fontWeight: 800,
    color: "#fff",
    margin: "0 0 12px",
  },
  notFoundSub: { fontSize: "15px", color: "#555", lineHeight: 1.7, margin: "0 0 32px" },
  brandTag: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "12px",
    color: "#333",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    margin: 0,
  },
};

/*
── App Router version (Next.js 13+) ──────────────────────────────────────────
Save as: app/status/[id]/page.js

export default async function StatusPage({ params }) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const orderNumber = params.id.toUpperCase();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();
  // Render the same JSX above using order and orderNumber directly
}
*/

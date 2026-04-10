import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Server-side ADMIN guard ──────────────────────────────────────────────────

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const role    = (session as any)?.role as string | undefined;

  if (!session || role !== "ADMIN") {
    redirect("/");
  }

  // ─── Fetch all users ────────────────────────────────────────────────────────
  const users = await prisma.user.findMany({
    select: {
      id:            true,
      name:          true,
      email:         true,
      role:          true,
      emailVerified: true,
      image:         true,
      _count:        { select: { tasks: true } },
    },
    orderBy: { emailVerified: "asc" },
  });

  // ─── Styles (inline — no client bundle needed) ────────────────────────────

  const gold    = "#C9A961";
  const dim     = "#3B4558";
  const dimmer  = "#252836";
  const surface = "#0C0D10";
  const border  = "#1E1F24";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#08090C", color: "#7A8599", fontFamily: "inherit", padding: "0 0 80px" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: surface, borderBottom: `1px solid ${border}`, padding: "18px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#C2C8D4", letterSpacing: "0.04em" }}>
            Pristine Designs
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.22em", color: dimmer, textTransform: "uppercase", marginTop: 2 }}>
            Admin Vault · RBAC Console
          </div>
        </div>
        <a
          href="/"
          style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: dim, textDecoration: "none", padding: "6px 14px", border: `1px solid ${border}`, borderRadius: 6 }}
        >
          ← Dashboard
        </a>
      </div>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 48px 0" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: gold, boxShadow: `0 0 10px ${gold}` }} />
            <span style={{ fontFamily: "Georgia, serif", fontSize: 26, color: gold, letterSpacing: "-0.01em" }}>
              User Roster
            </span>
          </div>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: dimmer }}>
            {users.length} registered user{users.length !== 1 ? "s" : ""} · Live from Supabase
          </div>
        </div>

        {/* Table */}
        <div style={{ border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>

          {/* Table header */}
          <div style={{
            display:             "grid",
            gridTemplateColumns: "40px 1fr 1fr 120px 80px 80px",
            gap:                 0,
            backgroundColor:     surface,
            borderBottom:        `1px solid ${border}`,
            padding:             "10px 20px",
          }}>
            {["#", "Name", "Email", "Role", "Tasks", "Joined"].map((h) => (
              <div key={h} style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: dimmer }}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {users.map((u, i) => {
            const isAdmin = u.role === "ADMIN";
            const joined  = u.emailVerified
              ? new Date(u.emailVerified).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
              : "—";

            return (
              <div
                key={u.id}
                style={{
                  display:             "grid",
                  gridTemplateColumns: "40px 1fr 1fr 120px 80px 80px",
                  gap:                 0,
                  padding:             "14px 20px",
                  borderBottom:        i < users.length - 1 ? `1px solid ${border}` : "none",
                  backgroundColor:     isAdmin ? "rgba(201,169,97,0.03)" : "transparent",
                  alignItems:          "center",
                }}
              >
                {/* Index */}
                <div style={{ fontSize: 10, fontFamily: "monospace", color: dimmer }}>
                  {String(i + 1).padStart(2, "0")}
                </div>

                {/* Name + avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {u.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={u.image} alt="" width={24} height={24} style={{ borderRadius: "50%", border: `1px solid ${border}` }} />
                  ) : (
                    <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "rgba(201,169,97,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 9, color: gold, fontWeight: 700 }}>
                        {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span style={{ fontSize: 12, color: "#C2C8D4", letterSpacing: "0.01em" }}>
                    {u.name ?? "—"}
                  </span>
                </div>

                {/* Email */}
                <div style={{ fontSize: 11, color: dim, letterSpacing: "0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>
                  {u.email ?? "—"}
                </div>

                {/* Role badge */}
                <div>
                  <span style={{
                    display:         "inline-flex",
                    alignItems:      "center",
                    gap:             5,
                    padding:         "3px 10px",
                    borderRadius:    20,
                    fontSize:        8,
                    fontWeight:      700,
                    letterSpacing:   "0.2em",
                    textTransform:   "uppercase",
                    backgroundColor: isAdmin ? "rgba(201,169,97,0.1)"      : "rgba(59,69,88,0.15)",
                    border:          `1px solid ${isAdmin ? "rgba(201,169,97,0.35)" : border}`,
                    color:           isAdmin ? gold                          : dim,
                  }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: isAdmin ? gold : dim }} />
                    {u.role}
                  </span>
                </div>

                {/* Task count */}
                <div style={{ fontSize: 12, color: dim, fontVariantNumeric: "tabular-nums" }}>
                  {u._count.tasks}
                </div>

                {/* Joined */}
                <div style={{ fontSize: 10, color: dimmer, fontVariantNumeric: "tabular-nums" }}>
                  {joined}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {users.length === 0 && (
            <div style={{ padding: "48px 24px", textAlign: "center", fontSize: 11, color: dimmer, letterSpacing: "0.1em" }}>
              No users registered yet.
            </div>
          )}
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 24, fontSize: 9, color: "#14151C", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          To promote a user to Admin — run in Supabase SQL: UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
        </div>
      </div>
    </div>
  );
}

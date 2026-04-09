"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Crosshair, Loader2 } from "lucide-react";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div
      style={{
        minHeight:       "100vh",
        backgroundColor: "#08090C",
        display:         "flex",
        flexDirection:   "column",
        alignItems:      "center",
        justifyContent:  "center",
        padding:         "40px 24px",
        fontFamily:      "inherit",
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position:        "fixed",
        inset:           0,
        background:      "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(201,169,97,0.04) 0%, transparent 70%)",
        pointerEvents:   "none",
      }} />

      {/* Card */}
      <div style={{
        position:        "relative",
        width:           "100%",
        maxWidth:        440,
        backgroundColor: "#0C0D10",
        border:          "1px solid #1E1F24",
        borderRadius:    16,
        padding:         "52px 44px",
        display:         "flex",
        flexDirection:   "column",
        alignItems:      "center",
        boxShadow:       "0 0 80px rgba(201,169,97,0.05), 0 32px 64px rgba(0,0,0,0.6)",
      }}>

        {/* Logo mark */}
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 10 }}>
          <Crosshair size={18} style={{ color: "#C9A961" }} />
          <span style={{
            fontFamily:    "Georgia, serif",
            fontSize:      18,
            color:         "#C2C8D4",
            letterSpacing: "0.06em",
          }}>
            Pristine Designs
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: 1, backgroundColor: "#1E1F24", marginBottom: 36 }} />

        {/* Headline */}
        <div style={{
          fontFamily:    "Georgia, serif",
          fontSize:      26,
          color:         "#C9A961",
          letterSpacing: "-0.01em",
          marginBottom:  8,
          textAlign:     "center",
        }}>
          Executive Access
        </div>
        <div style={{
          fontSize:      11,
          color:         "#3B4558",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom:  44,
          textAlign:     "center",
        }}>
          One Step Closer · 2026
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width:           "100%",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            gap:             12,
            padding:         "14px 24px",
            borderRadius:    8,
            backgroundColor: loading ? "rgba(201,169,97,0.06)" : "rgba(201,169,97,0.08)",
            border:          "1px solid rgba(201,169,97,0.28)",
            color:           "#C9A961",
            fontSize:        12,
            fontWeight:      700,
            letterSpacing:   "0.2em",
            textTransform:   "uppercase",
            cursor:          loading ? "default" : "pointer",
            transition:      "all 0.2s ease",
            opacity:         loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(201,169,97,0.14)";
              (e.currentTarget as HTMLButtonElement).style.borderColor     = "rgba(201,169,97,0.5)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow       = "0 0 32px rgba(201,169,97,0.1)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(201,169,97,0.08)";
            (e.currentTarget as HTMLButtonElement).style.borderColor     = "rgba(201,169,97,0.28)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow       = "none";
          }}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            /* Google "G" SVG */
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#C9A961" fillOpacity="0.9"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#C9A961" fillOpacity="0.7"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#C9A961" fillOpacity="0.5"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#C9A961" fillOpacity="0.6"/>
            </svg>
          )}
          {loading ? "Authenticating…" : "Continue with Google"}
        </button>

        {/* Footer note */}
        <div style={{
          marginTop:     32,
          fontSize:      9,
          color:         "#252836",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          textAlign:     "center",
          lineHeight:    1.8,
        }}>
          Claude Agent Stack · Supabase · Chairman Access Only
        </div>
      </div>
    </div>
  );
}

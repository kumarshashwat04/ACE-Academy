"use client";
import AppShell from '@/components/AppShell';
import React from "react";

export default function ComingSoon() {
  const styles = {
    main: {
      minHeight: "100vh",
      backgroundColor: "#0a0a0a",
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: 0,
      padding: "1rem",
      overflow: "hidden",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    text: {
      fontSize: "clamp(2rem, 8vw, 4rem)",
      fontWeight: 800,
      letterSpacing: "-0.03em",
      margin: 0,
      background: "linear-gradient(to right, #ffffff, #a3a3a3)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      textTransform: "uppercase" as const,
    },
  };

  return (
    <AppShell currentTab="scores">
      <main style={styles.main}>
        <h1 style={styles.text}>Coming Soon</h1>
      </main>
    </AppShell>
  );
}
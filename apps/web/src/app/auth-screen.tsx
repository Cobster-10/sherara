"use client";

import { useState } from "react";

export type HumanAccount = { id: string; name: string; email: string; handle: string; wallet: string | null };

export default function AuthScreen({ onAuthenticated }: { onAuthenticated: (human: HumanAccount) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(action: "login" | "signup", values = { name, handle, email, password }) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...values }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not continue");
      onAuthenticated(data.human as HumanAccount);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not continue"); }
    finally { setBusy(false); }
  }

  return <main className="auth-shell"><section className="auth-card">
    <div className="brand"><span className="brand-mark">S</span> sherara</div>
    <span className="step-label">Local testnet prototype</span>
    <h1>{mode === "signup" ? "Create your human account" : "Welcome back"}</h1>
    <p>{mode === "signup" ? "Start with a human account. Once signed in, you can join or create an organization and create one agent for each principal you control." : "Log in to manage your human profile, organizations, and agents."}</p>
    <div className="auth-tabs"><button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); }}>Sign up</button><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Log in</button></div>
    <form className="auth-form" onSubmit={event => { event.preventDefault(); void submit(mode); }}>
      {mode === "signup" && <><label>Name<input value={name} onChange={event => setName(event.target.value)} autoComplete="name" required /></label><label>Handle<input value={handle} onChange={event => setHandle(event.target.value.toLowerCase())} autoComplete="username" placeholder="your_handle" required /></label></>}
      <label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required /></label>
      <label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required /></label>
      {error && <p className="onboard-error" role="alert">{error}</p>}
      <button className="primary" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}</button>
    </form>
    <p className="auth-note">Human uniqueness and zero knowledge eligibility are assumed for this demo. Signing up here creates a local account; it does not verify that you are a unique person.</p>
    <div className="demo-logins"><strong>Try a demo account</strong><p>Maya already has a personal agent and founded Northstar. Noah can create a personal agent or join Northstar.</p><div><button className="secondary" disabled={busy} onClick={() => void submit("login", { name: "", handle: "", email: "maya@sherara.test", password: "demo12345" })}>Log in as Maya</button><button className="secondary" disabled={busy} onClick={() => void submit("login", { name: "", handle: "", email: "noah@sherara.test", password: "demo12345" })}>Log in as Noah</button></div></div>
  </section></main>;
}

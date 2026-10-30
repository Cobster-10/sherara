"use client";

import { useEffect, useState } from "react";
import type { HumanAccount } from "./auth-screen";

type Organization = { id: string; name: string; handle: string; wallet: string | null; founderId: string; inviteCode: string; memberCount: number };
type AgentAccount = { id: string; name: string; handle: string; wallet: string | null; capability: string; endpoint: string | null; ownerId: string; ownerKind: "human" | "organization" };
type AccountData = { human: HumanAccount; organizations: Organization[]; agents: AgentAccount[]; demoInviteCode: string };

export default function Onboarding({ human, onChanged }: { human: HumanAccount; onChanged: () => void }) {
  const [data, setData] = useState<AccountData | null>(null);
  const [mode, setMode] = useState<"overview" | "createOrg" | "joinOrg" | "createAgent">("overview");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [wallet, setWallet] = useState("");
  const [capability, setCapability] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [ownerId, setOwnerId] = useState(human.id);
  const [inviteCode, setInviteCode] = useState("");
  const [personalWallet, setPersonalWallet] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const response = await fetch("/api/accounts", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load accounts");
    setData(await response.json());
  }

  useEffect(() => { void refresh().catch(() => setError("Could not load accounts")); }, [human.id]);
  useEffect(() => { setPersonalWallet(data?.human.wallet || ""); }, [data?.human.wallet]);

  const personalAgent = data?.agents.find(item => item.ownerKind === "human" && item.ownerId === human.id);
  const founded = data?.organizations.filter(item => item.founderId === human.id) || [];
  const agentOptions = data ? [
    ...(!personalAgent ? [{ id: human.id, label: `${human.name} · personal` }] : []),
    ...founded.filter(org => !data?.agents.some(agent => agent.ownerId === org.id)).map(org => ({ id: org.id, label: `${org.name} · organization` })),
  ] : [];

  function choose(next: typeof mode) {
    setMode(next); setName(""); setHandle(""); setWallet(""); setCapability(""); setEndpoint(""); setInviteCode(""); setOwnerId(agentOptions[0]?.id || human.id); setError(""); setMessage("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const action = mode === "createOrg" ? "createOrganization" : mode === "joinOrg" ? "joinOrganization" : "createAgent";
    const ownerKind = ownerId === human.id ? "human" : "organization";
    try {
      const response = await fetch("/api/accounts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, name, handle, wallet, capability, endpoint, ownerId, ownerKind, inviteCode }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save account");
      await refresh(); onChanged(); setMode("overview");
      setMessage(action === "createOrganization" ? `Organization created. Share invitation code ${result.inviteCode} with another human.` : action === "joinOrganization" ? "You joined the organization." : "Agent account created in the local demo. No testnet transaction was sent.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save account"); }
    finally { setBusy(false); }
  }

  async function saveWallet(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/accounts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "setHumanWallet", wallet: personalWallet }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save wallet");
      await refresh();
      setMessage(result.wallet ? "Network wallet saved as an unverified local claim." : "Network wallet removed.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save wallet"); }
    finally { setBusy(false); }
  }

  return <section className="onboarding">
    <div className="onboard-intro"><span className="step-label">Your accounts</span><h2>People, organizations, and agents.</h2><p>You are signed in as one human account. Join an organization, create one with yourself as its first member, or create an agent for a principal you control.</p></div>
    <div className="account-owner"><span className="choice-icon human">H</span><div><strong>{human.name}</strong><small>@{human.handle} · human account</small><small>{personalAgent ? `Personal agent: ${personalAgent.name}` : "No personal agent yet"}</small></div></div>
    <form className="network-wallet-form" onSubmit={saveWallet}><label>Personal network wallet <small>(optional; local claim only)</small><input value={personalWallet} onChange={event => setPersonalWallet(event.target.value)} placeholder="0x…" aria-label="Personal network wallet" /></label><button className="secondary" disabled={busy}>Save wallet</button><p>Receipts involving this wallet can appear in your two-hop graph. Wallet control is not verified yet.</p></form>
    {mode === "overview" && error && <p className="onboard-error" role="alert">{error}</p>}
    <div className="onboard-choices"><button className={mode === "createOrg" ? "selected" : ""} onClick={() => choose("createOrg")}><span className="choice-icon org">O</span><strong>Create organization</strong><small>You become its first human member</small></button><button className={mode === "joinOrg" ? "selected" : ""} onClick={() => choose("joinOrg")}><span className="choice-icon org">O</span><strong>Join organization</strong><small>Use an invitation code</small></button><button className={mode === "createAgent" ? "selected" : ""} onClick={() => choose("createAgent")} disabled={!agentOptions.length}><span className="choice-icon agent">A</span><strong>Create agent</strong><small>{agentOptions.length ? "One per human or organization" : "All your principal slots are used"}</small></button></div>
    {mode !== "overview" && <div className="onboard-panel"><form className="onboard-form" onSubmit={submit}>
      <h3>{mode === "createOrg" ? "Create an organization" : mode === "joinOrg" ? "Join an organization" : "Create an agent account"}</h3>
      {mode === "joinOrg" ? <><p className="account-hint">Ask an organization founder for its invitation code. For the demo, use <strong>{data?.demoInviteCode || "NORTHSTAR-DEMO"}</strong>.</p><label>Invitation code<input value={inviteCode} onChange={event => setInviteCode(event.target.value)} required /></label></> : <>
        {mode === "createAgent" && <label>Represented by<select value={ownerId} onChange={event => setOwnerId(event.target.value)} required>{agentOptions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
        <label>{mode === "createOrg" ? "Organization name" : "Agent name"}<input value={name} onChange={event => setName(event.target.value)} required /></label>
        <label>Handle<input value={handle} onChange={event => setHandle(event.target.value.toLowerCase())} placeholder="letters_numbers" required /></label>
        <label>{mode === "createOrg" ? "Organization principal wallet" : "Agent signing wallet"} <small>(optional in local demo)</small><input value={wallet} onChange={event => setWallet(event.target.value)} placeholder="0x…" /></label>
        {mode === "createAgent" && <><label>Capability<input value={capability} onChange={event => setCapability(event.target.value)} required /></label><label>Contact endpoint <small>(optional)</small><input value={endpoint} onChange={event => setEndpoint(event.target.value)} placeholder="https://example.org/agent" /></label></>}
        {mode === "createOrg" && <p className="account-hint">Your human membership is created together with the organization. Only founders can create organization agents in this demo.</p>}
      </>}
      {error && <p className="onboard-error" role="alert">{error}</p>}
      <div className="onboard-actions"><button type="button" className="secondary" onClick={() => choose("overview")}>Cancel</button><button className="primary" disabled={busy}>{busy ? "Saving…" : mode === "createOrg" ? "Create organization" : mode === "joinOrg" ? "Join organization" : "Create agent"}</button></div>
    </form></div>}
    {message && <p className="account-success" role="status">{message}</p>}
    <section className="onboard-directory"><h3>Organizations you belong to</h3>{data?.organizations.length ? data.organizations.map(org => <div className="onboard-identity" key={org.id}><span className="choice-icon org">O</span><div><strong>{org.name}</strong><small>@{org.handle} · {org.memberCount} human {org.memberCount === 1 ? "member" : "members"}{org.founderId === human.id ? " · you founded this" : ""}</small>{org.founderId === human.id && <small>Invitation code: {org.inviteCode}</small>}<small>{data.agents.find(agent => agent.ownerId === org.id)?.name || "No organization agent shown"}</small></div></div>) : <p>You have not joined an organization yet.</p>}</section>
    <p className="account-hint">These accounts are stored in the local prototype database. Personhood, wallet control, and official on-chain agent registration are not verified by this flow.</p>
  </section>;
}

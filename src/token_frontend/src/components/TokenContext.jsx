// src/context/TokenContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";
import {
  createActor as createTokenActor,
  canisterId as TOKEN_ID,
} from "declarations/token_backend";

const TokenCtx = createContext(null);
export function useToken() {
  const ctx = useContext(TokenCtx);
  if (!ctx) throw new Error("useToken must be used within <TokenProvider>");
  return ctx;
}

function isLocalHost() {
  return (
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname.endsWith(".localhost")
  );
}

async function makeAgent(identity) {
  const host = isLocalHost()
    ? `${location.protocol}//${location.host}` // works for Vite & asset-canister
    : "https://icp0.io";
  const agent = new HttpAgent({ host, identity });
  if (isLocalHost()) await agent.fetchRootKey();
  return agent;
}

// strict BigInt parser for NAT amounts
function toNatBigInt(v) {
  const s = String(v ?? "").trim();
  if (!/^\d+$/.test(s)) throw new Error("Amount must be a whole number (nat).");
  return BigInt(s);
}

export function TokenProvider({ children }) {
  const [actor, setActor] = useState(null);
  const [me, setMe] = useState("hil7f-stbsb-xxofu-iuqoh-g4kg6-qntar-n3zz5-ldbk2-nwf37-e5exb-hae"); // shown in UI; not the same as caller unless II login
  // You said token is always initialized; keep this true to simplify UI
  const [initialized] = useState(true);

  const [meta, setMeta] = useState({ name: "Hero", symbol: "HERO", decimals: 8 });
  const [creator, setCreator] = useState("");
  const [supply, setSupply] = useState(0n);

  // Build anonymous actor on load
  useEffect(() => {
    (async () => {
      const agent = await makeAgent(undefined);
      const a = createTokenActor(TOKEN_ID, { agent });
      setActor(a);
    })().catch(console.error);
  }, []);

  // Load chain data when actor is ready
  useEffect(() => {
    if (!actor) return;
    (async () => {
      try {
        // If you added current_user() on the backend, prefer it to populate "me"
        if (typeof actor.current_user === "function") {
          try {
            const p = await actor.current_user();
            const txt = typeof p?.toText === "function" ? p.toText() : String(p);
            if (me === "hil7f-stbsb-xxofu-iuqoh-g4kg6-qntar-n3zz5-ldbk2-nwf37-e5exb-hae" && txt) setMe(txt);
          } catch { /* ignore if not available */ }
        }

        await refreshChain();
      } catch (e) {
        console.error("Initial chain load failed:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor]);

  async function refreshChain() {
    if (!actor) return;
    const [m, c, ts] = await Promise.all([
      actor.get_metadata(),
      actor.get_creator(),
      actor.total_supply(),
    ]);
    setMeta(m);
    setCreator(c.toText());
    setSupply(BigInt(ts)); // Candid Nat/u128 -> JS BigInt
  }

  async function refreshSupply() {
    if (!actor) return;
    const ts = await actor.total_supply();
    setSupply(BigInt(ts));
  }

  async function getBalance(pText) {
    if (!actor || !pText) return 0n;
    const p = Principal.fromText(pText);
    const n = await actor.balance_of(p);
    return BigInt(n);
  }

  /** Transfer tokens to another principal */
  async function transfer(to, amount) {
    if (!actor) throw new Error("Actor not ready");
    const toPrincipal = Principal.fromText(to);
    const amt = toNatBigInt(amount);
    const res = await actor.transfer(toPrincipal, amt);
    if ("Err" in res) return { ok: false, err: res.Err };
    await refreshSupply();
    return { ok: true };
  }

  /** Mint tokens (only creator can do this) */
  async function mint(to, amount) {
    if (!actor) throw new Error("Actor not ready");
    const toPrincipal = Principal.fromText(to);
    const amt = toNatBigInt(amount);
    const res = await actor.mint(toPrincipal, amt);
    if ("Err" in res) return { ok: false, err: res.Err };
    await refreshSupply();
    return { ok: true };
  }

  /** Show a specific principal in UI (does NOT change caller identity) */
  async function loginWithPrincipal(text) {
    const trimmed = (text || "").trim();
    if (!trimmed) throw new Error("Principal cannot be empty");
    setMe(trimmed);
    try { await getBalance(trimmed); } catch {}
  }

  /** Real auth: rebuild actor with Internet Identity (changes caller identity seen by canister) */
  async function loginWithII(providedClient) {
    const client = providedClient || (await AuthClient.create());
    if (!providedClient) {
      await new Promise((resolve, reject) =>
        client.login({
          identityProvider: isLocalHost()
            ? "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943"
            : "https://identity.ic0.app",
          onSuccess: resolve,
          onError: reject,
        })
      );
    }

    const identity = client.getIdentity();
    const agent = await makeAgent(identity);
    const authedActor = createTokenActor(TOKEN_ID, { agent });
    setActor(authedActor);

    const principalText = identity.getPrincipal().toText();
    setMe(principalText);

    try { await refreshChain(); } catch {}
  }

  /** Logout: go back to anonymous and rebuild actor */
  async function logout() {
    const agent = await makeAgent(undefined);
    const anonActor = createTokenActor(TOKEN_ID, { agent });
    setActor(anonActor);
    setMe("2vxsx-fae");
  }

  const value = {
    actor,
    me,
    setMe,
    initialized,
    meta,
    creator,
    supply,
    refreshChain,
    refreshSupply,
    getBalance,
    transfer,
    mint,
    Principal,
    loginWithPrincipal,
    loginWithII,
    logout,
  };

  return <TokenCtx.Provider value={value}>{children}</TokenCtx.Provider>;
}

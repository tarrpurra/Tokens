// src/services/tokenApi.icp.js
import { HttpAgent, Actor } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

// ------- Canister ID resolution -------
let CANISTER_ID = import.meta.env.VITE_TOKEN_CANISTER_ID || "";

async function resolveCanisterId() {
  if (CANISTER_ID) return CANISTER_ID;

  // Fallback when served from an asset canister: dfx exposes this file
  try {
    const res = await fetch("/.well-known/canister-ids.json");
    if (res.ok) {
      const ids = await res.json();
      const net = location.hostname.includes("localhost") ? "local" : "ic";
      CANISTER_ID = ids["token_backend"]?.[net] || "";
    }
  } catch (_) {}

  if (!CANISTER_ID) {
    throw new Error(
      "Canister ID is required. Set VITE_TOKEN_CANISTER_ID in .env (root of the UI project) " +
      "or serve /.well-known/canister-ids.json from an asset canister."
    );
  }
  return CANISTER_ID;
}

// ------- IDL matches your Rust canister -------
const idlFactory = ({ IDL }) => {
  const Metadata = IDL.Record({
    name: IDL.Text,
    symbol: IDL.Text,
    decimals: IDL.Nat8,
  });
  return IDL.Service({
    get_metadata: IDL.Func([], [Metadata], ["query"]),
    total_supply: IDL.Func([], [IDL.Nat], ["query"]),
    balance_of: IDL.Func([IDL.Principal], [IDL.Nat], ["query"]),
    transfer: IDL.Func([IDL.Principal, IDL.Nat], [IDL.Variant({ Ok: IDL.Null, Err: IDL.Text })], []),
    mint: IDL.Func([IDL.Principal, IDL.Nat], [IDL.Variant({ Ok: IDL.Null, Err: IDL.Text })], []),
    get_creator: IDL.Func([], [IDL.Principal], ["query"]),
  });
};

let _actor;
async function getActor() {
  if (_actor) return _actor;

  const isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname.endsWith(".localhost");

  // Use the page’s origin for local (works for Vite and <canister>.localhost:4943)
  const host = isLocal ? `${location.protocol}//${location.host}` : "https://icp0.io";

  const agent = new HttpAgent({ host });

  // Always fetch root key in local dev BEFORE any calls
  if (isLocal) {
    await agent.fetchRootKey();
  }

  const canisterId = await resolveCanisterId();
  _actor = Actor.createActor(idlFactory, { agent, canisterId });
  return _actor;
}

// -------- Public API (same shape as the mock) --------
export async function tokenMeta() {
  const actor = await getActor();
  const m = await actor.get_metadata();
  const creator = (await actor.get_creator()).toText();
  return { ...m, creator };
}

export async function getTotalSupply() {
  const actor = await getActor();
  return BigInt(await actor.total_supply());
}

export async function getBalance(userId) {
  const actor = await getActor();
  const p = Principal.fromText(userId);
  return BigInt(await actor.balance_of(p));
}

export async function transfer({ to, amount }) {
  const actor = await getActor();
  const res = await actor.transfer(Principal.fromText(to), BigInt(amount));
  if ("Err" in res) return { ok: false, err: res.Err };
  return { ok: true };
}

export async function mint({ to, amount }) {
  const actor = await getActor();
  const res = await actor.mint(Principal.fromText(to), BigInt(amount));
  if ("Err" in res) return { ok: false, err: res.Err };
  return { ok: true };
}

export async function loginAs() { return { ok: true, currentUser: getCurrentUser() }; }
export function getCurrentUser() { return "2vxsx-fae"; }
export async function getCreator() {
  const actor = await getActor();
  return (await actor.get_creator()).toText();
}
export async function listHolders() { return []; }

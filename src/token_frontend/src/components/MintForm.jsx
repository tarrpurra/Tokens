import React, { useState } from "react";
import { useToken } from "./TokenContext";

export default function MintForm() {
  const { actor, creator, Principal, refreshSupply, me, getBalance } = useToken();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  async function onMint() {
    if (!actor) return alert("Actor not ready yet.");
    setBusy(true);
    try {
      const res = await actor.mint(Principal.fromText(to), BigInt(amount || "0"));
      if ("Err" in res) return alert(`❌ ${res.Err}`);
      await Promise.all([refreshSupply(), getBalance(me)]);
      alert(`✅ Minted ${amount} to ${to} ${creator}`);
    } catch (e) {
      alert(`❌ ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Mint Tokens (Creator Only)</h3>
      <div className="text-xs text-gray-500 mb-3">
        Creator principal: <span className="font-mono">{creator || "…"}</span>
      </div>
      <label className="block text-sm text-gray-600 mb-1">Recipient Principal</label>
      <input
        className="w-full border rounded px-3 py-2 mb-3"
        placeholder="w7x7r-cok77-xa..."
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <label className="block text-sm text-gray-600 mb-1">Amount (nat)</label>
      <input
        className="w-full border rounded px-3 py-2 mb-4"
        placeholder="500"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button
        className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-60"
        onClick={onMint}
        disabled={busy}
      >
        {busy ? "Minting…" : "Mint"}
      </button>
      <p className="text-xs text-gray-500 mt-2">Only the creator can mint — the canister enforces this.</p>
    </div>
  );
}

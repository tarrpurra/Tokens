import React, { useState } from "react";
import { useToken } from "./TokenContext";

export default function TransferForm() {
  const { actor, refreshSupply, me, Principal, getBalance } = useToken();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSend() {
    if (!actor) return alert("Actor not ready yet.");
    setBusy(true);
    try {
      const res = await actor.transfer(Principal.fromText(to), BigInt(amount || "0"));
      if ("Err" in res) return alert(`❌ ${res.Err}`);
      await Promise.all([refreshSupply(), getBalance(me)]);
      alert("✅ Transfer successful!");
    } catch (e) {
      alert(`❌ ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Transfer Tokens</h3>
      <label className="block text-sm text-gray-600 mb-1">Receiver Principal</label>
      <input
        className="w-full border rounded px-3 py-2 mb-3"
        placeholder="w7x7r-cok77-xa..."
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <label className="block text-sm text-gray-600 mb-1">Amount (nat)</label>
      <input
        className="w-full border rounded px-3 py-2 mb-4"
        placeholder="100"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
        onClick={onSend}
        disabled={busy}
      >
        {busy ? "Sending…" : "Send"}
      </button>
      <p className="text-xs text-gray-500 mt-2">Calls are made by your browser identity (default anonymous).</p>
    </div>
  );
}

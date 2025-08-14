import React, { useState } from "react";
import { useToken } from "./TokenContext";

export default function InitGate({ children }) {
  const { initialized, initializeToken } = useToken();
  const [form, setForm] = useState({
    name: "EduCoin",
    symbol: "EDU",
    decimals: 8,
    initial_supply: "1000000",
    creator: "", // leave blank to use the caller
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (initialized) return children;

  async function onInit() {
    setBusy(true);
    setErr("");
    try {
      const res = await initializeToken({
        ...form,
        initial_supply: form.initial_supply.replace(/[^\d]/g, ""), // digits only
      });
      if (!res.ok) setErr(res.err || "Init failed");
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Initialize Token</h2>
      <div className="grid grid-cols-1 gap-3">
        <L label="Name">
          <input className="border rounded px-3 py-2 w-full"
            value={form.name}
            onChange={(e)=>setForm(f=>({...f, name:e.target.value}))}/>
        </L>
        <L label="Symbol">
          <input className="border rounded px-3 py-2 w-full"
            value={form.symbol}
            onChange={(e)=>setForm(f=>({...f, symbol:e.target.value}))}/>
        </L>
        <L label="Decimals">
          <input className="border rounded px-3 py-2 w-full"
            type="number" min="0" max="18"
            value={form.decimals}
            onChange={(e)=>setForm(f=>({...f, decimals:e.target.value}))}/>
        </L>
        <L label="Initial Supply (nat)">
          <input className="border rounded px-3 py-2 w-full"
            inputMode="numeric"
            value={form.initial_supply}
            onChange={(e)=>setForm(f=>({...f, initial_supply:e.target.value}))}/>
        </L>
        <L label="Creator (optional)">
          <input className="border rounded px-3 py-2 w-full"
            placeholder='Leave empty to use caller'
            value={form.creator}
            onChange={(e)=>setForm(f=>({...f, creator:e.target.value}))}/>
        </L>

        {err && <div className="text-red-600 text-sm">❌ {err}</div>}

        <div className="pt-2">
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            onClick={onInit}
            disabled={busy}
          >
            {busy ? "Initializing…" : "Initialize Token"}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            This calls <code>manual_init</code>. It will succeed only once; subsequent attempts will return “Already initialized”.
          </p>
        </div>
      </div>
    </div>
  );
}

function L({label, children}) {
  return (
    <label className="block">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      {children}
    </label>
  );
}

import React, { useState } from "react";
import { useToken } from "./TokenContext";

export default function TotalSupplyCard() {
  const { supply, refreshSupply } = useToken();
  const [busy, setBusy] = useState(false);

  async function onRefresh() {
    setBusy(true);
    try { await refreshSupply(); } finally { setBusy(false); }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Total Supply</h3>
      <div className="text-3xl font-bold">{supply.toString()}</div>
      <button
        className="mt-3 px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-60"
        onClick={onRefresh}
        disabled={busy}
      >
        {busy ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}

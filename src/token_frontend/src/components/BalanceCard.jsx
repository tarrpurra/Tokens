import React, { useEffect, useState } from "react";
import { useToken } from "./TokenContext";

export default function BalanceCard() {
  const { me, getBalance } = useToken();
  const [bal, setBal] = useState(0n);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!me) return;
    setLoading(true);
    try {
      const b = await getBalance(me);
      setBal(b);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [me]);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Your Balance</h3>
      <div className="text-3xl font-bold">{bal.toString()}</div>
      <div className="text-xs text-gray-500 mt-1">Principal: <span className="font-mono">{me}</span></div>
      <button
        className="mt-3 px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-60"
        onClick={refresh}
        disabled={loading}
      >
        {loading ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}

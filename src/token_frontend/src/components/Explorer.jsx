import React, { useState } from "react";
import { useToken } from "./TokenContext";

export default function Explorer() {
  const { actor, Principal } = useToken();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);

  async function onSearch() {
    if (!actor || !query) return;
    try {
      const p = Principal.fromText(query);
      const bal = await actor.balance_of(p);
      setRows([{ id: query, balance: BigInt(bal) }]);
    } catch (e) {
      alert(`❌ ${e.message || e}`);
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Holders Explorer</h3>
      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Enter principal to lookup"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200" onClick={onSearch}>
          Search
        </button>
      </div>

      <table className="w-full text-left border">
        <thead className="bg-gray-100 text-gray-600 text-sm">
          <tr>
            <th className="p-2 border">Principal</th>
            <th className="p-2 border">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td className="p-3 text-gray-500" colSpan={2}>No results.</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id}>
                <td className="p-2 font-mono border">{r.id}</td>
                <td className="p-2 border">{r.balance.toString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p className="text-xs text-gray-500 mt-2">
        Your canister doesn’t expose a full holders list; this tool checks a single principal’s balance.
      </p>
    </div>
  );
}

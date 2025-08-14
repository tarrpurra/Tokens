import { useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { TokenProvider, useToken } from "./components/TokenContext";

import BalanceCard from "./components/BalanceCard";
import Explorer from "./components/Explorer";
import MintForm from "./components/MintForm";
import TotalSupplyCard from "./components/TotalSupplyCard";
import TransferForm from "./components/TransferForm";

// Use component references, not <Elements />
const tabs = [
  { name: "Balance", component: BalanceCard },
  { name: "Mint", component: MintForm },
  { name: "Transfer", component: TransferForm },
  { name: "Explorer", component: Explorer },
  { name: "Total Supply", component: TotalSupplyCard },
];

export default function App() {
  // Provider must wrap any component that calls useToken()
  return (
    <TokenProvider>
      <Shell />
    </TokenProvider>
  );
}

function Shell() {
  const [activeTab, setActiveTab] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const { me, logout } = useToken(); // safe here (inside provider)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <HeaderBrand />
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
              onClick={() => setShowLogin(true)}
            >
              Login
            </button>
            {me !== "2vxsx-fae" && (
              <button
                className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 transition"
                onClick={logout}
              >
                Logout
              </button>
            )}
          </div>
        </div>

        <div className="flex space-x-2 mb-6 justify-center">
          {tabs.map((tab, idx) => (
            <button
              key={tab.name}
              className={`px-4 py-2 rounded-t-lg font-semibold focus:outline-none transition-colors duration-200 ${
                activeTab === idx
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white text-blue-600 border-b-2 border-blue-600 hover:bg-blue-50"
              }`}
              onClick={() => setActiveTab(idx)}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-b-lg shadow p-6 min-h-[300px]">
          <ActiveTab activeIndex={activeTab} />
        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}

function ActiveTab({ activeIndex }) {
  const TabComp = tabs[activeIndex].component;
  return <TabComp />;
}

function HeaderBrand() {
  const { meta, creator } = useToken();
  console.log(creator);
  console.log(meta);
  return (
    <div>
      <div className="text-xl font-bold">
        {meta.name || "Token"}{" "}
        <span className="text-sm text-gray-500">({meta.symbol || "SYM"})</span>
      </div>
      <div className="text-xs text-gray-500">
        Decimals: {meta.decimals ?? 0} · Creator:{" "}

        <span className="font-mono">{creator || "…"}</span>
      </div>
    </div>
  );
}

/** Minimal login modal: lets user set principal text (no II here). */
function LoginModal({ onClose }) {
  const { me, setMe, getBalance } = useToken();
  const [value, setValue] = useState(me || "2vxsx-fae");
  const [iiLoading, setIiLoading] = useState(false);

  async function apply() {
    const text = value.trim();
    setMe(text);
    try {
      await getBalance(text); // warm-up call (optional)
    } catch {}
    onClose();
  }

  async function handleInternetIdentity() {
    setIiLoading(true);
    const authClient = await AuthClient.create();
    await authClient.login({
      identityProvider: "https://identity.ic0.app",
      onSuccess: async () => {
        const principal = authClient.getIdentity().getPrincipal().toText();
        setMe(principal);
        try {
          await getBalance(principal);
        } catch {}
        setIiLoading(false);
        onClose();
      },
      onError: () => {
        setIiLoading(false);
      },
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-3">
          Login using ICP Principal
        </h3>
        <input
          className="w-full border rounded px-3 py-2 mb-4"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter your ICP principal (e.g., w7x7r-cok77-xa...)"
        />
        <div className="flex justify-end gap-2 mb-2">
          <button className="px-4 py-2 rounded bg-gray-100" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white"
            onClick={apply}
          >
            Login with Principal
          </button>
        </div>
        <button
          className="w-full px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
          onClick={handleInternetIdentity}
          disabled={iiLoading}
        >
          {iiLoading ? "Redirecting..." : "Login with Internet Identity"}
        </button>
        <p className="text-xs text-gray-500 mt-3">
          Enter your ICP principal to log in. Use{" "}
          <code className="font-mono">2vxsx-fae</code> for anonymous access.
          <br />
          Or use Internet Identity for secure authentication.
        </p>
      </div>
    </div>
  );
}

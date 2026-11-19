import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import Admin from "./Admin";
import Public from "./Public";

export default function App() {
  const [tab, setTab] = useState("public");
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h1>Certificats académiques</h1>
      <nav>
        <button onClick={() => setTab("public")}>Vérification publique</button>
        <button onClick={() => setTab("admin")}>Administration</button>
      </nav>
      <div style={{ margin: "12px 0" }}>
        {isConnected
          ? <>Connecté : {address} <button onClick={() => disconnect()}>Déconnecter</button></>
          : <button onClick={() => connect({ connector: connectors[0] })}>Connecter le wallet</button>}
      </div>
      {tab === "public" ? <Public /> : <Admin />}
    </div>
  );
}
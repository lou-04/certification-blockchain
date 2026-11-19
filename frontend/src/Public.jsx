import { useState } from "react";
import { useReadContract } from "wagmi";
import { ABI, CONTRACT_ADDRESS } from "./wagmi";

export default function Public() {
  const [id, setId] = useState("");
  const [search, setSearch] = useState(null);

  const { data: cert, error, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS, abi: ABI, functionName: "getCertificate",
    args: search ? [BigInt(search)] : undefined,
    query: { enabled: !!search, retry: false },
  });

  return (
    <section>
      <h2>Vérifier un certificat</h2>
      <input type="number" min="1" placeholder="certId" value={id} onChange={(e) => setId(e.target.value)} />
      <button onClick={() => setSearch(id)}>Rechercher</button>
      {isLoading && <p>Chargement…</p>}
      {error && <p style={{ color: "red" }}>Certificat introuvable.</p>}
      {cert && (
        <ul>
          <li>Nom : {cert.studentName}</li>
          <li>Diplôme : {cert.diplomaTitle}</li>
          <li>Date : {cert.issueDate}</li>
          <li>Mention : {cert.grade}</li>
          <li>Statut : {cert.revoked ? "❌ Révoqué" : "✅ Valide"}</li>
        </ul>
      )}
    </section>
  );
}
import { useState } from "react";
import { useReadContract } from "wagmi";
import { ABI, CONTRACT_ADDRESS } from "./wagmi";

export default function Public() {
  const [id, setId] = useState("");
  const [search, setSearch] = useState(null);
  const args = search ? [BigInt(search)] : undefined;
  const q = { enabled: !!search, retry: false };
  const base = { address: CONTRACT_ADDRESS, abi: ABI, args, query: q };

  const { data: cert, error } = useReadContract({ ...base, functionName: "getCertificate" });
  const { data: uri } = useReadContract({ ...base, functionName: "tokenURI" });
  const { data: owner } = useReadContract({ ...base, functionName: "ownerOf" });

  return (
    <section>
      <h2>Vérifier un certificat</h2>
      <input type="number" min="1" placeholder="tokenId" value={id} onChange={(e) => setId(e.target.value)} />
      <button onClick={() => setSearch(id)}>Rechercher</button>
      {error && <p style={{ color: "red" }}>Certificat introuvable.</p>}
      {cert && (
        <ul>
          <li>tokenId : {search}</li>
          <li>Nom : {cert.studentName}</li>
          <li>Diplôme : {cert.diplomaTitle}</li>
          <li>Date : {cert.issueDate}</li>
          <li>Mention : {cert.grade}</li>
          <li>Propriétaire : {owner}</li>
          <li>Statut : {cert.revoked ? "❌ Révoqué" : "✅ Valide"}</li>
          <li>tokenURI : <code style={{ wordBreak: "break-all" }}>{uri}</code></li>
        </ul>
      )}
    </section>
  );
}
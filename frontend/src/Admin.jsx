import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import * as XLSX from "xlsx";
import { isAddress, keccak256, toBytes } from "viem";
import { ABI, CONTRACT_ADDRESS } from "./wagmi";

const MINTER_ROLE = keccak256(toBytes("MINTER_ROLE"));
const REQUIRED = ["studentName", "studentId", "diplomaTitle", "issueDate", "grade"];
const BATCH_SIZE = 10;

// Métadonnées ERC-721 encodées dans une data-URI (pas besoin d'IPFS en local)
function buildUri(r) {
  const meta = {
    name: `${r.diplomaTitle} - ${r.studentName}`,
    description: "Certificat académique",
    attributes: [
      { trait_type: "studentId", value: r.studentId },
      { trait_type: "issueDate", value: r.issueDate },
      { trait_type: "grade", value: r.grade },
    ],
  };
  return "data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(meta))));
}

function validateRow(r) {
  const errors = [];
  REQUIRED.forEach((k) => { if (!r[k]) errors.push(`${k} manquant`); });
  if (r.issueDate && !/^\d{4}-\d{2}-\d{2}$/.test(r.issueDate)) errors.push("issueDate doit être YYYY-MM-DD");
  if (r.recipientAddress && !isAddress(r.recipientAddress)) errors.push("adresse invalide");
  return errors;
}

function friendly(err) {
  const m = err.shortMessage || err.message || "";
  if (m.includes("AccessControlUnauthorizedAccount")) return "Ce compte n'a pas le rôle MINTER_ROLE.";
  if (m.includes("Already issued")) return "Un certificat existe déjà pour ce studentId.";
  if (m.includes("User rejected")) return "Transaction refusée dans le wallet.";
  return m;
}

export default function Admin() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [log, setLog] = useState([]);
  const addLog = (m) => setLog((l) => [...l, m]);

  const { data: isMinter } = useReadContract({
    address: CONTRACT_ADDRESS, abi: ABI, functionName: "hasRole",
    args: [MINTER_ROLE, address], query: { enabled: !!address },
  });

  const [form, setForm] = useState({ recipientAddress: "", studentName: "", studentId: "",
                                     diplomaTitle: "", issueDate: "", grade: "" });

  async function mintOne(e) {
    e.preventDefault();
    const errs = validateRow(form);
    if (errs.length) return addLog("Erreur : " + errs.join(", "));
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS, abi: ABI, functionName: "mintCertificate",
        args: [form.recipientAddress || address, form.studentName, form.studentId,
               form.diplomaTitle, form.issueDate, form.grade, buildUri(form)],
      });
      addLog("Tx envoyée : " + hash);
      await publicClient.waitForTransactionReceipt({ hash });
      addLog("✅ Confirmée : " + hash);
    } catch (err) { addLog("❌ " + friendly(err)); }
  }

  const [rows, setRows] = useState([]);

  async function onFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const wb = XLSX.read(await file.arrayBuffer());
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false, defval: "" });
    setRows(data.map((r) => {
      const errors = validateRow(r);
      return { ...r, errors, selected: errors.length === 0 };
    }));
  }

  const toggle = (i) => setRows((rs) => rs.map((r, k) => k === i && !r.errors.length ? { ...r, selected: !r.selected } : r));

  async function mintSelected() {
    const todo = rows.filter((r) => r.selected);
    for (let i = 0; i < todo.length; i += BATCH_SIZE) {
      const chunk = todo.slice(i, i + BATCH_SIZE);
      const n = i / BATCH_SIZE + 1;
      try {
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESS, abi: ABI, functionName: "batchMintCertificates",
          args: [
            chunk.map((r) => r.recipientAddress || address),
            chunk.map(buildUri),
            chunk.map((r) => r.studentName), chunk.map((r) => r.studentId),
            chunk.map((r) => r.diplomaTitle), chunk.map((r) => r.issueDate),
            chunk.map((r) => r.grade),
          ],
        });
        addLog(`Lot ${n} envoyé : ${hash}`);
        await publicClient.waitForTransactionReceipt({ hash });
        addLog(`✅ Lot ${n} confirmé`);
      } catch (err) { addLog(`❌ Lot ${n} : ` + friendly(err)); }
    }
  }

  return (
    <section>
      {address && isMinter === false && (
        <p style={{ color: "red" }}>⚠️ Ce compte n'a pas le rôle MINTER_ROLE : les émissions seront refusées.</p>
      )}
      <h2>Mint unitaire</h2>
      <form onSubmit={mintOne} style={{ display: "grid", gap: 6 }}>
        {Object.keys(form).map((k) => (
          <input key={k} placeholder={k === "recipientAddress" ? "recipientAddress (vide = votre wallet)" : k}
                 value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
        ))}
        <button type="submit">Émettre</button>
      </form>

      <h2>Import Excel / CSV</h2>
      <input type="file" accept=".xlsx,.csv" onChange={onFile} />
      {rows.length > 0 && (
        <>
          <table border="1" cellPadding="4">
            <thead><tr><th></th><th>Nom</th><th>ID</th><th>Diplôme</th><th>Date</th><th>Mention</th><th>Statut</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ background: r.errors.length ? "#fdd" : undefined }}>
                  <td><input type="checkbox" checked={r.selected} disabled={!!r.errors.length} onChange={() => toggle(i)} /></td>
                  <td>{r.studentName}</td><td>{r.studentId}</td><td>{r.diplomaTitle}</td>
                  <td>{r.issueDate}</td><td>{r.grade}</td>
                  <td>{r.errors.length ? r.errors.join(", ") : "OK"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={mintSelected}>Émettre les lignes sélectionnées</button>
        </>
      )}

      <h3>Journal</h3>
      <pre style={{ background: "#eee", padding: 8, whiteSpace: "pre-wrap" }}>{log.join("\n")}</pre>
    </section>
  );
}
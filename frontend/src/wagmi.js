import { http, createConfig } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { parseAbi } from "viem";

export const config = createConfig({
  chains: [hardhat, sepolia],
  connectors: [injected()],
  transports: { [hardhat.id]: http("http://127.0.0.1:8545"), [sepolia.id]: http() },
});

// À remplacer par l'adresse de votre déploiement (idéalement via .env : import.meta.env.VITE_CONTRACT_ADDRESS)
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export const ABI = parseAbi([
  "function mintCertificate(address to,string studentName,string studentId,string diplomaTitle,string issueDate,string grade) returns (uint256)",
  "function batchMint(address[] recipients,string[] studentNames,string[] studentIds,string[] diplomaTitles,string[] issueDates,string[] grades)",
  "function revoke(uint256 certId)",
  "function getCertificate(uint256 certId) view returns ((string studentName,string studentId,string diplomaTitle,string issueDate,string grade,address recipient,bool revoked))",
]);
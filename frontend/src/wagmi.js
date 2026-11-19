import { http, createConfig } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { parseAbi } from "viem";

export const config = createConfig({
  chains: [hardhat, sepolia],
  connectors: [injected()],
  transports: { [hardhat.id]: http("http://127.0.0.1:8545"), [sepolia.id]: http() },
});


export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export const ABI = parseAbi([
  "function mintCertificate(address to,string studentName,string studentId,string diplomaTitle,string issueDate,string grade,string uri) returns (uint256)",
  "function batchMintCertificates(address[] to,string[] uris,string[] studentNames,string[] studentIds,string[] diplomaTitles,string[] issueDates,string[] grades)",
  "function revokeCertificate(uint256 tokenId)",
  "function getCertificate(uint256 tokenId) view returns ((string studentName,string studentId,string diplomaTitle,string issueDate,string grade,bool revoked))",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function hasRole(bytes32 role,address account) view returns (bool)",
  "error AccessControlUnauthorizedAccount(address account, bytes32 neededRole)",
]);
const hre = require("hardhat");

async function main() {
  const registry = await hre.ethers.deployContract("CertificateRegistry");
  await registry.waitForDeployment();
  console.log("CertificateRegistry déployé à :", await registry.getAddress());
}
main().catch((e) => { console.error(e); process.exit(1); });
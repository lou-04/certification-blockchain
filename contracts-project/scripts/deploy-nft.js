const hre = require("hardhat");

async function main() {
  const nft = await hre.ethers.deployContract("CertificateNFT");
  await nft.waitForDeployment();
  console.log("CertificateNFT déployé à :", await nft.getAddress());
}
main().catch((e) => { console.error(e); process.exit(1); });
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", () => {
  let registry, owner, other;

  beforeEach(async () => {
    [owner, other] = await ethers.getSigners();
    registry = await ethers.deployContract("CertificateRegistry");
  });

  const mint = (c = registry) =>
    c.mintCertificate(other.address, "Amina Benali", "2023-INF-042",
      "Licence Informatique", "2026-06-15", "Mention Bien");

  it("émet un certificat et l'event", async () => {
    await expect(mint()).to.emit(registry, "CertificateMinted")
      .withArgs(1, other.address, "2023-INF-042");
    const c = await registry.getCertificate(1);
    expect(c.studentName).to.equal("Amina Benali");
    expect(c.revoked).to.equal(false);
  });

  it("refuse un non-admin", async () => {
    await expect(mint(registry.connect(other))).to.be.revertedWith("Not authorized");
  });

  it("refuse un doublon", async () => {
    await mint();
    await expect(mint()).to.be.revertedWith("Already issued");
  });

  it("révoque un certificat", async () => {
    await mint();
    await registry.revoke(1);
    expect((await registry.getCertificate(1)).revoked).to.equal(true);
  });

  it("batchMint fonctionne", async () => {
    const a = other.address;
    await registry.batchMint([a, a], ["A", "B"], ["id1", "id2"],
      ["Licence", "Licence"], ["2026-06-15", "2026-06-15"], ["Bien", "Passable"]);
    expect(await registry.nextCertId()).to.equal(3);
  });
});
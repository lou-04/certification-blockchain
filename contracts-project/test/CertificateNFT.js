const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateNFT", () => {
  let nft, admin, minter, user;
  const URI = "data:application/json;base64,e30=";

  beforeEach(async () => {
    [admin, minter, user] = await ethers.getSigners();
    nft = await ethers.deployContract("CertificateNFT");
    await nft.grantRole(await nft.MINTER_ROLE(), minter.address);
  });

  const mint = (c = nft, id = "2023-INF-042", to = user.address) =>
    c.mintCertificate(to, "Amina Benali", id, "Licence Informatique", "2026-06-15", "Mention Bien", URI);

  it("mint réussi : NFT, owner, tokenURI, event", async () => {
    await expect(mint()).to.emit(nft, "CertificateMinted").withArgs(1, user.address, "2023-INF-042");
    expect(await nft.ownerOf(1)).to.equal(user.address);
    expect(await nft.tokenURI(1)).to.equal(URI);
    const c = await nft.getCertificate(1);
    expect(c.studentName).to.equal("Amina Benali");
    expect(c.revoked).to.equal(false);
  });

  it("accès refusé : non-minter ne peut pas mint", async () => {
    await expect(mint(nft.connect(user))).to.be.revertedWithCustomError(nft, "AccessControlUnauthorizedAccount");
  });

  it("double mint du même studentId bloqué", async () => {
    await mint();
    await expect(mint(nft, "2023-INF-042")).to.be.revertedWith("Already issued");
  });

  it("batch réussi", async () => {
    const a = user.address;
    await nft.batchMintCertificates([a, a], [URI, URI], ["A", "B"], ["id1", "id2"],
      ["Licence", "Licence"], ["2026-06-15", "2026-06-15"], ["Bien", "Passable"]);
    expect(await nft.ownerOf(2)).to.equal(a);
  });

  it("batch : tailles incohérentes refusées", async () => {
    await expect(nft.batchMintCertificates([user.address], [URI, URI], ["A"], ["id1"], ["L"], ["d"], ["g"]))
      .to.be.revertedWith("Array length mismatch");
  });

  it("batch : un doublon annule tout le lot", async () => {
    const a = user.address;
    await expect(nft.batchMintCertificates([a, a], [URI, URI], ["A", "B"], ["id1", "id1"],
      ["L", "L"], ["d", "d"], ["g", "g"])).to.be.revertedWith("Already issued");
    expect(await nft.balanceOf(a)).to.equal(0);
  });

  it("revoke : flag + event", async () => {
    await mint();
    await expect(nft.revokeCertificate(1)).to.emit(nft, "CertificateRevoked").withArgs(1);
    expect((await nft.getCertificate(1)).revoked).to.equal(true);
  });

  it("revoke : un minter simple ne peut pas révoquer", async () => {
    await mint();
    await expect(nft.connect(minter).revokeCertificate(1))
      .to.be.revertedWithCustomError(nft, "AccessControlUnauthorizedAccount");
  });

  it("revoke : double révocation refusée", async () => {
    await mint();
    await nft.revokeCertificate(1);
    await expect(nft.revokeCertificate(1)).to.be.revertedWith("Already revoked");
  });

  it("validation : adresse zéro et studentId vide refusés", async () => {
    await expect(mint(nft, "x", ethers.ZeroAddress)).to.be.revertedWith("Zero address");
    await expect(mint(nft, "")).to.be.revertedWith("studentId required");
  });

  it("ERC-721 : supportsInterface", async () => {
    expect(await nft.supportsInterface("0x80ac58cd")).to.equal(true);
  });
});
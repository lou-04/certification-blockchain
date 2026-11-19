// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CertificateNFT is ERC721URIStorage, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public constant MAX_BATCH = 20;

    struct Certificate {
        string studentName;
        string studentId;
        string diplomaTitle;
        string issueDate;
        string grade;
        bool revoked;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 => Certificate) private _certificates;
    mapping(bytes32 => bool) private _studentIdUsed;

    event CertificateMinted(uint256 indexed tokenId, address indexed recipient, string studentId);
    event CertificateRevoked(uint256 indexed tokenId);

    constructor() ERC721("Academic Certificate", "CERT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    // ---------- Écriture ----------
    function mintCertificate(
        address to,
        string calldata studentName,
        string calldata studentId,
        string calldata diplomaTitle,
        string calldata issueDate,
        string calldata grade,
        string calldata uri
    ) external onlyRole(MINTER_ROLE) nonReentrant returns (uint256) {
        return _issue(to, studentName, studentId, diplomaTitle, issueDate, grade, uri);
    }

    function batchMintCertificates(
        address[] calldata to,
        string[] calldata uris,
        string[] calldata studentNames,
        string[] calldata studentIds,
        string[] calldata diplomaTitles,
        string[] calldata issueDates,
        string[] calldata grades
    ) external onlyRole(MINTER_ROLE) nonReentrant {
        uint256 n = to.length;
        require(n > 0 && n <= MAX_BATCH, "Invalid batch size");
        require(
            uris.length == n && studentNames.length == n && studentIds.length == n &&
            diplomaTitles.length == n && issueDates.length == n && grades.length == n,
            "Array length mismatch"
        );
        for (uint256 i = 0; i < n; i++) {
            _issue(to[i], studentNames[i], studentIds[i], diplomaTitles[i], issueDates[i], grades[i], uris[i]);
        }
    }

    function revokeCertificate(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _requireOwned(tokenId);
        require(!_certificates[tokenId].revoked, "Already revoked");
        _certificates[tokenId].revoked = true;
        emit CertificateRevoked(tokenId);
    }

    // ---------- Lecture ----------
    function getCertificate(uint256 tokenId) external view returns (Certificate memory) {
        _requireOwned(tokenId);
        return _certificates[tokenId];
    }

    // ---------- Interne ----------
    function _issue(
        address to,
        string calldata studentName,
        string calldata studentId,
        string calldata diplomaTitle,
        string calldata issueDate,
        string calldata grade,
        string calldata uri
    ) internal returns (uint256 tokenId) {
        require(to != address(0), "Zero address");
        require(bytes(studentId).length > 0, "studentId required");
        require(bytes(studentName).length > 0, "studentName required");
        require(bytes(diplomaTitle).length > 0, "diplomaTitle required");

        bytes32 key = keccak256(bytes(studentId));
        require(!_studentIdUsed[key], "Already issued");

        // Effects d'abord, interaction externe (_safeMint) en dernier
        _studentIdUsed[key] = true;
        tokenId = _nextTokenId++;
        _certificates[tokenId] = Certificate(studentName, studentId, diplomaTitle, issueDate, grade, false);
        _setTokenURI(tokenId, uri);

        _safeMint(to, tokenId);
        emit CertificateMinted(tokenId, to, studentId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721URIStorage, AccessControl) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
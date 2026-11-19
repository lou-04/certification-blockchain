// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateRegistry is Ownable {
    struct Certificate {
        string studentName;
        string studentId;
        string diplomaTitle;
        string issueDate;
        string grade;
        address recipient;
        bool revoked;
    }

    uint256 public constant MAX_BATCH = 20;
    uint256 public nextCertId = 1;                 // les IDs commencent à 1

    mapping(uint256 => Certificate) private certificates;
    mapping(address => bool) public admins;
    mapping(bytes32 => bool) private alreadyIssued; // anti-doublon

    event CertificateMinted(uint256 indexed certId, address indexed recipient, string studentId);
    event CertificateRevoked(uint256 indexed certId);
    event AdminUpdated(address indexed admin, bool allowed);

    modifier onlyAdmin() {
        require(msg.sender == owner() || admins[msg.sender], "Not authorized");
        _;
    }

    constructor() Ownable(msg.sender) {}

    // ---------- Gestion des admins ----------
    function setAdmin(address account, bool allowed) external onlyOwner {
        admins[account] = allowed;
        emit AdminUpdated(account, allowed);
    }

    // ---------- Écriture ----------
    function mintCertificate(
        address to,
        string calldata studentName,
        string calldata studentId,
        string calldata diplomaTitle,
        string calldata issueDate,
        string calldata grade
    ) external onlyAdmin returns (uint256 certId) {
        certId = _mint(to, studentName, studentId, diplomaTitle, issueDate, grade);
    }

    function batchMint(
        address[] calldata recipients,
        string[] calldata studentNames,
        string[] calldata studentIds,
        string[] calldata diplomaTitles,
        string[] calldata issueDates,
        string[] calldata grades
    ) external onlyAdmin {
        uint256 n = recipients.length;
        require(n > 0 && n <= MAX_BATCH, "Invalid batch size");
        require(
            studentNames.length == n && studentIds.length == n &&
            diplomaTitles.length == n && issueDates.length == n && grades.length == n,
            "Array length mismatch"
        );
        for (uint256 i = 0; i < n; i++) {
            _mint(recipients[i], studentNames[i], studentIds[i], diplomaTitles[i], issueDates[i], grades[i]);
        }
    }

    function revoke(uint256 certId) external onlyAdmin {
        require(_exists(certId), "Certificate not found");
        require(!certificates[certId].revoked, "Already revoked");
        certificates[certId].revoked = true;
        emit CertificateRevoked(certId);
    }

    // ---------- Lecture (view = gratuit, pas de transaction) ----------
    function getCertificate(uint256 certId) external view returns (Certificate memory) {
        require(_exists(certId), "Certificate not found");
        return certificates[certId];
    }

    // ---------- Interne ----------
    function _exists(uint256 certId) internal view returns (bool) {
        return certId > 0 && certId < nextCertId;
    }

    function _mint(
        address to,
        string calldata studentName,
        string calldata studentId,
        string calldata diplomaTitle,
        string calldata issueDate,
        string calldata grade
    ) internal returns (uint256 certId) {
        require(bytes(studentId).length > 0, "studentId required");
        // Un même étudiant peut avoir plusieurs diplômes, mais pas deux fois le même
        bytes32 key = keccak256(abi.encode(studentId, diplomaTitle));
        require(!alreadyIssued[key], "Already issued");
        alreadyIssued[key] = true;

        certId = nextCertId++;
        certificates[certId] = Certificate(
            studentName, studentId, diplomaTitle, issueDate, grade, to, false
        );
        emit CertificateMinted(certId, to, studentId);
    }
}
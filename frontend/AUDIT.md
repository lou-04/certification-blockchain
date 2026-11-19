# Rapport d'audit simplifié : CertificateNFT

**Périmètre :** `contracts-project/contracts/CertificateNFT.sol` (Solidity ^0.8.20, OpenZeppelin v5)
**Méthode :** revue manuelle selon la checklist du sujet + tests unitaires Hardhat. Aucun outil d'analyse statique n'a été utilisé.

## 1. Checklist

| Exigence | Statut | Preuve |
|---|---|---|
| Accès strict mint / revoke | ✅ | `onlyRole(MINTER_ROLE)` pour mint, `onlyRole(DEFAULT_ADMIN_ROLE)` pour revoke ; tests « accès refusé » |
| Events `CertificateMinted` / `CertificateRevoked` (tokenId indexed) | ✅ | Events déclarés avec `tokenId indexed` ; tests avec `.emit` |
| Pas de reentrancy sur le mint | ✅ (par conception) | `nonReentrant` + état écrit avant `_safeMint` |
| Validation des inputs | ✅ | Adresse nulle refusée ; `studentId`, nom et diplôme non vides ; test de validation |
| Pas de double mint du même `studentId` | ✅ | Mapping de hash `_studentIdUsed` ; test « double mint bloqué » |
| Révocation claire (flag + event) | ✅ | Champ `revoked` + event `CertificateRevoked` ; test revoke |
| Solidity ≥ 0.8.x | ✅ | `^0.8.20` (protection native contre les overflows) |
| Tests : mint, accès refusé, batch, revoke, double mint | ✅ | `test/CertificateNFT.js` |

## 2. Constats

| # | Sévérité | Constat | Recommandation |
|---|---|---|---|
| 1 | Moyenne | Le compte `DEFAULT_ADMIN_ROLE` est un point de défaillance unique : si sa clé est volée, un attaquant peut révoquer des certificats et attribuer des rôles | Utiliser un multisig (Safe) en production |
| 2 | Moyenne | Les certificats sont **transférables** (ERC-721 standard) : un diplôme pourrait être revendu | Rendre le token non transférable (soulbound) en surchargeant `_update` |
| 3 | Faible | La révocation ne brûle pas le NFT : `ownerOf` reste valide, la vérification doit lire le champ `revoked` | Les vérificateurs doivent lire `getCertificate` ; comportement documenté |
| 4 | Faible | Données personnelles (nom, identifiant étudiant) stockées **en clair et définitivement** on-chain | Stocker seulement un hash ou des métadonnées off-chain (RGPD) |
| 5 | Faible | `tokenURI` en data-URI : pas d'immuabilité garantie comme avec IPFS | Pinner les métadonnées sur IPFS |
| 6 | Info | `studentId` : unicité stricte, donc un étudiant ne peut pas recevoir un second diplôme | Choix conforme au sujet ; à revoir selon le besoin métier |
| 7 | Info | Un admin peut s'accorder le rôle minter à lui-même (comportement normal d'AccessControl) | Surveiller les events `RoleGranted` |

## 3. Points non couverts

- **Déploiement Sepolia non réalisé** : le contrat a été déployé et testé uniquement sur le réseau Hardhat local, faute d'ETH de test disponible.
- Pas d'analyse statique (Slither, Mythril) ni de fuzzing.
- La protection contre la reentrancy n'est pas testée avec un contrat récepteur malveillant.
- Pas de test de limite de gas sur un batch de 20 certificats.
- Pas d'audit externe ; le frontend (validation côté client) n'est pas audité.
- Contrat non vérifié sur Etherscan.

## 4. Conclusion

Le contrat respecte la checklist minimale du sujet, avec des tests pour chaque exigence. Les constats 1, 2 et 4 doivent être traités avant toute mise en production réelle. Le déploiement sur Sepolia reste à faire.
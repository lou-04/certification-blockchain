# Système de certification académique sur blockchain

Application de bout en bout : smart contract Solidity, frontend React et import Excel pour émettre et vérifier des certificats académiques.

## Structure

```
certification/
├── contracts-project/   Hardhat : contrat, tests, scripts de déploiement
├── frontend/            React + Vite + wagmi/viem + SheetJS
├── etudiants.xlsx       Fichier Excel d'exemple
└── README.md
```

## Prérequis

- Node.js 18 ou 20 LTS
- npm, Git
- Extension MetaMask

## Installation

```bash
cd contracts-project && npm install
cd ../frontend && npm install
```

## Lancer en local

**Terminal 1 : blockchain locale** (à laisser ouvert)

```bash
cd contracts-project
npx hardhat node
```

**Terminal 2 : tests et déploiement**

```bash
cd contracts-project
npx hardhat test
npx hardhat run scripts/deploy.js --network localhost
```

Le script affiche l'adresse du contrat. Copiez-la dans `frontend/.env` :

```
VITE_CONTRACT_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

**Terminal 3 : frontend**

```bash
cd frontend
npm run dev
```

Ouvrir http://localhost:5173.

## Configuration de MetaMask

1. Sélectionner le réseau **Localhost 8545** (RPC `http://127.0.0.1:8545`, Chain ID `31337`).
2. Importer la clé privée du compte #0 affichée par `hardhat node`.
   Cette clé de test est publique et sans valeur. Elle correspond au déployeur, donc à l'owner du contrat.

## Utilisation

**Mint unitaire** : onglet *Administration* → connecter le wallet → remplir le formulaire → *Émettre* → confirmer dans MetaMask. Le hash de transaction s'affiche dans le journal.

**Import Excel** : onglet *Administration* → choisir `etudiants.xlsx` → vérifier l'aperçu (les lignes invalides sont signalées et non sélectionnables) → cocher les lignes → *Émettre les lignes sélectionnées*. Les certificats sont envoyés par lots de 10.

**Vérification publique** : onglet *Vérification publique* → saisir l'identifiant du certificat → affichage du nom, du diplôme, de la date, de la mention et du statut (valide ou révoqué). Aucun wallet n'est nécessaire.

## Format du fichier Excel

| Colonne | Exemple | Obligatoire |
|---|---|---|
| studentName | Amina Benali | oui |
| studentId | 2023-INF-042 | oui |
| diplomaTitle | Licence Informatique | oui |
| issueDate | 2026-06-15 (AAAA-MM-JJ) | oui |
| grade | Mention Bien | oui |
| recipientAddress | 0x... | non |

## Smart contract : `CertificateRegistry`

- `mintCertificate(...)` : émet un certificat (admins uniquement).
- `batchMint(...)` : émet jusqu'à 20 certificats par transaction.
- `getCertificate(certId)` : lecture publique (`view`).
- `revoke(certId)` : révocation d'un certificat.
- `setAdmin(address, bool)` : le owner délègue le droit d'émettre.
- Event `CertificateMinted(certId, recipient, studentId)`.
- Anti-doublon : un même couple `studentId` + `diplomaTitle` ne peut être émis qu'une fois.

## Déploiement

- **Réseau :** Hardhat local (chain ID 31337)
- **Adresse du contrat :** `0xADRESSE_DU_CONTRAT`

Un déploiement Sepolia est possible : renseigner `SEPOLIA_RPC_URL` et `PRIVATE_KEY` (compte de test dédié) dans `contracts-project/.env`, puis :

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## Capture d'écran

![Mint réussi](screenshot-mint.png)

## Sécurité

- Aucune clé privée dans le frontend : la signature passe par le wallet de l'utilisateur.
- Les fichiers `.env` sont exclus du dépôt via `.gitignore`.
- Validation des données Excel côté client avant l'envoi des transactions.
# Decentralized On-Chain Governance Platform

A full-stack governance DApp built with Hardhat (Solidity) and Next.js, featuring both Standard (1T1V) and Quadratic Voting mechanisms.

## Project Structure
- `/contracts`: Smart contracts (`GovernanceToken.sol`, `MyGovernor.sol`).
- `/frontend`: Next.js DApp with Tailwind CSS.
- `/scripts`: Deployment scripts.
- `/test`: Unit tests.

## Features
- **ERC-20 + Votes**: Token with built-in delegation and snapshotting.
- **Dual Voting Logic**:
  - **Standard**: 1 Token = 1 Vote.
  - **Quadratic**: Cost = (Votes)².
- **Frontend Dashboard**:
  - Wallet Connection.
  - Create Proposals (Select Voting Type).
  - Live Proposal Status & Voting Interface.

## Prerequisites
- Docker & Docker Compose
- *OR* Node.js v18+ (if running locally)

## Quick Start (Docker)
The easiest way to run the project is using Docker, as it handles all dependencies.

```bash
docker-compose up --build
```
- **Frontend**: http://localhost:3000
- **Hardhat Node**: http://localhost:8545

## Local Development (Manual)
If you prefer running locally or encounter Docker issues:

### 1. Backend
```bash
# Install dependencies
npm install

# Run local node
npx hardhat node

# Deploy contracts (in a separate terminal)
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Frontend
Update `frontend/config.ts` with the deployed contract addresses.

```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting
- **npm install errors**: Ensure you have C++ build tools installed (for Hardhat dependencies).
- **Docker connection**: Ensure Docker Desktop is running.

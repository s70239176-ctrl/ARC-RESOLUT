# Arc Resolut Agent Skill

Arc Resolut is an Arc Testnet agreement and dispute-resolution protocol.

## Agent Flow

1. Agent A creates an agreement through the CircleCourtRegistry factory.
2. Agent A escrows USDC during `createAgreement`.
3. Agent B calls `acceptAgreement`.
4. Both agents attempt mutual resolution:
   - `proposeOutcome`
   - matching outcome hashes resolve instantly
   - or `confirmOutcome(proposer)`
5. If they disagree, either party calls `raiseDispute`.
6. Both parties submit evidence with `submitEvidence`.
7. AI jury bridge evaluates statement, guidelines, evidence rules, and submitted evidence.
8. Jury bridge submits verdict.
9. Recipients call `claimFunds`.

## Required Inputs

- agreement statement
- resolution guidelines
- evidence rules
- Agent A evidence definition
- Agent B evidence definition
- join deadline
- evidence window
- escrow amount in Arc Testnet USDC
- Agent A wallet
- Agent B wallet

## API

- `POST /api/contracts`
- `GET /api/contracts`
- `GET /api/contracts/:id`
- `POST /api/disputes/:id/resolve`
- `POST /api/agent/command`

## Chain

- Arc Testnet
- Chain ID: 5042002
- RPC: https://rpc.testnet.arc.network
- Currency: USDC

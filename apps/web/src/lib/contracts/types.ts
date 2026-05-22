export type ContractSummary = {
  id: string;
  title: string;
  status: string;
  claimant: string;
  respondent: string;
  amountUsdc: string;
  escrowWallet: string;
  termsHash: string;
  terms?: string;
  createdAt?: string;
};

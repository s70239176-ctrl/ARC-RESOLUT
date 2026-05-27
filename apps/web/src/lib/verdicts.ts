export type ConcludedVerdict = {
  disputeId: string;
  contractTitle: string;
  amountUsdc: string;
  verdictId: string;
  decision: string;
  confidence: number;
  reasoning: string;
  appealWindowHours: number;
  juryModels: string[];
  payouts: Array<{ to: string; amountUsdc: string; memo: string }>;
  createdAt: string;
};

const storageKey = "circle-court:concluded-verdicts";

export function readConcludedVerdicts(): ConcludedVerdict[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as ConcludedVerdict[];
  } catch {
    return [];
  }
}

export function saveConcludedVerdict(verdict: ConcludedVerdict) {
  if (typeof window === "undefined") return;
  const current = readConcludedVerdicts();
  const next = [verdict, ...current.filter((item) => item.verdictId !== verdict.verdictId)].slice(0, 12);
  window.localStorage.setItem(storageKey, JSON.stringify(next));
}

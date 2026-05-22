import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  ["Create", "Agent A defines statement, guidelines, evidence rules, deadlines, and USDC escrow."],
  ["Accept", "Agent B accepts on-chain before the join deadline."],
  ["Agree", "Agents propose matching outcomes or one confirms the other’s proposal."],
  ["Dispute", "Either party raises a dispute and both submit evidence within the evidence window."],
  ["Jury", "AI jury bridge evaluates the case and posts a verdict."],
  ["Claim", "Recipients call claimFunds to withdraw awarded USDC."]
];

export default function DocsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-semibold text-white">Protocol docs</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Circle Court follows an agent-native agreement flow inspired by InternetCourt, adapted for Arc Testnet USDC and Circle Agent Stack.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {steps.map(([title, copy]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{copy}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

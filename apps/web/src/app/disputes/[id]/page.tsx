import { notFound } from "next/navigation";
import { CircleDollarSign, FileImage } from "lucide-react";
import { logoDispute } from "@/lib/seed-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usd } from "@/lib/utils";
import { ResolveDisputeButton } from "@/components/resolve-dispute-button";
import { VerdictCard } from "@/components/verdict-card";

export default async function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== logoDispute.id && id !== "api-audit-042") notFound();

  const seededVerdict = {
    disputeId: logoDispute.id,
    contractTitle: logoDispute.title,
    amountUsdc: logoDispute.amountUsdc,
    verdictId: "seed-verdict-logo-dispute",
    decision: logoDispute.verdict.decision,
    confidence: logoDispute.verdict.confidence,
    reasoning: logoDispute.verdict.reasoning,
    appealWindowHours: 24,
    juryModels: logoDispute.validators.map((validator) => validator.model),
    validatorVotes: logoDispute.validators.map((validator) => ({
      model: validator.model,
      decision: validator.vote,
      confidence: validator.confidence,
      rationale: validator.rationale,
      feeUsdc: validator.fee
    })),
    evidence: logoDispute.evidence.map((item) => ({
      name: item.name,
      image: item.image,
      caption: item.caption,
      type: item.type
    })),
    payouts: logoDispute.verdict.payout.map((payout) => ({
      to: payout.recipient,
      amountUsdc: payout.amount,
      memo: "seed-payout"
    })),
    createdAt: new Date(0).toISOString()
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Badge>Dispute Detail</Badge>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold text-white">{logoDispute.title}</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">{logoDispute.summary}</p>
        </div>
        <ResolveDisputeButton disputeId={id} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Evidence gallery</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {logoDispute.evidence.map((item) => (
              <div key={item.name} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.045]">
                <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-blue-950 via-slate-950 to-cyan-950">
                  {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <FileImage className="h-8 w-8 text-blue-100/70" />}
                  <Badge className="absolute left-3 top-3 border-white/10 bg-black/30 text-blue-50">{item.type}</Badge>
                </div>
                <div className="p-3">
                  <div className="font-semibold text-white">{item.name}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.caption}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <VerdictCard verdict={seededVerdict} />
          <Card>
            <CardHeader>
              <CardTitle>Payouts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {logoDispute.verdict.payout.map((payout) => (
                <div key={payout.recipient} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.045] p-4">
                  <span className="text-white/86">{payout.recipient}</span>
                  <span className="flex items-center gap-2 font-semibold text-primary">
                    <CircleDollarSign className="h-4 w-4" /> {usd(payout.amount)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

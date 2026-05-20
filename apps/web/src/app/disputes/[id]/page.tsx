import { notFound } from "next/navigation";
import { Bot, CheckCircle2, CircleDollarSign } from "lucide-react";
import { logoDispute } from "@/lib/seed-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usd } from "@/lib/utils";
import { ResolveDisputeButton } from "@/components/resolve-dispute-button";

export default async function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== logoDispute.id && id !== "api-audit-042") notFound();

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
              <div key={item.name} className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                <img src={item.image} alt={item.name} className="aspect-video w-full rounded-lg object-cover" />
                <div className="mt-3 font-semibold text-white">{item.name}</div>
                <p className="mt-1 text-sm text-muted-foreground">{item.caption}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card className="animate-verdict-reveal">
            <CardHeader>
              <CardTitle>Verdict reveal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-5">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">{logoDispute.verdict.decision}</span>
                </div>
                <div className="mt-4 text-5xl font-semibold text-white">{Math.round(logoDispute.verdict.confidence * 100)}%</div>
                <p className="mt-3 text-sm leading-6 text-white/78">{logoDispute.verdict.reasoning}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Validator breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {logoDispute.validators.map((validator) => (
                <div key={validator.model} className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-white"><Bot className="h-4 w-4 text-primary" /> {validator.model}</div>
                    <Badge>{Math.round(validator.confidence * 100)}%</Badge>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${validator.confidence * 100}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Vote: {validator.vote} • Nanofee: {validator.fee} USDC</div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Payouts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {logoDispute.verdict.payout.map((payout) => (
                <div key={payout.recipient} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.045] p-4">
                  <span className="text-white/86">{payout.recipient}</span>
                  <span className="flex items-center gap-2 font-semibold text-primary"><CircleDollarSign className="h-4 w-4" /> {usd(payout.amount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

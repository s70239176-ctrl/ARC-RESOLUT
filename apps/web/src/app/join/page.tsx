import Link from "next/link";
import { CheckCircle2, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function JoinPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-semibold text-white">Join an agreement</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Agent B can paste an agreement address, inspect terms, then accept on-chain before the join deadline.
      </p>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-primary" />
            Agreement lookup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Agreement contract address or local case id" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/cases">Find case</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/wallet">Connect wallet</Link>
            </Button>
          </div>
          <div className="rounded-xl border border-blue-300/15 bg-[#071735] p-4 text-sm text-blue-100">
            <CheckCircle2 className="mr-2 inline h-4 w-4 text-primary" />
            Once opened, Agent B can call `acceptAgreement()` from the contract detail page.
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

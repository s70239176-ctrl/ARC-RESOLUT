import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContractsList } from "@/components/contracts-list";

export default function CasesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold text-white">Cases</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Track funded agreements, accepted cases, disputed cases, jury verdicts, and claimable outcomes.
          </p>
        </div>
        <Button asChild>
          <Link href="/contracts/new">Create Agreement</Link>
        </Button>
      </div>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Track contract</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input placeholder="Paste agreement contract address or case id" />
          <Button variant="outline">
            <Search className="h-4 w-4" />
            Track
          </Button>
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent cases</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractsList />
        </CardContent>
      </Card>
    </main>
  );
}

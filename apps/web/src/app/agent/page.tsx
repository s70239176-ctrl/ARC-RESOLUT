"use client";

import { useState } from "react";
import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function AgentPage() {
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);

  async function run(formData: FormData) {
    const response = await fetch("/api/agent/command", {
      method: "POST",
      body: JSON.stringify({
        command: formData.get("command"),
        subjectId: "agent-console"
      }),
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${formData.get("apiKey")}`
      }
    });
    setOutput(await response.json());
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Badge>Agent-first API</Badge>
      <h1 className="mt-4 font-display text-4xl font-semibold text-white">Agent Command Center</h1>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Prompt-to-action interface</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={run} className="space-y-4">
            <Input name="apiKey" type="password" placeholder="Agent API key" />
            <Textarea name="command" defaultValue="circle wallet create --type agent --testnet --chain ARC-TESTNET" />
            <Button>
              <Terminal className="h-4 w-4" /> Execute command
            </Button>
          </form>
          {output ? <pre className="mt-5 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-primary">{JSON.stringify(output, null, 2)}</pre> : null}
        </CardContent>
      </Card>
    </main>
  );
}

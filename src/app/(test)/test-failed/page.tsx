import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default async function TestFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason = "Malpractice detected" } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 flex items-center justify-center">
            <div className="rounded-full bg-amber-50 p-3">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">
            Test Terminated
          </CardTitle>
          <CardDescription className="text-center">
            Your test has been terminated due to a violation of test rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">Reason: {reason}</p>
          <p className="text-muted-foreground mt-4 text-center">
            This incident has been recorded. Please contact your test
            administrator for more information.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/">Return to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

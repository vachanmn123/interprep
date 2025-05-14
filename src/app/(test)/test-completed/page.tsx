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
import { CheckCircle } from "lucide-react";

export default function TestCompletedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 flex items-center justify-center">
            <div className="rounded-full bg-green-50 p-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Test Completed</CardTitle>
          <CardDescription className="text-center">
            Thank you for completing the test.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            Your responses have been recorded successfully. Your results will be
            available once the test has been graded.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

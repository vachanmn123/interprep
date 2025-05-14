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
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 flex items-center justify-center">
            <div className="rounded-full bg-red-50 p-3">
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">
            Unauthorized Access
          </CardTitle>
          <CardDescription className="text-center">
            You do not have permission to access this test.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            The credential provided is invalid or has expired. Please contact
            your test administrator for assistance.
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

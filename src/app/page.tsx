import Link from "next/link";

import { Button } from "@/components/ui/button";

export default async function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <h1 className="text-2xl font-bold">Welcome to InterPrep</h1>
      <p>Login to Dashboard</p>
      <Link href="/dashboard">
        <Button>Go to Dasboard</Button>
      </Link>
    </div>
  );
}

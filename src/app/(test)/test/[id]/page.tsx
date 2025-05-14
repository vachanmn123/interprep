import { redirect } from "next/navigation";
import { validateCredentials } from "@/lib/validateCredential";
import TestContainer from "@/components/test/test-container";

export default async function TestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: { cred?: string };
}) {
  const { id } = await params;
  const { cred } = searchParams;

  // Server-side validation of the credential
  if (!cred || !(await validateCredentials(cred, id))) {
    redirect("/unauthorized");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <TestContainer credentialToken={cred} />
    </main>
  );
}

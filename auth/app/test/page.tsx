import { auth } from "@/auth";

export default async function TestPage() {
  const session = await auth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}
import ReinitialisationClient from "./_components/ReinitialisationClient";

export default async function ReinitialisationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ReinitialisationClient token={token} />;
}

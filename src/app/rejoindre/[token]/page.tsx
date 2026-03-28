import { validerTokenQR } from "@/actions/qr-invite.actions";
import RejoindreClient from "./_components/RejoindreClient";

export default async function RejoindrePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const validation = await validerTokenQR(token);

  if (!validation.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-1 px-4 dark:bg-dark">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-dark">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red/10">
            <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#E10E0E" strokeWidth={2.5} strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-bold text-dark dark:text-white">Lien invalide</h2>
          <p className="text-sm text-dark-5 dark:text-dark-6">{validation.error}</p>
        </div>
      </div>
    );
  }

  return <RejoindreClient token={token} orgNom={validation.orgNom!} />;
}

import Link from "next/link";
import Image from "next/image";
import logoBlanc from "@/assets/logos/logo_blanc.png";

export default function AccueilPage() {
  return (
    <div className="min-h-screen bg-[#020D1A] text-white">

      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#020D1A]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Image src={logoBlanc} height={44} alt="Walking by faith & love" style={{ objectFit: "contain" }} priority />
          <div className="flex items-center gap-3">
            <Link href="/connexion" className="rounded-lg px-4 py-2 text-sm font-semibold text-white/70 transition hover:text-white">
              Se connecter
            </Link>
            <Link href="/inscription" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary/90">
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="px-5 pb-24 pt-24 md:pt-36">
        <div className="mx-auto max-w-4xl text-center">

          <span className="mb-6 inline-block rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            Pour votre église
          </span>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
            Le suivi d&apos;évangélisation{" "}
            <span className="text-primary">réinventé</span>{" "}
            pour votre église
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base text-white/55 md:text-lg">
            Walking by faith & love est l&apos;outil conçu pour les équipes d&apos;évangélisation — pour tracker les âmes touchées, saluts et guérisons en temps réel.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/inscription"
              className="w-full rounded-xl bg-primary px-8 py-4 text-sm font-bold text-white transition hover:bg-primary/90 sm:w-auto"
            >
              Inscrire mon église
            </Link>
            <Link
              href="/connexion"
              className="w-full rounded-xl border border-white/15 px-8 py-4 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white sm:w-auto"
            >
              Se connecter
            </Link>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-xl grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.04] py-6">
            {[
              { val: "2 400+", label: "Âmes touchées" },
              { val: "340+",   label: "Prières du salut" },
              { val: "12",     label: "Villes actives" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-primary">{s.val}</p>
                <p className="mt-1 text-xs text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FONCTIONNALITÉS ===== */}
      <section className="border-t border-white/10 px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-extrabold text-white md:text-4xl">
              Tout ce dont votre équipe a besoin
            </h2>
            <p className="text-sm text-white/40">Un outil simple, puissant, pensé pour le terrain.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: (
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                ),
                couleur: "text-primary bg-primary/10",
                titre: "Cartographie en temps réel",
                desc: "Visualisez l'impact de vos sorties sur une carte interactive de France. Chaque ville touchée, chaque région atteinte.",
              },
              {
                icon: (
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                couleur: "text-[#8155FF] bg-[#8155FF]/10",
                titre: "Suivi des Âmes",
                desc: "Enregistrez chaque rencontre depuis le terrain. Saluts, prières, guérisons — tout est tracé, rien n'est oublié.",
              },
              {
                icon: (
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <rect x={2} y={3} width={20} height={14} rx={2} stroke="currentColor" strokeWidth={2} />
                    <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                ),
                couleur: "text-[#FF9C55] bg-[#FF9C55]/10",
                titre: "Gestion d'équipe",
                desc: "Créez des comptes pour chaque évangéliste. Suivez leur activité, leurs sorties, et leurs résultats individuels.",
              },
            ].map((f) => (
              <div
                key={f.titre}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 transition hover:border-white/20"
              >
                <div className={`mb-5 inline-flex rounded-xl p-2.5 ${f.couleur}`}>
                  {f.icon}
                </div>
                <h3 className="mb-2 text-base font-bold text-white">{f.titre}</h3>
                <p className="text-sm leading-relaxed text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="border-t border-white/10 px-5 py-24">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-white">Prêt à impacter votre ville ?</h2>
          <p className="mb-8 text-sm text-white/50">
            Rejoignez les équipes qui utilisent Walking by faith & love pour maximiser leur impact et ne perdre aucune âme de vue.
          </p>
          <Link
            href="/inscription"
            className="inline-block rounded-xl bg-primary px-10 py-4 text-sm font-bold text-white transition hover:bg-primary/90"
          >
            Créer mon espace gratuitement
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-white/25">
        © 2026 Walking by faith & love · Tous droits réservés
      </footer>

    </div>
  );
}

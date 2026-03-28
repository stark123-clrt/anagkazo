"use client";

import { useState, useTransition } from "react";
import { sauvegarderNotifPrefs } from "@/actions/notifications.actions";
import type { NotifPrefs } from "@/types/notifications";

const OPTIONS = [
  {
    key: "toutesRencontres" as keyof NotifPrefs,
    label: "Toutes les rencontres",
    desc: "Recevoir une notification à chaque nouvelle âme enregistrée",
  },
  {
    key: "salut" as keyof NotifPrefs,
    label: "Prière du Salut",
    desc: "Notifier uniquement quand une âme a reçu le Salut",
  },
  {
    key: "guerison" as keyof NotifPrefs,
    label: "Guérison",
    desc: "Notifier quand une guérison est rapportée",
  },
  {
    key: "priereSpontanee" as keyof NotifPrefs,
    label: "Prière spontanée",
    desc: "Notifier quand une prière spontanée a été faite",
  },
  {
    key: "contact" as keyof NotifPrefs,
    label: "Âmes avec contact / numéro",
    desc: "Notifier quand un contact ou numéro de téléphone est renseigné",
  },
];

export default function NotifPrefsClient({ prefs }: { prefs: NotifPrefs }) {
  const [form, setForm] = useState<NotifPrefs>(prefs);
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState("");

  function toggle(key: keyof NotifPrefs) {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
    setSucces(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setSucces(false);
    startTransition(async () => {
      const res = await sauvegarderNotifPrefs(form);
      if (res.error) setErreur(res.error);
      else setSucces(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6 pb-10">

      {/* Info */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5 text-sm text-primary dark:bg-primary/10">
        Choisissez les événements qui déclenchent une notification dans la cloche en haut de page.
        Les notifications apparaissent en temps réel (toutes les 30 secondes).
      </div>

      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h2 className="font-bold text-dark dark:text-white">Déclencher une notification quand…</h2>
        </div>
        <div className="divide-y divide-stroke dark:divide-dark-3">
          {OPTIONS.map((opt) => (
            <label
              key={opt.key}
              className="flex cursor-pointer items-center gap-4 px-6 py-4 transition hover:bg-gray-1 dark:hover:bg-dark-2"
            >
              {/* Toggle switch */}
              <div
                onClick={() => toggle(opt.key)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  form[opt.key] ? "bg-primary" : "bg-gray-200 dark:bg-dark-3"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                    form[opt.key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-dark dark:text-white">{opt.label}</p>
                <p className="text-xs text-dark-5 dark:text-dark-6">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Note : si "toutes" désactivé, les autres prennent le relais */}
      {!form.toutesRencontres && (
        <div className="rounded-xl border border-[#FF9C55]/30 bg-[#FF9C55]/5 px-4 py-3 text-xs text-[#FF9C55]">
          Mode filtré actif — seules les rencontres correspondant aux critères cochés apparaîtront dans les notifications.
        </div>
      )}

      {erreur && (
        <p className="text-sm font-medium text-red">{erreur}</p>
      )}
      {succes && (
        <p className="text-sm font-medium text-green">Préférences sauvegardées.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-primary py-4 text-sm font-bold text-white shadow-md transition hover:bg-primary/90 disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {isPending ? "Enregistrement…" : "Sauvegarder"}
      </button>
    </form>
  );
}

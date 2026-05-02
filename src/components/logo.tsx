import logoNoire from "@/assets/logos/logo_noire.png";
import logoBlanc from "@/assets/logos/logo_blanc.png";
import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center -mt-6">
      {/* Mode clair → logo noir */}
      <Image
        src={logoNoire}
        height={100}
        alt="Anagkazo"
        className="dark:hidden"
        style={{ objectFit: "contain" }}
        priority
      />
      {/* Mode sombre → logo blanc */}
      <Image
        src={logoBlanc}
        height={100}
        alt="Anagkazo"
        className="hidden dark:block"
        style={{ objectFit: "contain" }}
        priority
      />
    </div>
  );
}

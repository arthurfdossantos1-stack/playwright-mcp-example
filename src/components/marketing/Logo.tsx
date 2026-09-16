import Link from "next/link";

export function Logo({ href = "/", compacto = false }: { href?: string; compacto?: boolean }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5" aria-label="RastroLead">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-marca-600 to-acento-500 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#ffffff]" aria-hidden="true">
          <circle cx="11" cy="11" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.9" />
          <circle cx="11" cy="11" r="2.1" fill="currentColor" />
          <path
            d="M15.8 15.8 L20.5 20.5"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {!compacto && (
        <span className="text-[1.0625rem] font-bold tracking-tight text-slate-900">
          Rastro<span className="text-marca-600">Lead</span>
        </span>
      )}
    </Link>
  );
}

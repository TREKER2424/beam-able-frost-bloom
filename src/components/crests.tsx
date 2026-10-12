const BADGES: Record<string, { bg: string; fg: string; d: string }> = {
  NNN: { bg: "#1F4E9A", fg: "#F4F7FB", d: "M16 46V18h8l16 18V18h8v28h-8L24 28v18z" },
  KHD: { bg: "#0A4C9A", fg: "#F2F6FB", d: "M32 12c8 10 14 18 14 26a14 14 0 0 1-28 0c0-8 6-16 14-26z" },
  POB: { bg: "#9E1B32", fg: "#F6F3EE", d: "M32 14 52 46H12z" },
  SHP: { bg: "#1A1A1A", fg: "#F58220", d: "M32 10 54 32 32 54 10 32z" },
  SBR: { bg: "#CC0000", fg: "#F4F0EA", d: "M30 8h4v30h10L32 56 20 38h10z" },
  RVD: { bg: "#12344D", fg: "#3DDCFF", d: "M8 24c6-8 10-8 16 0s10 8 16 0 10-8 16 0v6c-6 0-10 2-16-6s-10-8-16-2-10 6-16 2zm0 16c6-8 10-8 16 0s10 8 16 0 10-8 16 0v6c-6 0-10 2-16-6s-10-8-16-2-10 6-16 2z" },
  ARZ: { bg: "#123A70", fg: "#F4F7FB", d: "M14 50V28a18 18 0 0 1 36 0v22h-8V28a10 10 0 0 0-20 0v22z" },
  MVY: { bg: "#1A1A1A", fg: "#E05A00", d: "M12 48V16l20 22 20-22v32h-8V30L32 44 20 30v18z" },
  ENI: { bg: "#0C2340", fg: "#D71920", d: "M16 50 38 12h12L28 50z" },
  KDV: { bg: "#1F7A3A", fg: "#F4F7F2", d: "M32 10c2 10 12 14 12 24 0 8-5 16-12 20-7-4-12-12-12-20 0-10 10-14 12-24z" },
  SIB: { bg: "#1B4F9C", fg: "#F4F7FB", d: "M6 48 22 18l10 14 8-18 18 34z" },
  DBA: { bg: "#1E4ED8", fg: "#F7F7F2", d: "M16 14h18a16 16 0 0 1 0 36H16zm8 8h10a8 8 0 0 1 0 20H24z" },
  IRT: { bg: "#111111", fg: "#F5C400", d: "M8 26h48v8H8zm0 14c8-10 14-10 22 0s14 10 22 0v8H8z" },
  TMP: { bg: "#3A2A08", fg: "#E2B93B", d: "M32 8l4 14 14-4-8 12 14 6-16 2 8 14-14-10-14 10 8-14-16-2 14-6-8-12 14 4z" },
  BUR: { bg: "#0033A0", fg: "#FFD100", d: "M32 14a18 18 0 1 0 .1 0z" },
  BAI: { bg: "#0E7490", fg: "#E7F6F8", d: "M6 34c8-10 14-10 20 0s14 10 20 0 12-10 16 0v14H6z" },
};

export function Crest({ id, className = "h-10 w-10" }: { id: string; className?: string }) {
  const badge = BADGES[id];
  if (badge) {
    return (
      <svg className={className} viewBox="0 0 64 64" aria-hidden>
        <circle cx="32" cy="32" r="30" fill={badge.bg} />
        <path d={badge.d} fill={badge.fg} fillRule="evenodd" />
      </svg>
    );
  }
  const common = { className, viewBox: "0 0 64 64", "aria-hidden": true as const };
  switch (id) {
    case "KHM":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill="#981C1E" />
          <path d="M32 10c2 8 2 12 0 18-6 2-10 8-10 14h20c0-6-4-12-10-14 2-6 2-10 0-18z" fill="#F4F0EA" />
          <circle cx="32" cy="46" r="4" fill="#981C1E" />
        </svg>
      );
    case "SPM":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill="#CC0000" />
          <path d="M14 40 32 12l18 28H14z" fill="#F4F0EA" />
          <path d="M22 40 32 24l10 16H22z" fill="#CC0000" />
        </svg>
      );
    case "SHU":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill="#1F6B45" />
          <path d="M32 12c6 8 8 14 8 22H24c0-8 2-14 8-22z" fill="#F4F1E8" />
          <path d="M32 28c4 4 6 8 6 12H26c0-4 2-8 6-12z" fill="#1F6B45" />
        </svg>
      );
    case "ENR":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill="#142033" />
          <path d="M34 8 22 34h10l-4 22 18-30H34l4-18z" fill="#E2B93B" />
        </svg>
      );
    case "ZNM":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill="#7A1F2B" />
          <path d="M16 18h32v8H16zM18 26h28l-4 24H22L18 26z" fill="#F2C94C" />
        </svg>
      );
    case "ALT":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill="#2E6BFF" />
          <path d="m32 12 4 12h12l-10 8 4 12-10-7-10 7 4-12-10-8h12z" fill="#F7F7F2" />
        </svg>
      );
    case "SKL":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill="#143024" />
          <path d="M12 36c8-16 14-20 20-20 4 8 6 14 4 24-6 2-12 2-18 0 2-4 4-8 2-12-4 2-8 6-8 8z" fill="#8FE388" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill="#0E6E8C" />
          <path d="M10 34c6-6 10-6 16 0s10 6 16 0 10-6 12 0v8c-6 0-10 2-16-4s-10-6-16-2-10 6-12 4z" fill="#E7F2EA" />
        </svg>
      );
  }
}

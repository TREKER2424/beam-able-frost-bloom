export function Crest({ id, className = "h-10 w-10" }: { id: string; className?: string }) {
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

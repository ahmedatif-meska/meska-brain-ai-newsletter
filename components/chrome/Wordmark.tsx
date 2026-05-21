import Image from "next/image";
import Link from "next/link";

type Tone = "light" | "dark";

export function Wordmark({
  tone = "dark",
  href = "/",
}: {
  tone?: Tone;
  href?: string;
}) {
  // The white logo (white wordmark + blue M) is designed for dark backgrounds.
  // On light backgrounds, fall back to text until a dark-tone logo asset is added.
  if (tone === "light") {
    return (
      <Link
        href={href}
        className="font-display text-[22px] font-bold leading-9 tracking-tight text-zinc-900 sm:text-[28px]"
      >
        Meska Brain
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center"
      aria-label="Meska Brain"
    >
      <Image
        src="/meska-logo.png"
        alt="Meska Brain"
        width={1024}
        height={205}
        priority
        className="block h-auto w-[80px] sm:w-[160px]"
        sizes="(min-width: 640px) 160px, 80px"
        style={{ aspectRatio: "1024 / 205" }}
      />
    </Link>
  );
}

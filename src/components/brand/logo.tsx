import Image from "next/image";

export const LOGO_SRC = "/favicon.png";

export function Logo({ className = "h-10 w-auto", src }: { className?: string; src?: string }) {
  return (
    <Image
      src={src || LOGO_SRC}
      alt=""
      width={640}
      height={480}
      className={`object-contain ${className}`}
    />
  );
}

export function Wordmark({
  compact = false,
  className,
  src,
}: {
  compact?: boolean;
  className?: string;
  src?: string;
}) {
  const size = compact
    ? "h-10 w-auto max-w-[72px]"
    : "h-12 w-auto max-w-[180px] md:h-14 md:max-w-[200px]";
  return (
    <Image
      key={src || LOGO_SRC}
      src={src || LOGO_SRC}
      alt="Agile Sole"
      width={640}
      height={480}
      priority
      unoptimized
      className={`object-contain object-center ${className ?? size}`}
    />
  );
}

export function SwitchTrack({ on }: { on: boolean }) {
  return (
    <span
      data-on={on ? "true" : "false"}
      className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${
        on ? "justify-end bg-[#1FA64A]" : "justify-start bg-[#d5ddd7]"
      }`}
    >
      <span className="block h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(17,17,17,0.22)]" />
    </span>
  );
}

export function Switch({
  on,
  onChange,
  disabled,
  label,
}: {
  on: boolean;
  onChange: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className="as-switch inline-flex shrink-0 rounded-full p-0 disabled:opacity-70"
    >
      <SwitchTrack on={on} />
    </button>
  );
}

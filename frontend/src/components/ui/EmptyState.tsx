import DnaMascot from "./DnaMascot";

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2 p-6 pl-surface-2 my-3">
      <DnaMascot animated={false} size={60} />
      <h3 className="font-bold">{title}</h3>
      <p className="text-sm pl-ink-soft max-w-md">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center min-h-[44px] px-5 rounded-full font-bold text-white mt-2"
          style={{ background: "var(--accent)" }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
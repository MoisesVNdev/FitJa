// Sacola própria da Fit Já: contorno de sacola com a folha da marca impressa no centro.
export function BagIcon({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4.2 8.6h15.6l-1.1 10.7a1.8 1.8 0 0 1-1.8 1.6H7.1a1.8 1.8 0 0 1-1.8-1.6L4.2 8.6Z" />
      <path d="M8.6 8.6V6.9a3.4 3.4 0 0 1 6.8 0v1.7" />
      <path d="M12 16.8c-2.4-.2-3.4-1.9-3.1-4.4 2.5.2 3.5 1.9 3.1 4.4Z" fill="currentColor" />
      <path d="M12 16.8v-4.2" />
    </svg>
  );
}

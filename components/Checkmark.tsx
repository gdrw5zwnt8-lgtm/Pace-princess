export function Checkmark() {
  return (
    <div className="check-wrap" role="img" aria-label="Payment successful">
      <svg className="check" viewBox="0 0 88 88" aria-hidden>
        <circle cx="44" cy="44" r="40" />
        <path d="M27 45 l11 11 l23 -24" />
      </svg>
    </div>
  );
}

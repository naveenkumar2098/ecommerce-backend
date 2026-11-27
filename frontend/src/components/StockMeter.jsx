const SEGMENTS = 10;

export const stockText = (stock) => {
  if (stock <= 0) return 'Out of stock';
  if (stock <= 3) return `Only ${stock} left`;
  return `${stock} in stock`;
};

// A ten-segment level indicator; each lit segment is one unit, capped at ten.
export default function StockMeter({ stock, size = 'small' }) {
  const lit = Math.max(0, Math.min(stock, SEGMENTS));
  const level = stock <= 0 ? 'empty' : stock <= 3 ? 'low' : 'ok';
  return (
    <span className={`stock stock--${size} stock--${level}`}>
      <span className="stock__meter" aria-hidden="true">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span key={i} className={i < lit ? 'stock__seg is-lit' : 'stock__seg'} />
        ))}
      </span>
      <span className="stock__text">{stockText(stock)}</span>
    </span>
  );
}

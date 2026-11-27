import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../cart';
import { useToast } from '../toast';
import { formatPrice } from '../format';
import StockMeter from '../components/StockMeter';
import { LoadState, useLoad } from '../components/ui';

const categoryKey = (c) => c.trim().toLowerCase();
const categoryLabel = (c) => c.trim().replace(/^\w/, (ch) => ch.toUpperCase());

export default function Shop() {
  const { data: products, loading, error, reload } = useLoad(() => api('/products'), []);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const active = params.get('category') || 'all';
  const cart = useCart();
  const notify = useToast();

  const categories = useMemo(() => {
    const seen = new Map();
    for (const p of products || []) {
      const key = categoryKey(p.category);
      if (!seen.has(key)) seen.set(key, categoryLabel(p.category));
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products || []).filter((p) => {
      if (active !== 'all' && categoryKey(p.category) !== active) return false;
      if (!q) return true;
      return `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q);
    });
  }, [products, active, query]);

  const choose = (key) => {
    const next = new URLSearchParams(params);
    if (key === 'all') next.delete('category');
    else next.set('category', key);
    setParams(next, { replace: true });
  };

  const addToCart = (p) => {
    cart.add(p, 1);
    notify(`Added ${p.name} to your cart`);
  };

  return (
    <section className="page shop">
      <h1 className="visually-hidden">Shop electronics and gear</h1>
      <nav className="category-index" aria-label="Categories">
        <button
          type="button"
          className="category-index__item"
          aria-pressed={active === 'all'}
          onClick={() => choose('all')}
        >
          All
        </button>
        {categories.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="category-index__item"
            aria-pressed={active === key}
            onClick={() => choose(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="shop-tools">
        <label className="visually-hidden" htmlFor="search">Search products</label>
        <input
          id="search"
          type="search"
          className="search"
          placeholder="Search products"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {products && (
          <p className="shop-tools__count" aria-live="polite">
            {visible.length === 1 ? '1 product' : `${visible.length} products`}
          </p>
        )}
      </div>

      <LoadState loading={loading && !products} error={error} onRetry={reload} label="Loading products…">
        {visible.length === 0 ? (
          <div className="empty">
            <p className="empty__title">
              {products?.length ? 'Nothing matches that search.' : 'The shop is empty right now.'}
            </p>
            <p>
              {products?.length
                ? 'Try a shorter search or pick another category.'
                : 'Products appear here as soon as a supplier lists them.'}
            </p>
          </div>
        ) : (
          <ul className="product-list">
            {visible.map((p) => {
              const inCart = cart.qtyOf(p._id);
              const maxed = inCart >= p.stock;
              return (
                <li key={p._id} className="product-row">
                  <div className="product-row__main">
                    <h2 className="product-row__name">
                      <Link to={`/products/${p._id}`}>{p.name}</Link>
                    </h2>
                    <p className="product-row__desc">{p.description}</p>
                    <div className="product-row__meta">
                      <span className="product-row__category">{categoryLabel(p.category)}</span>
                      <StockMeter stock={p.stock} />
                    </div>
                  </div>
                  <div className="product-row__buy">
                    <p className="price">{formatPrice(p.price)}</p>
                    <button
                      type="button"
                      className="button"
                      disabled={p.stock <= 0 || maxed}
                      onClick={() => addToCart(p)}
                    >
                      {p.stock <= 0 ? 'Out of stock' : maxed ? 'All stock in cart' : 'Add to cart'}
                    </button>
                    {inCart > 0 && !maxed && <p className="product-row__incart">{inCart} in your cart</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </LoadState>
    </section>
  );
}

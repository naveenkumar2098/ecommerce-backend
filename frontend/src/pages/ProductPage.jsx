import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../cart';
import { useToast } from '../toast';
import { formatPrice } from '../format';
import StockMeter from '../components/StockMeter';
import { LoadState, useLoad } from '../components/ui';

export default function ProductPage() {
  const { id } = useParams();
  const { data: p, loading, error, reload } = useLoad(() => api(`/products/${id}`), [id]);
  const [qty, setQty] = useState(1);
  const cart = useCart();
  const notify = useToast();

  if (error?.status === 404 || error?.status === 400) {
    return (
      <section className="page narrow">
        <h1 className="page-title">This product isn't available</h1>
        <p className="lede">It may have been removed or taken off sale.</p>
        <Link className="button" to="/">Back to the shop</Link>
      </section>
    );
  }

  return (
    <LoadState loading={loading} error={error} onRetry={reload} label="Loading product…">
      {p && <ProductView p={p} qty={qty} setQty={setQty} cart={cart} notify={notify} />}
    </LoadState>
  );
}

function ProductView({ p, qty, setQty, cart, notify }) {
  const inCart = cart.qtyOf(p._id);
  const room = Math.max(0, p.stock - inCart);
  const amount = Math.min(qty, room) || 1;

  const add = () => {
    cart.add(p, amount);
    notify(`Added ${amount} × ${p.name} to your cart`);
    setQty(1);
  };

  return (
    <article className="page product">
      <Link className="back-link" to={`/?category=${encodeURIComponent(p.category.trim().toLowerCase())}`}>
        {p.category.trim().replace(/^\w/, (c) => c.toUpperCase())}
      </Link>
      <div className="product__layout">
        <div className="product__info">
          <h1 className="product__name">{p.name}</h1>
          <p className="product__desc">{p.description}</p>
        </div>
        <aside className="buy-panel" aria-label="Buy">
          <p className="price price--large">{formatPrice(p.price)}</p>
          <StockMeter stock={p.stock} size="large" />
          {room > 0 ? (
            <div className="buy-panel__row">
              <div className="stepper" role="group" aria-label="Quantity">
                <button type="button" onClick={() => setQty(Math.max(1, amount - 1))} disabled={amount <= 1} aria-label="One fewer">−</button>
                <output aria-live="polite">{amount}</output>
                <button type="button" onClick={() => setQty(Math.min(room, amount + 1))} disabled={amount >= room} aria-label="One more">+</button>
              </div>
              <button type="button" className="button button--primary button--grow" onClick={add}>
                Add to cart
              </button>
            </div>
          ) : (
            <p className="buy-panel__note">
              {p.stock <= 0 ? 'Out of stock for now.' : 'You already have all available stock in your cart.'}
            </p>
          )}
          {inCart > 0 && (
            <p className="buy-panel__note">
              {inCart} in your cart. <Link to="/cart">Review cart</Link>
            </p>
          )}
        </aside>
      </div>
    </article>
  );
}

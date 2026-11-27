import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useCart } from '../cart';
import { useToast } from '../toast';
import { formatPrice, shortId } from '../format';
import { FormError } from '../components/ui';

export default function Cart() {
  const cart = useCart();
  const { user } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const placeOrder = async () => {
    if (!user) {
      navigate('/sign-in', { state: { from: '/cart' } });
      return;
    }
    setPlacing(true);
    setError('');
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: { products: cart.items.map((i) => ({ product: i.id, quantity: i.qty })) },
      });
      cart.clear();
      notify(`Order ${shortId(order._id)} placed`);
      navigate(user.role === 'customer' ? `/orders/${order._id}` : '/');
    } catch (err) {
      setError(
        err.status === 409 || err.status === 400
          ? `${err.message}. Adjust the quantity or remove the item, then place the order again.`
          : err.message
      );
    } finally {
      setPlacing(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <section className="page narrow">
        <h1 className="page-title">Your cart is empty</h1>
        <p className="lede">Add something from the shop and it will wait here until you order.</p>
        <Link className="button button--primary" to="/">Browse the shop</Link>
      </section>
    );
  }

  return (
    <section className="page cart">
      <h1 className="page-title">Cart</h1>
      <ul className="cart-list">
        {cart.items.map((i) => (
          <li key={i.id} className="cart-line">
            <Link className="cart-line__name" to={`/products/${i.id}`}>{i.name}</Link>
            <div className="stepper" role="group" aria-label={`Quantity of ${i.name}`}>
              <button type="button" onClick={() => cart.setQty(i.id, i.qty - 1)} disabled={i.qty <= 1} aria-label="One fewer">−</button>
              <output aria-live="polite">{i.qty}</output>
              <button type="button" onClick={() => cart.setQty(i.id, i.qty + 1)} disabled={i.qty >= i.stock} aria-label="One more">+</button>
            </div>
            <p className="cart-line__price">{formatPrice(i.price * i.qty)}</p>
            <button type="button" className="link-button" onClick={() => cart.remove(i.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="cart-summary">
        <div className="cart-summary__total">
          <span>Total</span>
          <span className="price price--large">{formatPrice(cart.total)}</span>
        </div>
        <p className="cart-summary__note">
          Prices are checked again when you order, and the total on your receipt is final.
        </p>
        <FormError error={error} />
        <button type="button" className="button button--primary button--grow" onClick={placeOrder} disabled={placing}>
          {placing ? 'Placing order…' : user ? 'Place order' : 'Sign in to place order'}
        </button>
      </div>
    </section>
  );
}

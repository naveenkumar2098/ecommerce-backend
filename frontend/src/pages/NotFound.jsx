import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="page narrow">
      <h1 className="page-title">There’s no page at this address</h1>
      <p className="lede">Check the link, or head back to the shop.</p>
      <Link className="button button--primary" to="/">Go to the shop</Link>
    </section>
  );
}

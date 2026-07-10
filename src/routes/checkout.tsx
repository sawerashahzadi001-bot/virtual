import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getDemoProducts, type CartItem, type Product } from "@/lib/luxe/data";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "MetaDress — Checkout" },
      { name: "description", content: "Review your bag, confirm fit recommendations, and complete your MetaDress purchase." },
    ],
  }),
  component: CheckoutPage,
});

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("metadress_cart");
    setCart(stored ? JSON.parse(stored) : []);
    setLoaded(true);
  }, []);

  const persistCart = (next: CartItem[]) => {
    setCart(next);
    window.localStorage.setItem("metadress_cart", JSON.stringify(next));
  };

  const updateQty = (id: string, delta: number) => {
    const next = cart
      .map((item) => (item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
      .filter((item) => item.quantity > 0);
    persistCart(next);
  };

  const removeItem = (id: string) => {
    const next = cart.filter((item) => item.id !== id);
    persistCart(next);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const completeCheckout = () => {
    window.localStorage.removeItem("luxe_cart");
    setCart([]);
    alert("Thank you for shopping with MetaDress! Your order is confirmed.");
  };

  return (
    <main className="page-shell">
      <div className="page-header">
        <div>
          <p className="hero-eyebrow">Checkout</p>
          <h1>Your Bag</h1>
          <p className="hero-sub">Review items, adjust quantities, and complete your purchase with confidence.</p>
        </div>
        <Link to="/" className="btn-outline">
          Continue Shopping
        </Link>
      </div>

      {!loaded ? (
        <div className="loading-grid">
          <div className="skeleton"></div>
          <div className="skeleton"></div>
          <div className="skeleton"></div>
        </div>
      ) : cart.length === 0 ? (
        <div className="empty-cart checkout-empty">
          <i className="fas fa-shopping-bag"></i>
          <p>Your bag is empty.</p>
          <p>Browse the MetaDress collection and add your favorites.</p>
          <Link to="/" className="btn-primary">
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="checkout-grid">
          <div className="checkout-items">
            {cart.map((item) => (
              <div key={item.id} className="checkout-item-card">
                <img src={item.image} alt={item.name} />
                <div className="checkout-item-copy">
                  <p className="product-name">{item.name}</p>
                  <span className="product-price">${item.price.toFixed(2)}</span>
                  <div className="cart-item-qty">
                    <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                </div>
                <button className="btn-ar-try" onClick={() => removeItem(item.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <aside className="checkout-summary">
            <div className="summary-card">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Items</span>
                <span>{cart.length}</span>
              </div>
              <div className="summary-row">
                <span>Estimated total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <p className="summary-note">Shipping and taxes calculated at checkout.</p>
              <button className="btn-primary full-width" onClick={completeCheckout}>
                Complete Purchase
              </button>
            </div>
            <div className="summary-card">
              <h3>Need help choosing the right fit?</h3>
              <p>Use the AI stylist on the home page for size advice and style suggestions tailored to your look.</p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

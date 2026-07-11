import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getDemoProducts, type CartItem, type Product } from "@/lib/luxe/data";
import { API } from "@/lib/luxe/data";

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
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    city: "",
    postalCode: "",
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: cart,
          totalPrice: cartTotal,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create order");
      }

      const data = await response.json();
      window.localStorage.removeItem("metadress_cart");
      setCart([]);
      alert(`Thank you for your order! Order ID: ${data.order.id}\n\nYour order will be delivered soon via Cash on Delivery.`);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
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
                  <span className="product-price">Rs. {item.price.toLocaleString()}</span>
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
                <span>Total</span>
                <span>Rs. {cartTotal.toLocaleString()}</span>
              </div>
              <p className="summary-note">Payment: Cash on Delivery (Pay at delivery)</p>
              <button 
                className="btn-primary full-width" 
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? "Hide Details" : "Proceed to Checkout"}
              </button>
            </div>

            {showForm && (
              <div className="summary-card">
                <h3>Delivery Details</h3>
                {error && (
                  <div style={{ color: "red", marginBottom: "10px", fontSize: "14px" }}>
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmitOrder} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input
                    type="text"
                    name="customerName"
                    placeholder="Full Name"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    required
                    style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                  <input
                    type="email"
                    name="customerEmail"
                    placeholder="Email"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    required
                    style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                  <input
                    type="tel"
                    name="customerPhone"
                    placeholder="Phone Number"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    required
                    style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                  <input
                    type="text"
                    name="address"
                    placeholder="Street Address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                  <input
                    type="text"
                    name="postalCode"
                    placeholder="Postal Code (Optional)"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
                  />
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-primary full-width"
                    style={{ opacity: loading ? 0.6 : 1 }}
                  >
                    {loading ? "Processing..." : "Place Order"}
                  </button>
                </form>
              </div>
            )}

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

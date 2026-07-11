import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { API } from "@/lib/luxe/data";

export const Route = createFileRoute("/order-confirmation")({
  validateSearch: (search: Record<string, any>) => ({
    orderId: search.orderId,
  }),
  head: () => ({
    meta: [
      { title: "MetaDress — Order Confirmation" },
      { name: "description", content: "Your order has been placed successfully!" },
    ],
  }),
  component: OrderConfirmationPage,
});

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  postalCode: string;
  items: Array<any>;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export default function OrderConfirmationPage() {
  const { orderId } = useSearch({ from: Route.id });
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`${API}/orders/${orderId}`);
      if (!response.ok) {
        throw new Error("Order not found");
      }
      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="page-shell">
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p>Loading order details...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="page-shell">
        <div className="page-header">
          <div>
            <p className="hero-eyebrow">Error</p>
            <h1>Order Not Found</h1>
            <p className="hero-sub">{error}</p>
          </div>
        </div>
        <Link to="/" className="btn-primary" style={{ display: "inline-block", marginTop: "20px" }}>
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-header">
        <div>
          <p className="hero-eyebrow">Success</p>
          <h1>Order Confirmed!</h1>
          <p className="hero-sub">Thank you for your order. We'll deliver it to you soon via Cash on Delivery.</p>
        </div>
      </div>

      <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px" }}>
        <div style={{ background: "#f0f9ff", border: "1px solid #0ea5e9", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
          <h2 style={{ marginTop: 0, color: "#0369a1" }}>Order Details</h2>
          <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "12px", marginBottom: "20px" }}>
            <strong>Order ID:</strong>
            <span>{order.id}</span>
            <strong>Status:</strong>
            <span style={{ textTransform: "capitalize", color: "#0369a1" }}>{order.status}</span>
            <strong>Order Date:</strong>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            <strong>Total Amount:</strong>
            <span style={{ fontSize: "18px", fontWeight: "bold", color: "#0369a1" }}>
              ${order.totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <div style={{ background: "#f5f5f5", border: "1px solid #ddd", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
          <h3 style={{ marginTop: 0 }}>Delivery Address</h3>
          <p style={{ margin: "8px 0" }}>
            <strong>{order.customerName}</strong><br />
            {order.address}<br />
            {order.city}, {order.postalCode}
          </p>
          <p style={{ margin: "8px 0", color: "#666" }}>
            <strong>Phone:</strong> {order.customerPhone}<br />
            <strong>Email:</strong> {order.customerEmail}
          </p>
        </div>

        <div style={{ background: "#f5f5f5", border: "1px solid #ddd", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
          <h3 style={{ marginTop: 0 }}>Items Ordered</h3>
          {order.items.map((item: any, index: number) => (
            <div key={index} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: index < order.items.length - 1 ? "1px solid #eee" : "none" }}>
              <span>
                {item.name} x{item.quantity}
              </span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontSize: "16px", fontWeight: "bold", borderTop: "2px solid #ddd", marginTop: "12px" }}>
            <span>Total:</span>
            <span>${order.totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ background: "#fff8dc", border: "1px solid #fbbf24", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
          <h3 style={{ marginTop: 0, color: "#b45309" }}>Payment Information</h3>
          <p style={{ margin: "8px 0" }}>
            <strong>Payment Method:</strong> Cash on Delivery (COD)<br />
            <strong>Amount to Pay:</strong> ${order.totalPrice.toFixed(2)}<br />
          </p>
          <p style={{ margin: "8px 0", fontSize: "14px", color: "#92400e" }}>
            Please have the exact amount ready when our delivery partner arrives. A confirmation will be sent to your email.
          </p>
        </div>

        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <Link to="/" className="btn-primary" style={{ display: "inline-block", marginBottom: "10px" }}>
            Continue Shopping
          </Link>
          <p style={{ color: "#666", fontSize: "14px" }}>
            A confirmation email has been sent to <strong>{order.customerEmail}</strong>
          </p>
        </div>
      </div>
    </main>
  );
}

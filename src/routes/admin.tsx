import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { type Product, getDemoProducts } from "@/lib/luxe/data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "MetaDress — Admin" },
      { name: "description", content: "Admin dashboard for MetaDress inventory, orders, and AR styling previews." },
    ],
  }),
  component: AdminPage,
});

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState(3);
  const [revenue] = useState(12890);

  useEffect(() => {
    setProducts(getDemoProducts());
  }, []);

  return (
    <main className="page-shell">
      <div className="page-header">
        <div>
          <p className="hero-eyebrow">Admin Dashboard</p>
          <h1>MetaDress Control Center</h1>
          <p className="hero-sub">Monitor inventory, view sales summary, and preview the latest AR outfits in one place.</p>
        </div>
        <Link to="/" className="btn-outline">
          Return to Shop
        </Link>
      </div>

      <div className="admin-grid">
        <div className="admin-card">
          <h2>Sales Overview</h2>
          <div className="metric-row">
            <div>
              <span className="metric-label">Open orders</span>
              <strong>{orders}</strong>
            </div>
            <div>
              <span className="metric-label">Revenue</span>
              <strong>${revenue.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h2>Top Products</h2>
          <div className="product-list">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="product-list-item">
                <span>{product.name}</span>
                <strong>${product.price}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="admin-products">
        <h2>Inventory Preview</h2>
        <div className="product-grid admin-product-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card admin-card-sm">
              <div className="product-img-wrap">
                <img src={product.image} alt={product.name} />
              </div>
              <div className="product-info">
                <p className="product-name">{product.name}</p>
                <div className="product-meta">
                  <span className="product-price">${product.price}</span>
                  <span className="product-rating">{product.rating ? `${product.rating}★` : "—"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

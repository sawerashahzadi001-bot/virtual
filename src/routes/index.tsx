// ============================
// MetaDress — Home / Shop page
// ============================

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ARTryOn } from "@/components/ARTryOn";
import AIChat from "@/components/luxe/AIChat";
import {
  API,
  getDemoProducts,
  getDemoARRingOutfits,
  type ARRingOutfit,
  type CartItem,
  type Product,
} from "@/lib/luxe/data";
import "../styles-luxe/luxe-main.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MetaDress — Smart Virtual Try-On" },
      { name: "description", content: "MetaDress is a women-first fashion destination with AR try-on, AI style advice, size recommendations, and effortless shopping." },
    ],
  }),
  component: Index,
});

interface MetaDressUser {
  id: string;
  name: string;
  email: string;
}

const CATEGORIES = [
  { cat: "all", label: "All" },
  { cat: "abayas", label: "Abayas" },
  { cat: "pakistani", label: "Pakistani Dresses" },
  { cat: "sets", label: "Sets" },
  { cat: "party", label: "Festive" },
  { cat: "summer", label: "Summer" },
];

const SIDE_CATEGORIES = [
  { cat: "all", label: "All Pieces" },
  { cat: "abayas", label: "Abayas" },
  { cat: "pakistani", label: "Pakistani Dresses" },
  { cat: "sets", label: "Stylish Sets" },
  { cat: "party", label: "Festive Edit" },
  { cat: "summer", label: "Summer Styles" },
];

function Index() {
  const navigate = useNavigate();

  // ===== STATE =====
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [ringOpen, setRingOpen] = useState(false);
  const [arOpen, setArOpen] = useState(false);
  const [arPreselect, setArPreselect] = useState<string | null>(null);
  const [arRingOutfits, setArRingOutfits] = useState<ARRingOutfit[]>([]);
  const [user, setUser] = useState<MetaDressUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState({ message: "", show: false });
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bust, setBust] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [recommendedSize, setRecommendedSize] = useState("");
  const [bodyShape, setBodyShape] = useState("");

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ===== INIT (localStorage + backend) =====
  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("metadress_cart") || "[]"));
    setWishlist(JSON.parse(localStorage.getItem("metadress_wishlist") || "[]"));
    setUser(JSON.parse(localStorage.getItem("metadress_user") || "null"));

    // Load products (fallback to demo products if backend offline)
    (async () => {
      try {
        const res = await fetch(`${API}/products`);
        setAllProducts(await res.json());
      } catch {
        setAllProducts(getDemoProducts());
      }
      setProductsLoaded(true);
    })();

    // Load AR ring outfits
    (async () => {
      try {
        const res = await fetch(`${API}/products/ar-outfits`);
        setArRingOutfits(await res.json());
      } catch {
        setArRingOutfits(getDemoARRingOutfits());
      }
    })();
  }, []);

  // ===== NAVBAR SCROLL =====
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ===== SEARCH DEBOUNCE =====
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ===== HELPERS =====
  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, show: true });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2800);
  };

  const persistCart = (next: CartItem[]) => {
    setCart(next);
    localStorage.setItem("metadress_cart", JSON.stringify(next));
  };

  const persistWishlist = (next: string[]) => {
    setWishlist(next);
    localStorage.setItem("metadress_wishlist", JSON.stringify(next));
  };

  const computeBodyShape = (b: number, w: number, h: number) => {
    const hipRatio = h / w;
    const shoulderRatio = b / w;
    if (shoulderRatio > 1.05 && hipRatio < 0.95) return "Inverted Triangle";
    if (hipRatio > 1.05 && shoulderRatio < 0.95) return "Pear";
    if (Math.abs(shoulderRatio - hipRatio) < 0.05) return "Rectangle";
    if (Math.abs(shoulderRatio - hipRatio) < 0.18) return "Hourglass";
    return "Balanced";
  };

  const recommendSize = () => {
    const h = Number(height);
    const w = Number(weight);
    const b = Number(bust);
    const ws = Number(waist);
    const hp = Number(hips);

    if (!h || !w || !b || !ws || !hp) {
      setRecommendedSize("Enter all measurements for a personalized size recommendation.");
      return;
    }

    const shape = computeBodyShape(b, ws, hp);
    setBodyShape(shape);

    let size = "M";
    if (w <= 55 && h <= 165) size = "S";
    else if (w <= 65) size = "M";
    else if (w <= 78) size = "L";
    else size = "XL";

    if (shape === "Hourglass" && size === "L") size = "M";
    if (shape === "Pear" && size === "L") size = "M";

    setRecommendedSize(`MetaDress recommends size ${size} for your measurements. Recommended body shape: ${shape}.`);
  };

  // ===== AUTH STATE =====
  const handleUserClick = () => {
    if (user) {
      if (confirm(`Signed in as ${user.name}\n\nSign out?`)) {
        localStorage.removeItem("metadress_user");
        localStorage.removeItem("metadress_token");
        location.reload();
      }
    } else {
      navigate({ to: "/auth" });
    }
  };

  // ===== WISHLIST =====
  const toggleWishlist = (id: string) => {
    if (wishlist.includes(id)) {
      persistWishlist(wishlist.filter((w) => w !== id));
      showToast("Removed from wishlist");
    } else {
      persistWishlist([...wishlist, id]);
      showToast("Added to wishlist ❤️");
    }
  };

  // ===== CART =====
  const addToCart = (product: Product) => {
    const existing = cart.find((i) => i.id === product.id);
    const next = existing
      ? cart.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
      : [...cart, { ...product, quantity: 1 }];
    persistCart(next);
    showToast(`${product.name} added to bag 🛍️`);
  };

  const updateQty = (id: string, delta: number) => {
    const next = cart
      .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
      .filter((i) => i.quantity > 0);
    persistCart(next);
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ===== AR =====
  const openARWithOutfit = (outfitId: string) => {
    setRingOpen(false);
    setArPreselect(outfitId);
    setArOpen(true);
  };

  const closeAll = () => {
    setMenuOpen(false);
    setCartOpen(false);
  };

  // ===== FILTERED PRODUCTS =====
  const filtered = allProducts.filter((p) => {
    const matchesCategory = currentCategory === "all" || p.category === currentCategory;
    const matchesSearch =
      !searchOpen ||
      !debouncedQuery ||
      p.name.toLowerCase().includes(debouncedQuery) ||
      p.category.toLowerCase().includes(debouncedQuery);
    return searchOpen && debouncedQuery ? matchesSearch : matchesCategory;
  });

  return (
    <>
      {/* ===== NAVBAR ===== */}
      <nav
        className="navbar"
        id="navbar"
        style={{ background: scrolled ? "rgba(10,10,10,0.98)" : "rgba(10,10,10,0.85)" }}
      >
        <div className="nav-left">
          <button className="nav-icon-btn" id="menuBtn" onClick={() => setMenuOpen(true)}>
            <i className="fas fa-bars"></i>
          </button>
        </div>
        <div className="nav-logo">
          <span className="logo-text">MetaDress</span>
          <span className="logo-sub">Virtual Style Studio</span>
        </div>
        <div className="nav-right">
          <button
            className="nav-icon-btn"
            id="searchToggleBtn"
            onClick={() => {
              setSearchOpen((o) => {
                if (!o) setTimeout(() => searchInputRef.current?.focus(), 50);
                return !o;
              });
            }}
          >
            <i className="fas fa-search"></i>
          </button>
          <button className="nav-icon-btn" id="checkoutBtn" title="Checkout" onClick={() => navigate({ to: "/checkout" })}>
            <i className="fas fa-credit-card"></i>
          </button>
          <button className="nav-icon-btn" id="wishlistBtn">
            <i className="far fa-heart"></i>
            <span className="badge" id="wishBadge">{wishlist.length}</span>
          </button>
          <button className="nav-icon-btn" id="cartBtn" onClick={() => setCartOpen(true)}>
            <i className="fas fa-shopping-bag"></i>
            <span className="badge" id="cartBadge">{cartCount}</span>
          </button>
          <button
            className="nav-icon-btn"
            id="userBtn"
            title={user ? `Hi, ${user.name}` : undefined}
            onClick={handleUserClick}
          >
            <i className="far fa-user"></i>
          </button>
        </div>
      </nav>

      {/* Search Bar */}
      <div className={`search-bar-wrap ${searchOpen ? "open" : ""}`} id="searchBarWrap">
        <div className="search-inner">
          <i className="fas fa-search"></i>
          <input
            type="text"
            id="searchInput"
            ref={searchInputRef}
            placeholder="Search dresses, blazers, sets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            id="searchClose"
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery("");
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* Side Menu */}
      <div className={`side-menu ${menuOpen ? "open" : ""}`} id="sideMenu">
        <div className="side-menu-header">
          <span className="logo-text">MetaDress</span>
          <button id="closeMenu" onClick={closeAll}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <nav className="side-nav">
          {SIDE_CATEGORIES.map((c) => (
            <a
              key={c.cat}
              href="#"
              className={currentCategory === c.cat ? "active" : ""}
              data-cat={c.cat}
              onClick={(e) => {
                e.preventDefault();
                setCurrentCategory(c.cat);
                closeAll();
              }}
            >
              {c.label}
            </a>
          ))}
        </nav>
        <div className="side-menu-footer">
          <Link to="/auth"><i className="far fa-user"></i> My Account</Link>
          <Link to="/checkout"><i className="fas fa-credit-card"></i> Checkout</Link>
          <Link to="/admin"><i className="fas fa-cog"></i> Admin</Link>
          <a href="#"><i className="far fa-heart"></i> Wishlist</a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen(false);
              setCartOpen(true);
            }}
          >
            <i className="fas fa-shopping-bag"></i> Cart
          </a>
        </div>
      </div>
      <div
        className={`overlay-bg ${menuOpen || cartOpen ? "show" : ""}`}
        id="overlayBg"
        onClick={closeAll}
      ></div>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">Fashion Forward, Body Positive</p>
          <h1 className="hero-title">MetaDress<br /><em>See it, Style it, Wear it</em></h1>
          <p className="hero-sub">AI-powered fit advice and AR try-on for every woman. Shop confidently with personalized styling and virtual dressing room magic.</p>
          <div className="hero-actions">
            <button
              className="btn-primary"
              onClick={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore Collection
            </button>
            <button
              className="btn-outline"
              id="heroARBtn"
              onClick={() => {
                setArPreselect(null);
                setArOpen(true);
              }}
            >
              <i className="fas fa-camera"></i> Launch AR Mirror
            </button>
          </div>
          <div className="hero-badges">
            <span className="hero-badge">150+ curated looks</span>
            <span className="hero-badge">Real-time AR try-on</span>
            <span className="hero-badge">Smart fit guidance</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-img-frame">
            <img src="/src/assets/Beige Abaya.jpeg" alt="Pakistani Abaya Fashion" />
            <div className="hero-tag">AR Ready</div>
          </div>
          <div className="hero-float-card">
            <span>✨</span>
            <div>
              <strong>Try Before Buy</strong>
              <p>AR Mirror enabled</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FIT ADVISOR ===== */}
      <section className="advisor-panel">
        <div className="advisor-copy">
          <p className="hero-eyebrow">Perfect Fit, Personalized</p>
          <h2>AI Size Recommendation</h2>
          <p>Enter your measurements and get a MetaDress size forecast with body shape guidance before you shop.</p>
        </div>
        <div className="advisor-form">
          <label>
            Height (cm)
            <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 168" />
          </label>
          <label>
            Weight (kg)
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 60" />
          </label>
          <label>
            Bust (cm)
            <input type="number" value={bust} onChange={(e) => setBust(e.target.value)} placeholder="e.g. 88" />
          </label>
          <label>
            Waist (cm)
            <input type="number" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="e.g. 68" />
          </label>
          <label>
            Hips (cm)
            <input type="number" value={hips} onChange={(e) => setHips(e.target.value)} placeholder="e.g. 95" />
          </label>
          <button className="btn-primary" onClick={recommendSize}>Get My Size</button>
          {recommendedSize ? (
            <div className="advisor-result">
              <strong>{recommendedSize}</strong>
              <p>MetaDress suggests styles that flatter your {bodyShape.toLowerCase()} silhouette.</p>
            </div>
          ) : null}
        </div>
      </section>

      {/* ===== EXPERIENCE HIGHLIGHTS ===== */}
      <section className="experience-cards">
        <div className="experience-card">
          <span>💫</span>
          <div>
            <h3>Instant Virtual Try-On</h3>
            <p>Experiment with outfits in real time using your camera and see how every choice feels.</p>
          </div>
        </div>
        <div className="experience-card">
          <span>📐</span>
          <div>
            <h3>Smart Fit Guidance</h3>
            <p>Receive personalized size recommendations that adapt to your unique measurements.</p>
          </div>
        </div>
        <div className="experience-card">
          <span>✨</span>
          <div>
            <h3>Curated Style Picks</h3>
            <p>Shop designs chosen for your body shape, occasion, and confidence-boosting silhouette.</p>
          </div>
        </div>
      </section>

      {/* ===== CATEGORY FILTERS ===== */}
      <div className="category-strip" id="shop">
        {CATEGORIES.map((c) => (
          <button
            key={c.cat}
            className={`cat-btn ${currentCategory === c.cat ? "active" : ""}`}
            data-cat={c.cat}
            onClick={() => setCurrentCategory(c.cat)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ===== PRODUCT GRID ===== */}
      <main className="shop-container">
        <div className="section-head">
          <h2>Our Collection</h2>
          <span id="productCount" className="product-count">
            {productsLoaded ? `${filtered.length} piece${filtered.length !== 1 ? "s" : ""}` : ""}
          </span>
        </div>
        <div className="product-grid" id="productGrid">
          {!productsLoaded ? (
            <div className="loading-grid">
              <div className="skeleton"></div><div className="skeleton"></div>
              <div className="skeleton"></div><div className="skeleton"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem", color: "var(--muted)" }}>
              <i className="fas fa-search" style={{ fontSize: "2rem", marginBottom: "1rem", display: "block" }}></i>
              <p>No products found</p>
            </div>
          ) : (
            filtered.map((p, i) => (
              <div className="product-card" key={p.id} style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="product-img-wrap">
                  <img src={p.image} alt={p.name} loading="lazy" />
                  <button
                    className={`product-wish-btn ${wishlist.includes(p.id) ? "active" : ""}`}
                    data-id={p.id}
                    onClick={() => toggleWishlist(p.id)}
                  >
                    <i className={`${wishlist.includes(p.id) ? "fas" : "far"} fa-heart`}></i>
                  </button>
                  <span className="product-ar-badge"><i className="fas fa-camera"></i> AR</span>
                </div>
                <div className="product-info">
                  <p className="product-name">{p.name}</p>
                  <div className="product-meta">
                    <span className="product-price">${p.price}</span>
                    <span className="product-rating">
                      <i className="fas fa-star"></i> {p.rating || "4.7"}
                    </span>
                  </div>
                  <div className="product-actions">
                    <button className="btn-add-cart" onClick={() => addToCart(p)}>
                      Add to Bag
                    </button>
                    <button className="btn-ar-try" onClick={() => openARWithOutfit(p.arOutfitId || p.id)}>
                      <i className="fas fa-camera"></i> Try
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* ===== CART DRAWER ===== */}
      <div className={`cart-drawer ${cartOpen ? "open" : ""}`} id="cartDrawer">
        <div className="drawer-header">
          <h3>Your Bag</h3>
          <button id="closeCart" onClick={closeAll}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="cart-items" id="cartItems">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <i className="fas fa-shopping-bag"></i>
              <p>Your bag is empty</p>
              <button className="btn-primary" onClick={closeAll}>Continue Shopping</button>
            </div>
          ) : (
            cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} />
                <div className="cart-item-info">
                  <p className="cart-item-name">{item.name}</p>
                  <p className="cart-item-price">${item.price}</p>
                  <div className="cart-item-qty">
                    <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="cart-footer" id="cartFooter" style={{ display: cart.length === 0 ? "none" : "block" }}>
          <div className="cart-total">
            <span>Total</span>
            <span id="cartTotal">${cartTotal.toFixed(2)}</span>
          </div>
          <Link to="/checkout" className="btn-primary full-width">Checkout</Link>
        </div>
      </div>

      {/* ===== AR MIRROR BUTTON (FLOATING) ===== */}
      <div className="ar-fab-wrap" id="arFabWrap">
        <div className={`ar-outfit-ring ${ringOpen ? "open" : ""}`} id="arOutfitRing">
          {arRingOutfits.map((o) => (
            <div className="ar-ring-item" key={o.id} onClick={() => openARWithOutfit(o.id)}>
              <span className="ar-ring-label">{o.name}</span>
              <div className="ar-ring-pill" style={{ background: o.gradient }}>
                {o.emoji}
              </div>
            </div>
          ))}
        </div>
        <button
          className="ar-fab"
          id="arFabBtn"
          title="Open AR Mirror"
          onClick={() => setRingOpen((o) => !o)}
        >
          <i className="fas fa-camera-retro"></i>
          <span className="ar-fab-label">AR</span>
          <div className="ar-pulse"></div>
        </button>
      </div>

      {/* ===== AR TRY-ON MODAL ===== */}
      <ARTryOn
        open={arOpen}
        preSelectOutfit={arPreselect}
        onClose={() => setArOpen(false)}
        showToast={showToast}
      />

      {/* ===== META AI CHAT ===== */}
      <AIChat />

      {/* Toast */}
      <div className={`toast ${toast.show ? "show" : ""}`} id="toast">{toast.message}</div>
    </>
  );
}

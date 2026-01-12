import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import CategoriesSection from "../components/CategoriesSection";
import ProductsSection from "../components/ProductsSection";
import AboutSection from "../components/AboutSection";
import Footer from "../components/Footer";
import AuthModal from "../components/AuthModal";
import CartSheet from "../components/CartSheet";
import ProductModal from "../components/ProductModal";
import CheckoutModal from "../components/CheckoutModal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category_id: "",
    search: "",
    min_price: "",
    max_price: "",
    condition: "",
    brand: "",
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    seedAndFetchData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const seedAndFetchData = async () => {
    try {
      await axios.post(`${API}/seed`);
    } catch (err) {
      // Already seeded
    }
    fetchCategories();
    fetchProducts();
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories`);
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.search) params.search = filters.search;
      if (filters.min_price) params.min_price = filters.min_price;
      if (filters.max_price) params.max_price = filters.max_price;
      if (filters.condition) params.condition = filters.condition;
      if (filters.brand) params.brand = filters.brand;

      const res = await axios.get(`${API}/products`, { params });
      setProducts(res.data);
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar 
        onAuthClick={() => setAuthOpen(true)} 
        onCartClick={() => setCartOpen(true)}
      />
      
      <main>
        <HeroSection />
        
        <CategoriesSection 
          categories={categories} 
          selectedCategory={filters.category_id}
          onSelectCategory={(id) => setFilters({ ...filters, category_id: id })}
        />
        
        <ProductsSection 
          products={products}
          categories={categories}
          loading={loading}
          filters={filters}
          setFilters={setFilters}
          onProductClick={setSelectedProduct}
        />
        
        <AboutSection />
      </main>
      
      <Footer />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      
      <CartSheet 
        open={cartOpen} 
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />
      
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <CheckoutModal 
        open={checkoutOpen} 
        onClose={() => setCheckoutOpen(false)}
      />
    </div>
  );
}

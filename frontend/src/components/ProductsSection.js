import { useState } from "react";
import { Search, SlidersHorizontal, Star, ShoppingBag, X, Check, Truck, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";

export default function ProductsSection({ products, categories, loading, filters, setFilters, onProductClick }) {
  const { addItem } = useCart();
  const [filterOpen, setFilterOpen] = useState(false);

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    if (product.stock <= 0) {
      toast.error("Out of stock");
      return;
    }
    addItem(product);
    toast.success("Added to cart");
  };

  const clearFilters = () => {
    setFilters({
      category_id: "",
      search: "",
      min_price: "",
      max_price: "",
      condition: "",
      brand: "",
    });
  };

  const hasActiveFilters = filters.search || filters.min_price || filters.max_price || filters.condition || filters.brand;

  // Command Palette Style Filters
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3 block">Price Range</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.min_price}
            onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
            className="command-input text-sm"
            data-testid="filter-min-price"
          />
          <span className="text-zinc-600">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.max_price}
            onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
            className="command-input text-sm"
            data-testid="filter-max-price"
          />
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3 block">Condition</label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "", label: "All" },
            { value: "new", label: "New" },
            { value: "used", label: "Used" },
            { value: "refurbished", label: "Refurb" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilters({ ...filters, condition: opt.value })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filters.condition === opt.value
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/[0.04] text-zinc-400 border border-transparent hover:bg-white/[0.06]"
              }`}
              data-testid={`filter-condition-${opt.value || 'all'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div>
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3 block">Brand</label>
        <input
          placeholder="Search brand..."
          value={filters.brand}
          onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
          className="command-input text-sm"
          data-testid="filter-brand"
        />
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
          data-testid="clear-filters"
        >
          <X className="h-4 w-4" />
          Clear filters
        </button>
      )}
    </div>
  );

  return (
    <section id="products" className="py-20 px-6" data-testid="products-section">
      <div className="max-w-7xl mx-auto">
        {/* Section Header with Search */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-2">Inventory</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Auto Parts</h2>
          </div>

          {/* Command Palette Search */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                placeholder="Search parts, brands..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="command-input pl-11 pr-4"
                data-testid="search-input"
              />
            </div>

            {/* Mobile Filter */}
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] rounded-xl h-11 w-11"
                  data-testid="mobile-filter-btn"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#111113] border-white/[0.06] w-80">
                <SheetHeader>
                  <SheetTitle className="text-white text-left">Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-8">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-10">
          {/* Desktop Filters - Command Palette Style */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <p className="text-white font-semibold mb-6">Filters</p>
              <FilterContent />
            </div>
          </div>

          {/* Products Grid - Flat Cards */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white/[0.02] rounded-2xl p-5 animate-pulse">
                    <div className="aspect-[4/3] bg-white/[0.04] rounded-xl mb-4" />
                    <div className="h-4 bg-white/[0.04] rounded-lg mb-2 w-3/4" />
                    <div className="h-3 bg-white/[0.04] rounded-lg w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-zinc-400 mb-4">No products found</p>
                <Button
                  variant="outline"
                  className="border-white/10 text-zinc-300 hover:bg-white/[0.06] rounded-xl"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => onProductClick(product)}
                    className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all"
                    data-testid={`product-card-${product.id}`}
                  >
                    {/* Image - No shadows */}
                    <div className="aspect-[4/3] relative overflow-hidden bg-white/[0.02]">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          No Image
                        </div>
                      )}
                      
                      {/* Smart Badges - Top right */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                        {product.condition === "new" && (
                          <span className="smart-badge">
                            <Check className="h-3 w-3" />
                            New
                          </span>
                        )}
                        {product.stock <= 5 && product.stock > 0 && (
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-semibold rounded-md uppercase">
                            Low Stock
                          </span>
                        )}
                      </div>

                      {/* Quick Add - Appears on hover */}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl h-10 w-10 shadow-lg"
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={product.stock <= 0}
                          data-testid={`add-to-cart-${product.id}`}
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Content - Clean & Minimal */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-1 group-hover:text-emerald-400 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-zinc-500 text-xs mt-0.5">{product.brand}</p>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-400 flex-shrink-0">
                          <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
                          <span className="text-xs font-medium">{product.avg_rating || "0"}</span>
                        </div>
                      </div>

                      {/* Price - Bold & Clear */}
                      <div className="flex items-baseline gap-1.5 mt-3">
                        <span className="text-xl font-bold text-white">{product.price.toLocaleString()}</span>
                        <span className="text-xs text-zinc-500">ETB</span>
                      </div>

                      {/* Minimal info badges */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.06]">
                        <div className="flex items-center gap-1 text-zinc-500">
                          <Truck className="h-3 w-3" strokeWidth={1.5} />
                          <span className="text-[10px]">Express</span>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-500">
                          <Shield className="h-3 w-3" strokeWidth={1.5} />
                          <span className="text-[10px]">Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

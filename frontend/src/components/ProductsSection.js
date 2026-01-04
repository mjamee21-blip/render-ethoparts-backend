import { useState } from "react";
import { Search, SlidersHorizontal, Star, ShoppingCart, X } from "lucide-react";
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
    toast.success(`${product.name} added to cart`);
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

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <label className="text-sm font-medium text-slate-300 mb-2 block">Price Range (ETB)</label>
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.min_price}
            onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
            className="bg-slate-800 border-slate-700 text-white"
            data-testid="filter-min-price"
          />
          <span className="text-slate-500">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.max_price}
            onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
            className="bg-slate-800 border-slate-700 text-white"
            data-testid="filter-max-price"
          />
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="text-sm font-medium text-slate-300 mb-2 block">Condition</label>
        <Select
          value={filters.condition}
          onValueChange={(value) => setFilters({ ...filters, condition: value === "all" ? "" : value })}
        >
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white" data-testid="filter-condition">
            <SelectValue placeholder="All Conditions" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Conditions</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="refurbished">Refurbished</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Brand */}
      <div>
        <label className="text-sm font-medium text-slate-300 mb-2 block">Brand</label>
        <Input
          placeholder="Search brand..."
          value={filters.brand}
          onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
          className="bg-slate-800 border-slate-700 text-white"
          data-testid="filter-brand"
        />
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          className="w-full border-slate-600 text-slate-300"
          onClick={clearFilters}
          data-testid="clear-filters"
        >
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <section id="products" className="py-20 bg-slate-950" data-testid="products-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <span className="text-emerald-400 text-sm font-semibold tracking-widest uppercase">
              Our Inventory
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white mt-2 tracking-tight">
              Auto Parts
            </h2>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search parts..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="search-input"
              />
            </div>

            {/* Mobile Filter Button */}
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="md:hidden border-slate-700 text-slate-300"
                  data-testid="mobile-filter-btn"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-slate-900 border-slate-800">
                <SheetHeader>
                  <SheetTitle className="text-white">Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-24">
              <h3 className="text-white font-bold mb-6">Filters</h3>
              <FilterContent />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse">
                    <div className="aspect-square bg-slate-800 rounded-lg mb-4" />
                    <div className="h-4 bg-slate-800 rounded mb-2" />
                    <div className="h-4 bg-slate-800 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-400 text-lg">No products found</p>
                <Button
                  variant="outline"
                  className="mt-4 border-slate-600 text-slate-300"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => onProductClick(product)}
                    className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden card-hover cursor-pointer"
                    data-testid={`product-card-${product.id}`}
                  >
                    {/* Image */}
                    <div className="aspect-square relative overflow-hidden bg-slate-800">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          No Image
                        </div>
                      )}
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <Badge className={`${
                          product.condition === "new" ? "bg-emerald-500" :
                          product.condition === "used" ? "bg-amber-500" : "bg-blue-500"
                        } text-white capitalize`}>
                          {product.condition}
                        </Badge>
                        {product.stock <= 5 && product.stock > 0 && (
                          <Badge className="bg-red-500 text-white">Low Stock</Badge>
                        )}
                        {product.stock <= 0 && (
                          <Badge className="bg-slate-700 text-slate-300">Out of Stock</Badge>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                            {product.name}
                          </h3>
                          <p className="text-sm text-slate-400">{product.brand}</p>
                        </div>
                        <div className="flex items-center text-amber-400">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm ml-1">{product.avg_rating || 0}</span>
                        </div>
                      </div>

                      <p className="text-slate-400 text-sm line-clamp-2">{product.description}</p>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-2xl font-black text-white">
                          {product.price.toLocaleString()} <span className="text-sm font-normal text-slate-400">ETB</span>
                        </span>
                        <Button
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={product.stock <= 0}
                          data-testid={`add-to-cart-${product.id}`}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
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

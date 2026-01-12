import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Star, ShoppingBag, Truck, Shield, Minus, Plus, Check, Zap } from "lucide-react";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductModal({ product, onClose }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [product.id]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${API}/products/${product.id}/reviews`);
      setReviews(res.data);
    } catch (err) {
      console.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      toast.error("Out of stock");
      return;
    }
    addItem(product, quantity);
    toast.success("Added to cart");
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#111113] border-white/[0.06] max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl" data-testid="product-modal">
        <DialogHeader>
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8 p-2">
          {/* Images - Clean */}
          <div className="space-y-3">
            <div className="aspect-square rounded-xl overflow-hidden bg-white/[0.02]">
              {product.images?.[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  No Image
                </div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? "border-emerald-500" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details - Minimal */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              {product.condition === "new" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold rounded-md uppercase mb-3">
                  <Check className="h-3 w-3" /> New
                </span>
              )}
              <h2 className="text-2xl font-bold text-white tracking-tight">{product.name}</h2>
              <p className="text-zinc-500 mt-1">{product.brand}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-current text-amber-400" />
                <span className="text-white font-medium">{product.avg_rating || 0}</span>
              </div>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-500 text-sm">{product.review_count} reviews</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{product.price.toLocaleString()}</span>
              <span className="text-zinc-500">ETB</span>
            </div>

            {/* Description */}
            <p className="text-zinc-400 leading-relaxed text-sm">{product.description}</p>

            {/* Compatible Cars */}
            {product.compatible_cars?.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Compatible with</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.compatible_cars.map((car, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-white/[0.04] text-zinc-300 text-xs rounded-lg">
                      {car}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-emerald-400 text-sm">
                    {product.stock > 10 ? "In Stock" : `Only ${product.stock} left`}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-red-400 text-sm">Out of Stock</span>
                </>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center bg-white/[0.04] rounded-xl">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-zinc-400 hover:text-white hover:bg-transparent rounded-xl"
                  data-testid="modal-decrease-qty"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center text-white font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="text-zinc-400 hover:text-white hover:bg-transparent rounded-xl"
                  disabled={quantity >= product.stock}
                  data-testid="modal-increase-qty"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white h-12 font-medium rounded-xl"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                data-testid="modal-add-to-cart"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>

            {/* Features - Ultra minimal */}
            <div className="flex items-center gap-6 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 text-zinc-500">
                <Truck className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
                <span className="text-xs">Express Shipping</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <Shield className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
                <span className="text-xs">Verified Seller</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <Zap className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
                <span className="text-xs">99% Match</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews - Clean */}
        <div className="mt-8 pt-8 border-t border-white/[0.06] px-2">
          <h3 className="text-lg font-semibold text-white mb-6">Reviews</h3>
          {loading ? (
            <div className="text-zinc-500 text-sm">Loading...</div>
          ) : reviews.length === 0 ? (
            <div className="text-zinc-500 text-sm">No reviews yet</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 bg-white/[0.02] rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-emerald-400 text-xs font-semibold">{review.user_name.charAt(0)}</span>
                      </div>
                      <span className="text-white text-sm font-medium">{review.user_name}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < review.rating ? "fill-current text-amber-400" : "text-zinc-700"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-zinc-400 text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

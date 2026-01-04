import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star, ShoppingCart, Truck, Shield, Minus, Plus, X } from "lucide-react";
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
    toast.success(`${quantity} x ${product.name} added to cart`);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="product-modal">
        <DialogHeader>
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-800">
              {product.images?.[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
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
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      selectedImage === idx ? "border-emerald-500" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <Badge className={`${
                    product.condition === "new" ? "bg-emerald-500" :
                    product.condition === "used" ? "bg-amber-500" : "bg-blue-500"
                  } text-white capitalize mb-2`}>
                    {product.condition}
                  </Badge>
                  <h2 className="text-2xl font-bold text-white">{product.name}</h2>
                  <p className="text-slate-400 mt-1">{product.brand}</p>
                </div>
              </div>

              <div className="flex items-center mt-4 space-x-4">
                <div className="flex items-center text-amber-400">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="ml-1 font-medium">{product.avg_rating || 0}</span>
                  <span className="text-slate-500 ml-1">({product.review_count} reviews)</span>
                </div>
              </div>
            </div>

            <div className="text-4xl font-black text-white">
              {product.price.toLocaleString()} <span className="text-lg font-normal text-slate-400">ETB</span>
            </div>

            <p className="text-slate-300 leading-relaxed">{product.description}</p>

            {/* Compatible Cars */}
            {product.compatible_cars?.length > 0 && (
              <div>
                <h4 className="text-white font-semibold mb-2">Compatible with:</h4>
                <div className="flex flex-wrap gap-2">
                  {product.compatible_cars.map((car, idx) => (
                    <Badge key={idx} variant="outline" className="border-slate-600 text-slate-300">
                      {car}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
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
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-slate-700 rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-slate-300"
                  data-testid="modal-decrease-qty"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center text-white">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="text-slate-300"
                  disabled={quantity >= product.stock}
                  data-testid="modal-increase-qty"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-6 font-bold btn-glow"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                data-testid="modal-add-to-cart"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div className="flex items-center space-x-2 text-slate-400">
                <Truck className="h-5 w-5 text-emerald-400" />
                <span className="text-sm">Fast Delivery</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400">
                <Shield className="h-5 w-5 text-emerald-400" />
                <span className="text-sm">Quality Guaranteed</span>
              </div>
            </div>

            {/* Seller Info */}
            {product.seller_name && (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Sold by</p>
                <p className="text-white font-medium">{product.seller_name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 border-t border-slate-800 pt-8">
          <h3 className="text-xl font-bold text-white mb-4">Customer Reviews</h3>
          {loading ? (
            <div className="text-slate-400">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="text-slate-400">No reviews yet. Be the first to review!</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {review.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white font-medium">{review.user_name}</span>
                    </div>
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? "fill-current" : "text-slate-600"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-300 mt-2">{review.comment}</p>
                  <p className="text-slate-500 text-sm mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

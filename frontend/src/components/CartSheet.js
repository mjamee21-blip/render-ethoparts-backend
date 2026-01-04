import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Button } from "./ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function CartSheet({ open, onClose, onCheckout }) {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const { user } = useAuth();

  const handleCheckout = () => {
    if (!user) {
      toast.error("Please sign in to checkout");
      return;
    }
    onCheckout();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="bg-slate-900 border-slate-800 w-full sm:max-w-md" data-testid="cart-sheet">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center">
            <ShoppingBag className="h-5 w-5 mr-2" />
            Shopping Cart ({items.length})
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full mt-6">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <ShoppingBag className="h-16 w-16 text-slate-600 mb-4" />
              <p className="text-slate-400 text-lg">Your cart is empty</p>
              <p className="text-slate-500 text-sm mt-2">Add some auto parts to get started</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 bg-slate-800/50 rounded-lg p-3"
                    data-testid={`cart-item-${item.product.id}`}
                  >
                    {/* Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-sm line-clamp-2">{item.product.name}</h4>
                      <p className="text-emerald-400 font-bold mt-1">
                        {item.product.price.toLocaleString()} ETB
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 border-slate-600"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            data-testid={`decrease-qty-${item.product.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-white w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 border-slate-600"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            data-testid={`increase-qty-${item.product.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          onClick={() => removeItem(item.product.id)}
                          data-testid={`remove-item-${item.product.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-800 pt-4 mt-4 space-y-4">
                {/* Clear Cart */}
                <Button
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-red-400"
                  onClick={clearCart}
                  data-testid="clear-cart"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cart
                </Button>

                {/* Total */}
                <div className="flex items-center justify-between text-lg">
                  <span className="text-slate-300">Total:</span>
                  <span className="text-white font-bold" data-testid="cart-total">
                    {total.toLocaleString()} ETB
                  </span>
                </div>

                {/* Checkout Button */}
                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 text-lg font-bold btn-glow"
                  onClick={handleCheckout}
                  data-testid="checkout-button"
                >
                  Proceed to Checkout
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

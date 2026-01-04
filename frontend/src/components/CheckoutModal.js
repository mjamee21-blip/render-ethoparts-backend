import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, CreditCard, Smartphone, CheckCircle, Copy } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CheckoutModal({ open, onClose }) {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  
  const [form, setForm] = useState({
    shipping_address: "",
    shipping_city: "Addis Ababa",
    shipping_phone: user?.phone || "",
    payment_method: "telebirr",
    notes: "",
  });

  const [paymentVerification, setPaymentVerification] = useState({
    transaction_ref: "",
  });

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const orderData = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        ...form,
      };

      const res = await axios.post(`${API}/orders`, orderData);
      setOrder(res.data);
      setStep(2);
      toast.success("Order placed successfully!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/payments/verify`, {
        order_id: order.id,
        transaction_ref: paymentVerification.transaction_ref,
      });
      setStep(3);
      clearCart();
      toast.success("Payment verification submitted!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to verify payment");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleClose = () => {
    setStep(1);
    setOrder(null);
    setPaymentVerification({ transaction_ref: "" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-lg" data-testid="checkout-modal">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl font-bold">
            {step === 1 && "Checkout"}
            {step === 2 && "Complete Payment"}
            {step === 3 && "Order Confirmed"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Shipping Details */}
        {step === 1 && (
          <form onSubmit={handleSubmitOrder} className="space-y-6 mt-4">
            {/* Order Summary */}
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              <h4 className="text-white font-semibold mb-3">Order Summary</h4>
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-slate-300">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="text-white">{(item.product.price * item.quantity).toLocaleString()} ETB</span>
                </div>
              ))}
              <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-emerald-400">{total.toLocaleString()} ETB</span>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Shipping Address</Label>
                <Textarea
                  value={form.shipping_address}
                  onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="Enter your delivery address"
                  required
                  data-testid="shipping-address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">City</Label>
                  <Input
                    value={form.shipping_city}
                    onChange={(e) => setForm({ ...form, shipping_city: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    required
                    data-testid="shipping-city"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Phone</Label>
                  <Input
                    value={form.shipping_phone}
                    onChange={(e) => setForm({ ...form, shipping_phone: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    placeholder="0912345678"
                    required
                    data-testid="shipping-phone"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Notes (Optional)</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="Any special instructions..."
                  data-testid="order-notes"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label className="text-slate-300 mb-3 block">Payment Method</Label>
              <RadioGroup
                value={form.payment_method}
                onValueChange={(value) => setForm({ ...form, payment_method: value })}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <RadioGroupItem value="telebirr" id="telebirr" data-testid="payment-telebirr" />
                  <Label htmlFor="telebirr" className="flex items-center cursor-pointer flex-1">
                    <Smartphone className="h-5 w-5 text-emerald-400 mr-2" />
                    <div>
                      <span className="text-white font-medium">Telebirr</span>
                      <p className="text-slate-400 text-xs">Pay with Telebirr mobile money</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <RadioGroupItem value="manual" id="manual" data-testid="payment-manual" />
                  <Label htmlFor="manual" className="flex items-center cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5 text-amber-400 mr-2" />
                    <div>
                      <span className="text-white font-medium">Bank Transfer</span>
                      <p className="text-slate-400 text-xs">Pay via bank transfer</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 font-bold btn-glow"
              disabled={loading}
              data-testid="place-order-btn"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Place Order - ${total.toLocaleString()} ETB`}
            </Button>
          </form>
        )}

        {/* Step 2: Payment Instructions */}
        {step === 2 && order && (
          <div className="space-y-6 mt-4">
            {/* Order Number */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-sm">Order Number</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-emerald-400 text-2xl font-bold">{order.order_number}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(order.order_number)}
                >
                  <Copy className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
              <h4 className="text-white font-semibold">Payment Instructions</h4>
              
              {form.payment_method === "telebirr" ? (
                <div className="space-y-3 text-sm">
                  <p className="text-slate-300">1. Open your Telebirr app</p>
                  <p className="text-slate-300">2. Go to "Send Money" or "Pay Merchant"</p>
                  <p className="text-slate-300">3. Send <span className="text-emerald-400 font-bold">{order.total_amount.toLocaleString()} ETB</span> to:</p>
                  <div className="bg-slate-700 p-3 rounded-lg flex items-center justify-between">
                    <span className="text-white font-mono">0777770757</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("0777770757")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-slate-300">4. Include order number <span className="text-amber-400">{order.order_number}</span> in the message</p>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <p className="text-slate-300">Transfer <span className="text-emerald-400 font-bold">{order.total_amount.toLocaleString()} ETB</span> to:</p>
                  <div className="bg-slate-700 p-3 rounded-lg space-y-2">
                    <p className="text-slate-300">Bank: Commercial Bank of Ethiopia</p>
                    <p className="text-slate-300">Account: 1000123456789</p>
                    <p className="text-slate-300">Name: Etho Parts PLC</p>
                  </div>
                  <p className="text-slate-300">Include order number <span className="text-amber-400">{order.order_number}</span> as reference</p>
                </div>
              )}
            </div>

            {/* Verify Payment */}
            <form onSubmit={handleVerifyPayment} className="space-y-4">
              <div>
                <Label className="text-slate-300">Transaction Reference / Receipt Number</Label>
                <Input
                  value={paymentVerification.transaction_ref}
                  onChange={(e) => setPaymentVerification({ ...paymentVerification, transaction_ref: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="Enter your payment reference"
                  required
                  data-testid="transaction-ref"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 font-bold"
                disabled={loading}
                data-testid="verify-payment-btn"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "I've Made the Payment"}
              </Button>
            </form>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && order && (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-emerald-400" />
            </div>
            
            <div>
              <h3 className="text-white text-xl font-bold">Order Confirmed!</h3>
              <p className="text-slate-400 mt-2">
                Your payment verification has been submitted. We'll confirm your order shortly.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Order Number</p>
              <p className="text-emerald-400 text-2xl font-bold">{order.order_number}</p>
            </div>

            <p className="text-slate-400 text-sm">
              You can track your order using the order number above at our Track Order page.
            </p>

            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={handleClose}
              data-testid="close-checkout"
            >
              Continue Shopping
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

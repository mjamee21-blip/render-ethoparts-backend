import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, CheckCircle, Copy, Upload, CreditCard, Building, Smartphone } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CheckoutModal({ open, onClose }) {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  
  const [form, setForm] = useState({
    shipping_address: "",
    shipping_city: "Addis Ababa",
    shipping_phone: user?.phone || "",
    notes: "",
  });

  const [receiptData, setReceiptData] = useState({
    transaction_ref: "",
    receipt_image: null,
  });

  useEffect(() => {
    if (open && items.length > 0) {
      fetchSellerPaymentMethods();
    }
  }, [open, items]);

  const fetchSellerPaymentMethods = async () => {
    try {
      // Get unique seller IDs from cart items
      const sellerIds = [...new Set(items.map(item => item.product.seller_id))];
      // For simplicity, use first seller's payment methods
      if (sellerIds.length > 0) {
        const res = await axios.get(`${API}/seller/${sellerIds[0]}/payment-methods`);
        setPaymentMethods(res.data);
        if (res.data.length > 0) {
          setSelectedMethod(res.data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch payment methods");
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }
    setLoading(true);
    
    try {
      const orderData = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        payment_method_id: selectedMethod.id,
        ...form,
      };

      const res = await axios.post(`${API}/orders`, orderData);
      setOrder(res.data);
      setStep(2);
      toast.success("Order placed! Please complete payment.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large. Max 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptData({ ...receiptData, receipt_image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadReceipt = async (e) => {
    e.preventDefault();
    if (!receiptData.transaction_ref) {
      toast.error("Please enter transaction reference");
      return;
    }
    setLoading(true);

    try {
      await axios.post(`${API}/payments/upload-receipt`, {
        order_id: order.id,
        transaction_ref: receiptData.transaction_ref,
        receipt_image: receiptData.receipt_image,
      });
      setStep(3);
      clearCart();
      toast.success("Receipt uploaded! Awaiting verification.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to upload receipt");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const handleClose = () => {
    setStep(1);
    setOrder(null);
    setReceiptData({ transaction_ref: "", receipt_image: null });
    onClose();
  };

  const getMethodIcon = (type) => {
    switch (type) {
      case "mobile_money": return <Smartphone className="h-5 w-5 text-emerald-400" />;
      case "bank": return <Building className="h-5 w-5 text-blue-400" />;
      default: return <CreditCard className="h-5 w-5 text-amber-400" />;
    }
  };

  const commission = total * 0.10;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="checkout-modal">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl font-bold">
            {step === 1 && "Checkout"}
            {step === 2 && "Upload Payment Receipt"}
            {step === 3 && "Order Confirmed"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Shipping & Payment Method Selection */}
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
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <Label className="text-slate-300 mb-3 block">Select Payment Method</Label>
              {paymentMethods.length === 0 ? (
                <p className="text-slate-400 text-sm">No payment methods available from seller</p>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethod(method)}
                      className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedMethod?.id === method.id
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-slate-700 bg-slate-800 hover:border-slate-600"
                      }`}
                      data-testid={`payment-method-${method.id}`}
                    >
                      {method.logo_url ? (
                        <img src={method.logo_url} alt={method.name} className="w-10 h-10 rounded object-contain bg-white p-1" />
                      ) : (
                        getMethodIcon(method.type)
                      )}
                      <div className="flex-1">
                        <p className="text-white font-medium">{method.name}</p>
                        <p className="text-slate-400 text-xs capitalize">{method.type.replace("_", " ")}</p>
                      </div>
                      {selectedMethod?.id === method.id && (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 font-bold btn-glow"
              disabled={loading || !selectedMethod}
              data-testid="place-order-btn"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Place Order - ${total.toLocaleString()} ETB`}
            </Button>
          </form>
        )}

        {/* Step 2: Payment Instructions & Receipt Upload */}
        {step === 2 && order && selectedMethod && (
          <div className="space-y-6 mt-4">
            {/* Order Number */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-sm">Order Number</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-emerald-400 text-2xl font-bold">{order.order_number}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(order.order_number)}>
                  <Copy className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-3">
                {selectedMethod.logo_url ? (
                  <img src={selectedMethod.logo_url} alt={selectedMethod.name} className="w-12 h-12 rounded object-contain bg-white p-1" />
                ) : (
                  getMethodIcon(selectedMethod.type)
                )}
                <div>
                  <h4 className="text-white font-semibold">{selectedMethod.name}</h4>
                  <p className="text-slate-400 text-sm capitalize">{selectedMethod.type.replace("_", " ")}</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm border-t border-slate-700 pt-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount to Pay:</span>
                  <span className="text-emerald-400 font-bold text-lg">{order.total_amount.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Account Name:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white">{selectedMethod.account_name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(selectedMethod.account_name)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono">{selectedMethod.account_number}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(selectedMethod.account_number)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {selectedMethod.instructions && (
                  <p className="text-slate-400 text-xs mt-2">{selectedMethod.instructions}</p>
                )}
              </div>
            </div>

            {/* Receipt Upload Form */}
            <form onSubmit={handleUploadReceipt} className="space-y-4">
              <div>
                <Label className="text-slate-300">Transaction Reference / Receipt Number</Label>
                <Input
                  value={receiptData.transaction_ref}
                  onChange={(e) => setReceiptData({ ...receiptData, transaction_ref: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="Enter your payment reference"
                  required
                  data-testid="transaction-ref"
                />
              </div>

              <div>
                <Label className="text-slate-300">Upload Receipt (Optional but recommended)</Label>
                <div className="mt-1">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700/50 transition-colors">
                    {receiptData.receipt_image ? (
                      <div className="text-center">
                        <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-emerald-400 text-sm">Receipt uploaded</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Click to upload receipt image</p>
                        <p className="text-slate-500 text-xs">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                      data-testid="receipt-upload"
                    />
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 font-bold"
                disabled={loading}
                data-testid="upload-receipt-btn"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Payment Receipt"}
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
              <h3 className="text-white text-xl font-bold">Receipt Submitted!</h3>
              <p className="text-slate-400 mt-2">
                Your payment is being verified. We'll update your order status shortly.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Order Number</p>
              <p className="text-emerald-400 text-2xl font-bold">{order.order_number}</p>
            </div>

            <p className="text-slate-400 text-sm">
              Track your order anytime using the order number above.
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

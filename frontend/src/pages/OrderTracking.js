import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  ArrowLeft,
  Search,
  Package,
  CheckCircle,
  Truck,
  Clock,
  MapPin,
  Loader2,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function OrderTracking() {
  const { orderNumber: paramOrderNumber } = useParams();
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState(paramOrderNumber || "");
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (paramOrderNumber) {
      trackOrder(paramOrderNumber);
    }
  }, [paramOrderNumber]);

  const trackOrder = async (number) => {
    if (!number.trim()) {
      toast.error("Please enter an order number");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const res = await axios.get(`${API}/orders/track/${number.trim()}`);
      setOrderInfo(res.data);
    } catch (err) {
      setOrderInfo(null);
      toast.error("Order not found");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (orderNumber.trim()) {
      navigate(`/track/${orderNumber.trim()}`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Order Placed":
      case "pending":
        return <Clock className="h-5 w-5" />;
      case "confirmed":
      case "Payment Confirmed":
        return <CheckCircle className="h-5 w-5" />;
      case "processing":
        return <Package className="h-5 w-5" />;
      case "shipped":
        return <Truck className="h-5 w-5" />;
      case "delivered":
        return <MapPin className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("delivered")) return "text-emerald-400 bg-emerald-500/20";
    if (statusLower.includes("shipped")) return "text-cyan-400 bg-cyan-500/20";
    if (statusLower.includes("confirmed") || statusLower.includes("payment")) return "text-blue-400 bg-blue-500/20";
    if (statusLower.includes("processing")) return "text-purple-400 bg-purple-500/20";
    return "text-amber-400 bg-amber-500/20";
  };

  return (
    <div className="min-h-screen bg-slate-950" data-testid="order-tracking-page">
      {/* Header */}
      <div className="ethio-stripe" />
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-slate-400">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Track Your Order</h1>
              <p className="text-slate-400 text-sm">Enter your order number to track shipment</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Form */}
        <form onSubmit={handleSubmit} className="flex gap-4 mb-8">
          <Input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Enter order number (e.g., EP-20241204-ABC123)"
            className="bg-slate-800 border-slate-700 text-white flex-1"
            data-testid="order-number-input"
          />
          <Button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600"
            disabled={loading}
            data-testid="track-order-btn"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Track
              </>
            )}
          </Button>
        </form>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
            <p className="text-slate-400 mt-4">Looking up your order...</p>
          </div>
        ) : orderInfo ? (
          <div className="space-y-6" data-testid="order-tracking-results">
            {/* Order Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Order Number</p>
                  <p className="text-white text-2xl font-bold">{orderInfo.order_number}</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Placed on {new Date(orderInfo.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`${
                    orderInfo.order_status === "delivered" ? "bg-emerald-500" :
                    orderInfo.order_status === "shipped" ? "bg-cyan-500" :
                    orderInfo.order_status === "cancelled" ? "bg-red-500" :
                    "bg-amber-500"
                  } text-white capitalize text-sm px-4 py-1`}>
                    {orderInfo.order_status}
                  </Badge>
                  <Badge className={`${
                    orderInfo.payment_status === "completed" ? "bg-emerald-500" :
                    "bg-amber-500"
                  } text-white capitalize text-sm px-4 py-1`}>
                    Payment: {orderInfo.payment_status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-bold text-lg mb-6">Order Timeline</h3>
              <div className="space-y-0">
                {orderInfo.tracking_info?.map((track, idx) => (
                  <div key={idx} className="flex gap-4">
                    {/* Icon & Line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(track.status)}`}>
                        {getStatusIcon(track.status)}
                      </div>
                      {idx < orderInfo.tracking_info.length - 1 && (
                        <div className="w-0.5 h-16 bg-slate-700" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-8">
                      <p className="text-white font-semibold">{track.status}</p>
                      <p className="text-slate-400 text-sm">{track.note}</p>
                      <p className="text-slate-500 text-xs mt-1">
                        {new Date(track.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Help */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
              <p className="text-slate-400">
                Need help with your order? Contact us at{" "}
                <a href="tel:0777770757" className="text-emerald-400 font-semibold">
                  0777770757
                </a>
              </p>
            </div>
          </div>
        ) : searched ? (
          <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
            <Package className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold">Order Not Found</h3>
            <p className="text-slate-400 mt-2">
              Please check your order number and try again
            </p>
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
            <Truck className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold">Track Your Order</h3>
            <p className="text-slate-400 mt-2">
              Enter your order number above to see the latest status
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

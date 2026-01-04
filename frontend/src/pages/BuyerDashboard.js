import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  Truck,
  Star,
  ShoppingBag,
  LogOut,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BuyerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState({ open: false, productId: null, productName: "" });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    if (user.role !== "buyer") {
      navigate(user.role === "admin" ? "/admin" : "/seller");
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API}/orders`);
      setOrders(res.data);
    } catch (err) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/products/${reviewModal.productId}/reviews`, {
        product_id: reviewModal.productId,
        ...reviewForm,
      });
      toast.success("Review submitted!");
      setReviewModal({ open: false, productId: null, productName: "" });
      setReviewForm({ rating: 5, comment: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit review");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-amber-500",
      confirmed: "bg-blue-500",
      processing: "bg-purple-500",
      shipped: "bg-cyan-500",
      delivered: "bg-emerald-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-slate-500";
  };

  const getPaymentColor = (status) => {
    const colors = {
      pending: "bg-amber-500",
      pending_verification: "bg-blue-500",
      completed: "bg-emerald-500",
      failed: "bg-red-500",
    };
    return colors[status] || "bg-slate-500";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950" data-testid="buyer-dashboard">
      {/* Header */}
      <div className="ethio-stripe" />
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-slate-400">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">My Dashboard</h1>
                <p className="text-slate-400 text-sm">Welcome, {user.name}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="orders" className="data-[state=active]:bg-emerald-500">
              <Package className="h-4 w-4 mr-2" />
              My Orders
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-emerald-500">
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                <ShoppingBag className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold">No orders yet</h3>
                <p className="text-slate-400 mt-2">Start shopping to see your orders here</p>
                <Link to="/">
                  <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600">
                    Browse Products
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-6"
                    data-testid={`order-${order.id}`}
                  >
                    {/* Order Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-slate-400 text-sm">Order Number</p>
                        <p className="text-white font-bold text-lg">{order.order_number}</p>
                        <p className="text-slate-500 text-sm">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={`${getStatusColor(order.order_status)} text-white capitalize`}>
                          {order.order_status}
                        </Badge>
                        <Badge className={`${getPaymentColor(order.payment_status)} text-white capitalize`}>
                          {order.payment_status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3 border-t border-slate-800 pt-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div>
                            <p className="text-white">{item.product_name}</p>
                            <p className="text-slate-400 text-sm">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">{item.total.toLocaleString()} ETB</p>
                            {order.order_status === "delivered" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-amber-400 hover:text-amber-300"
                                onClick={() =>
                                  setReviewModal({
                                    open: true,
                                    productId: item.product_id,
                                    productName: item.product_name,
                                  })
                                }
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer */}
                    <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-4">
                      <div>
                        <p className="text-slate-400 text-sm">Total</p>
                        <p className="text-emerald-400 font-bold text-xl">
                          {order.total_amount.toLocaleString()} ETB
                        </p>
                      </div>
                      <Link to={`/track/${order.order_number}`}>
                        <Button variant="outline" className="border-slate-700 text-slate-300">
                          <Truck className="h-4 w-4 mr-2" />
                          Track Order
                        </Button>
                      </Link>
                    </div>

                    {/* Tracking Timeline */}
                    {order.tracking_info && order.tracking_info.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <p className="text-slate-400 text-sm mb-3">Order Timeline</p>
                        <div className="space-y-2">
                          {order.tracking_info.slice(-3).map((track, idx) => (
                            <div key={idx} className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                              <span className="text-slate-300 text-sm">{track.status}</span>
                              <span className="text-slate-500 text-xs">
                                {new Date(track.timestamp).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-4">Profile Information</h3>
              <div className="grid gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Name</p>
                  <p className="text-white">{user.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Email</p>
                  <p className="text-white">{user.email}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Phone</p>
                  <p className="text-white">{user.phone}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Member Since</p>
                  <p className="text-white">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Review Modal */}
      <Dialog open={reviewModal.open} onOpenChange={(open) => setReviewModal({ ...reviewModal, open })}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Review {reviewModal.productName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitReview} className="space-y-4 mt-4">
            <div>
              <p className="text-slate-300 text-sm mb-2">Rating</p>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= reviewForm.rating
                          ? "text-amber-400 fill-current"
                          : "text-slate-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-slate-300 text-sm mb-2">Comment</p>
              <Textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Write your review..."
                required
              />
            </div>
            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600">
              Submit Review
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

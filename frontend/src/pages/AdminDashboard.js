import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  ArrowLeft,
  Users,
  Package,
  ShoppingBag,
  DollarSign,
  LogOut,
  Check,
  X,
  Loader2,
  CreditCard,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    if (user.role !== "admin") {
      navigate(user.role === "seller" ? "/seller" : "/dashboard");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, ordersRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/users`),
        axios.get(`${API}/orders`),
        axios.get(`${API}/payments/pending`),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setOrders(ordersRes.data);
      setPendingPayments(paymentsRes.data);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentId) => {
    try {
      await axios.post(`${API}/payments/${paymentId}/confirm`);
      toast.success("Payment confirmed!");
      fetchData();
    } catch (err) {
      toast.error("Failed to confirm payment");
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status`, { status });
      toast.success("Order status updated");
      fetchData();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950" data-testid="admin-dashboard">
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
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-slate-400 text-sm">Manage Etho Parts</p>
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

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-white">{stats.total_users || 0}</p>
              </div>
              <Users className="h-10 w-10 text-emerald-400" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Products</p>
                <p className="text-3xl font-bold text-white">{stats.total_products || 0}</p>
              </div>
              <Package className="h-10 w-10 text-amber-400" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Orders</p>
                <p className="text-3xl font-bold text-white">{stats.total_orders || 0}</p>
              </div>
              <ShoppingBag className="h-10 w-10 text-blue-400" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Revenue</p>
                <p className="text-2xl font-bold text-white">{(stats.total_revenue || 0).toLocaleString()}</p>
              </div>
              <DollarSign className="h-10 w-10 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Pending Payments Alert */}
        {pendingPayments.length > 0 && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-6 w-6 text-amber-400" />
              <span className="text-amber-400 font-semibold">
                {pendingPayments.length} payment(s) pending verification
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="payments" className="data-[state=active]:bg-emerald-500">
              <CreditCard className="h-4 w-4 mr-2" />
              Payments ({pendingPayments.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-emerald-500">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-emerald-500">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <h3 className="text-white text-lg font-bold">Pending Payment Verifications</h3>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
              </div>
            ) : pendingPayments.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                <Check className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold">All caught up!</h3>
                <p className="text-slate-400 mt-2">No pending payments to verify</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-slate-400 text-sm">Order ID</p>
                        <p className="text-white font-semibold">{payment.order_id}</p>
                        <p className="text-slate-500 text-sm mt-2">
                          Transaction Ref: <span className="text-amber-400">{payment.transaction_ref}</span>
                        </p>
                        <p className="text-slate-500 text-sm">
                          {new Date(payment.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => confirmPayment(payment.id)}
                          className="bg-emerald-500 hover:bg-emerald-600"
                          data-testid={`confirm-payment-${payment.id}`}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Confirm
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <h3 className="text-white text-lg font-bold">All Orders</h3>
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                <ShoppingBag className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold">No orders yet</h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left text-slate-400 text-sm py-3 px-4">Order #</th>
                      <th className="text-left text-slate-400 text-sm py-3 px-4">Date</th>
                      <th className="text-left text-slate-400 text-sm py-3 px-4">Amount</th>
                      <th className="text-left text-slate-400 text-sm py-3 px-4">Payment</th>
                      <th className="text-left text-slate-400 text-sm py-3 px-4">Status</th>
                      <th className="text-left text-slate-400 text-sm py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-800/50">
                        <td className="py-3 px-4 text-white font-mono text-sm">{order.order_number}</td>
                        <td className="py-3 px-4 text-slate-300 text-sm">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">
                          {order.total_amount.toLocaleString()} ETB
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${
                            order.payment_status === "completed" ? "bg-emerald-500" :
                            order.payment_status === "pending_verification" ? "bg-blue-500" :
                            "bg-amber-500"
                          } capitalize`}>
                            {order.payment_status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${
                            order.order_status === "delivered" ? "bg-emerald-500" :
                            order.order_status === "shipped" ? "bg-cyan-500" :
                            order.order_status === "cancelled" ? "bg-red-500" :
                            "bg-amber-500"
                          } capitalize`}>
                            {order.order_status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={order.order_status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white text-sm rounded px-2 py-1"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <h3 className="text-white text-lg font-bold">All Users</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-slate-400 text-sm py-3 px-4">Name</th>
                    <th className="text-left text-slate-400 text-sm py-3 px-4">Email</th>
                    <th className="text-left text-slate-400 text-sm py-3 px-4">Phone</th>
                    <th className="text-left text-slate-400 text-sm py-3 px-4">Role</th>
                    <th className="text-left text-slate-400 text-sm py-3 px-4">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800/50">
                      <td className="py-3 px-4 text-white">{u.name}</td>
                      <td className="py-3 px-4 text-slate-300">{u.email}</td>
                      <td className="py-3 px-4 text-slate-300">{u.phone}</td>
                      <td className="py-3 px-4">
                        <Badge className={`${
                          u.role === "admin" ? "bg-purple-500" :
                          u.role === "seller" ? "bg-amber-500" :
                          "bg-emerald-500"
                        } capitalize`}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-sm">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Switch } from "../components/ui/switch";
import {
  ArrowLeft, Users, Package, ShoppingBag, DollarSign, LogOut, Check, X,
  Loader2, CreditCard, Plus, Edit, Trash2, Settings, AlertTriangle,
  Building, Smartphone, CheckCircle,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [pendingCommissionPayments, setPendingCommissionPayments] = useState([]);
  const [commissionPaymentMethod, setCommissionPaymentMethod] = useState({});
  const [loading, setLoading] = useState(true);
  const [paymentMethodModal, setPaymentMethodModal] = useState({ open: false, method: null });
  const [commissionSettingsModal, setCommissionSettingsModal] = useState(false);
  const [paymentMethodForm, setPaymentMethodForm] = useState({
    name: "", type: "mobile_money", account_name: "", account_number: "", instructions: "", logo_url: "",
  });
  const [commissionMethodForm, setCommissionMethodForm] = useState({
    payment_method_id: "", account_name: "", account_number: "",
  });

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    if (user.role !== "admin") {
      navigate(user.role === "seller" ? "/seller" : "/dashboard");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, ordersRes, paymentsRes, methodsRes, commissionsRes, commPaymentsRes, commMethodRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/users`),
        axios.get(`${API}/orders`),
        axios.get(`${API}/payments/pending`),
        axios.get(`${API}/payment-methods/admin`),
        axios.get(`${API}/commissions`),
        axios.get(`${API}/commissions/payments/pending`),
        axios.get(`${API}/admin/commission-payment-method`),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setOrders(ordersRes.data);
      setPendingPayments(paymentsRes.data);
      setPaymentMethods(methodsRes.data);
      setCommissions(commissionsRes.data);
      setPendingCommissionPayments(commPaymentsRes.data);
      setCommissionPaymentMethod(commMethodRes.data);
      if (commMethodRes.data.payment_method_id) {
        setCommissionMethodForm({
          payment_method_id: commMethodRes.data.payment_method_id,
          account_name: commMethodRes.data.account_name || "",
          account_number: commMethodRes.data.account_number || "",
        });
      }
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
    } catch (err) { toast.error("Failed"); }
  };

  const rejectPayment = async (paymentId) => {
    try {
      await axios.post(`${API}/payments/${paymentId}/reject`);
      toast.success("Payment rejected");
      fetchData();
    } catch (err) { toast.error("Failed"); }
  };

  const confirmCommissionPayment = async (paymentId) => {
    try {
      await axios.post(`${API}/commissions/payments/${paymentId}/confirm`);
      toast.success("Commission payment confirmed!");
      fetchData();
    } catch (err) { toast.error("Failed"); }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status`, { status });
      toast.success("Status updated");
      fetchData();
    } catch (err) { toast.error("Failed"); }
  };

  const togglePaymentMethod = async (methodId) => {
    try {
      await axios.post(`${API}/payment-methods/${methodId}/toggle`);
      toast.success("Payment method toggled");
      fetchData();
    } catch (err) { toast.error("Failed"); }
  };

  const openAddPaymentMethod = () => {
    setPaymentMethodForm({ name: "", type: "mobile_money", account_name: "", account_number: "", instructions: "", logo_url: "" });
    setPaymentMethodModal({ open: true, method: null });
  };

  const openEditPaymentMethod = (method) => {
    setPaymentMethodForm({
      name: method.name, type: method.type, account_name: method.account_name,
      account_number: method.account_number, instructions: method.instructions || "",
      logo_url: method.logo_url || "",
    });
    setPaymentMethodModal({ open: true, method });
  };

  const handleSavePaymentMethod = async (e) => {
    e.preventDefault();
    try {
      if (paymentMethodModal.method) {
        await axios.put(`${API}/payment-methods/${paymentMethodModal.method.id}`, paymentMethodForm);
        toast.success("Payment method updated!");
      } else {
        await axios.post(`${API}/payment-methods`, paymentMethodForm);
        toast.success("Payment method added!");
      }
      setPaymentMethodModal({ open: false, method: null });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
  };

  const deletePaymentMethod = async (methodId) => {
    if (!window.confirm("Delete this payment method?")) return;
    try {
      await axios.delete(`${API}/payment-methods/${methodId}`);
      toast.success("Deleted");
      fetchData();
    } catch (err) { toast.error("Failed"); }
  };

  const handleSaveCommissionMethod = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/commission-payment-method`, commissionMethodForm);
      toast.success("Commission payment method updated!");
      setCommissionSettingsModal(false);
      fetchData();
    } catch (err) { toast.error("Failed"); }
  };

  const getMethodIcon = (type) => {
    switch (type) {
      case "mobile_money": return <Smartphone className="h-5 w-5 text-emerald-400" />;
      case "bank": return <Building className="h-5 w-5 text-blue-400" />;
      default: return <CreditCard className="h-5 w-5 text-amber-400" />;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950" data-testid="admin-dashboard">
      <div className="ethio-stripe" />
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/"><Button variant="ghost" size="icon" className="text-slate-400"><ArrowLeft className="h-5 w-5" /></Button></Link>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-slate-400 text-sm">Manage Etho Parts</p>
              </div>
            </div>
            <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => { logout(); navigate("/"); }}>
              <LogOut className="h-4 w-4 mr-2" />Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs">Users</p>
            <p className="text-2xl font-bold text-white">{stats.total_users || 0}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs">Products</p>
            <p className="text-2xl font-bold text-white">{stats.total_products || 0}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs">Orders</p>
            <p className="text-2xl font-bold text-white">{stats.total_orders || 0}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs">Total Sales</p>
            <p className="text-2xl font-bold text-emerald-400">{(stats.total_sales || 0).toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs">Commission Earned</p>
            <p className="text-2xl font-bold text-emerald-400">{(stats.total_commission_earned || 0).toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs">Pending Commission</p>
            <p className="text-2xl font-bold text-amber-400">{(stats.pending_commission_amount || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Alerts */}
        <div className="flex flex-wrap gap-4 mt-4">
          {pendingPayments.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-amber-400" />
              <span className="text-amber-400 font-semibold">{pendingPayments.length} payment(s) pending</span>
            </div>
          )}
          {pendingCommissionPayments.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-blue-400" />
              <span className="text-blue-400 font-semibold">{pendingCommissionPayments.length} commission payment(s) pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="bg-slate-800 flex-wrap">
            <TabsTrigger value="payments" className="data-[state=active]:bg-emerald-500"><CreditCard className="h-4 w-4 mr-2" />Payments{pendingPayments.length > 0 && <Badge className="ml-2 bg-amber-500">{pendingPayments.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="payment-methods" className="data-[state=active]:bg-emerald-500"><Building className="h-4 w-4 mr-2" />Payment Methods</TabsTrigger>
            <TabsTrigger value="commissions" className="data-[state=active]:bg-emerald-500"><DollarSign className="h-4 w-4 mr-2" />Commissions{pendingCommissionPayments.length > 0 && <Badge className="ml-2 bg-blue-500">{pendingCommissionPayments.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-emerald-500"><ShoppingBag className="h-4 w-4 mr-2" />Orders</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-emerald-500"><Users className="h-4 w-4 mr-2" />Users</TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <h3 className="text-white text-lg font-bold">Pending Payment Verifications</h3>
            {loading ? (
              <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" /></div>
            ) : pendingPayments.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                <Check className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <p className="text-white font-semibold">All caught up!</p>
              </div>
            ) : (
              pendingPayments.map((payment) => (
                <div key={payment.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-semibold">{payment.order_number}</p>
                      <p className="text-emerald-400 font-bold text-xl">{payment.total_amount?.toLocaleString()} ETB</p>
                      <p className="text-slate-400 text-sm">Method: {payment.payment_method_name}</p>
                      <p className="text-slate-400 text-sm">Ref: {payment.transaction_ref}</p>
                      <p className="text-slate-500 text-xs">{new Date(payment.created_at).toLocaleString()}</p>
                      {payment.receipt_image && (
                        <a href={payment.receipt_image} target="_blank" rel="noopener noreferrer" className="text-emerald-400 text-sm underline mt-2 block">View Receipt</a>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={() => confirmPayment(payment.id)} className="bg-emerald-500 hover:bg-emerald-600"><Check className="h-4 w-4 mr-2" />Confirm</Button>
                      <Button variant="outline" className="border-red-500/50 text-red-400" onClick={() => rejectPayment(payment.id)}><X className="h-4 w-4 mr-2" />Reject</Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-white text-lg font-bold">Payment Methods</h3>
              <Button onClick={openAddPaymentMethod} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="h-4 w-4 mr-2" />Add Method
              </Button>
            </div>
            <p className="text-slate-400 text-sm">Enable/disable payment methods. Sellers can only use enabled methods.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className={`bg-slate-900 border rounded-xl p-4 ${method.enabled ? "border-emerald-500/50" : "border-slate-800 opacity-60"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {method.logo_url ? (
                        <img src={method.logo_url} alt={method.name} className="w-10 h-10 rounded object-contain bg-white p-1" />
                      ) : getMethodIcon(method.type)}
                      <div>
                        <p className="text-white font-semibold">{method.name}</p>
                        <p className="text-slate-400 text-xs capitalize">{method.type.replace("_", " ")}</p>
                      </div>
                    </div>
                    <Switch checked={method.enabled} onCheckedChange={() => togglePaymentMethod(method.id)} />
                  </div>
                  <p className="text-slate-400 text-sm">{method.account_name}</p>
                  <p className="text-slate-500 text-xs font-mono">{method.account_number}</p>
                  <div className="flex space-x-2 mt-3 pt-3 border-t border-slate-800">
                    <Button size="sm" variant="outline" className="flex-1 border-slate-700" onClick={() => openEditPaymentMethod(method)}><Edit className="h-3 w-3 mr-1" />Edit</Button>
                    <Button size="sm" variant="outline" className="border-red-500/50 text-red-400" onClick={() => deletePaymentMethod(method.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions" className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h3 className="text-white text-lg font-bold">Commission Management</h3>
              <Button variant="outline" className="border-slate-700" onClick={() => setCommissionSettingsModal(true)}>
                <Settings className="h-4 w-4 mr-2" />Commission Payment Method
              </Button>
            </div>

            {/* Pending Commission Payments */}
            {pendingCommissionPayments.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-white font-semibold">Pending Commission Payments</h4>
                {pendingCommissionPayments.map((payment) => (
                  <div key={payment.id} className="bg-slate-900 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-white font-semibold">{payment.seller_name}</p>
                        <p className="text-slate-400 text-sm">Order: {payment.order_number}</p>
                        <p className="text-emerald-400 font-bold">{payment.commission_amount?.toLocaleString()} ETB</p>
                        <p className="text-slate-500 text-xs">Ref: {payment.transaction_ref}</p>
                        {payment.receipt_image && (
                          <a href={payment.receipt_image} target="_blank" rel="noopener noreferrer" className="text-emerald-400 text-sm underline">View Receipt</a>
                        )}
                      </div>
                      <Button onClick={() => confirmCommissionPayment(payment.id)} className="bg-emerald-500 hover:bg-emerald-600">
                        <CheckCircle className="h-4 w-4 mr-2" />Confirm
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All Commissions */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold">All Commissions</h4>
              {commissions.length === 0 ? (
                <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                  <DollarSign className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-white font-semibold">No commissions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left text-slate-400 text-sm py-3 px-4">Order</th>
                        <th className="text-left text-slate-400 text-sm py-3 px-4">Seller</th>
                        <th className="text-left text-slate-400 text-sm py-3 px-4">Sale</th>
                        <th className="text-left text-slate-400 text-sm py-3 px-4">Commission</th>
                        <th className="text-left text-slate-400 text-sm py-3 px-4">Due Date</th>
                        <th className="text-left text-slate-400 text-sm py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((c) => (
                        <tr key={c.id} className="border-b border-slate-800/50">
                          <td className="py-3 px-4 text-white text-sm">{c.order_number}</td>
                          <td className="py-3 px-4 text-slate-300 text-sm">{c.seller_id.slice(0, 8)}...</td>
                          <td className="py-3 px-4 text-slate-300">{c.sale_amount.toLocaleString()} ETB</td>
                          <td className="py-3 px-4 text-emerald-400 font-semibold">{c.commission_amount.toLocaleString()} ETB</td>
                          <td className="py-3 px-4 text-slate-500 text-sm">{new Date(c.due_date).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <Badge className={`${
                              c.status === "paid" ? "bg-emerald-500" :
                              c.status === "overdue" ? "bg-red-500" :
                              c.status === "pending_verification" ? "bg-blue-500" :
                              "bg-amber-500"
                            } capitalize`}>
                              {c.status === "pending_verification" ? "Review" : c.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <h3 className="text-white text-lg font-bold">All Orders</h3>
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                <ShoppingBag className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-semibold">No orders yet</p>
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
                        <td className="py-3 px-4 text-slate-300 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">{order.total_amount.toLocaleString()} ETB</td>
                        <td className="py-3 px-4">
                          <Badge className={`${order.payment_status === "completed" ? "bg-emerald-500" : order.payment_status === "pending_verification" ? "bg-blue-500" : "bg-amber-500"} capitalize`}>
                            {order.payment_status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${order.order_status === "delivered" ? "bg-emerald-500" : order.order_status === "shipped" ? "bg-cyan-500" : order.order_status === "cancelled" ? "bg-red-500" : "bg-amber-500"} capitalize`}>
                            {order.order_status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <select value={order.order_status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="bg-slate-800 border border-slate-700 text-white text-sm rounded px-2 py-1">
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
                        <Badge className={`${u.role === "admin" ? "bg-purple-500" : u.role === "seller" ? "bg-amber-500" : "bg-emerald-500"} capitalize`}>{u.role}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Payment Method Modal */}
      <Dialog open={paymentMethodModal.open} onOpenChange={(open) => setPaymentMethodModal({ ...paymentMethodModal, open })}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader><DialogTitle className="text-white">{paymentMethodModal.method ? "Edit" : "Add"} Payment Method</DialogTitle></DialogHeader>
          <form onSubmit={handleSavePaymentMethod} className="space-y-4 mt-4">
            <div><Label className="text-slate-300">Name</Label><Input value={paymentMethodForm.name} onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" required /></div>
            <div>
              <Label className="text-slate-300">Type</Label>
              <Select value={paymentMethodForm.type} onValueChange={(value) => setPaymentMethodForm({ ...paymentMethodForm, type: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="ewallet">E-Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-slate-300">Account Name</Label><Input value={paymentMethodForm.account_name} onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, account_name: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" required /></div>
            <div><Label className="text-slate-300">Account Number</Label><Input value={paymentMethodForm.account_number} onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, account_number: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" required /></div>
            <div><Label className="text-slate-300">Instructions</Label><Input value={paymentMethodForm.instructions} onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, instructions: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" /></div>
            <div><Label className="text-slate-300">Logo URL</Label><Input value={paymentMethodForm.logo_url} onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, logo_url: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="https://..." /></div>
            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600">{paymentMethodModal.method ? "Update" : "Add"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Commission Payment Method Settings Modal */}
      <Dialog open={commissionSettingsModal} onOpenChange={setCommissionSettingsModal}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader><DialogTitle className="text-white">Commission Payment Method</DialogTitle></DialogHeader>
          <p className="text-slate-400 text-sm">Set where sellers should pay their 10% commission.</p>
          <form onSubmit={handleSaveCommissionMethod} className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-300">Payment Method</Label>
              <Select value={commissionMethodForm.payment_method_id} onValueChange={(value) => setCommissionMethodForm({ ...commissionMethodForm, payment_method_id: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {paymentMethods.filter(m => m.enabled).map((method) => (
                    <SelectItem key={method.id} value={method.id}>{method.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-slate-300">Account Name</Label><Input value={commissionMethodForm.account_name} onChange={(e) => setCommissionMethodForm({ ...commissionMethodForm, account_name: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" required /></div>
            <div><Label className="text-slate-300">Account Number</Label><Input value={commissionMethodForm.account_number} onChange={(e) => setCommissionMethodForm({ ...commissionMethodForm, account_number: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" required /></div>
            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600">Save Settings</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

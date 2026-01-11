import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import {
  ArrowLeft,
  Package,
  Plus,
  DollarSign,
  ShoppingBag,
  LogOut,
  Edit,
  Trash2,
  Loader2,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Upload,
  Building,
  Smartphone,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [commissions, setCommissions] = useState([]);
  const [commissionStats, setCommissionStats] = useState({});
  const [commissionPaymentInfo, setCommissionPaymentInfo] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [sellerPaymentMethods, setSellerPaymentMethods] = useState([]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productModal, setProductModal] = useState({ open: false, product: null });
  const [paymentMethodModal, setPaymentMethodModal] = useState({ open: false });
  const [commissionPayModal, setCommissionPayModal] = useState({ open: false, commission: null });
  const [productForm, setProductForm] = useState({
    name: "", description: "", price: "", category_id: "", brand: "",
    condition: "new", stock: "", images: "", compatible_cars: "",
  });
  const [paymentMethodForm, setPaymentMethodForm] = useState({
    payment_method_id: "", account_name: "", account_number: "",
  });
  const [commissionPayForm, setCommissionPayForm] = useState({
    transaction_ref: "", receipt_image: null,
  });

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    if (user.role !== "seller" && user.role !== "admin") {
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes, categoriesRes, statsRes, commissionsRes, commissionStatsRes, sellerMethodsRes, allMethodsRes, paymentInfoRes, pendingRes] = await Promise.all([
        axios.get(`${API}/products`, { params: { seller_id: user.id } }),
        axios.get(`${API}/orders`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/seller/stats`),
        axios.get(`${API}/commissions`),
        axios.get(`${API}/commissions/stats`),
        axios.get(`${API}/seller/payment-methods`),
        axios.get(`${API}/payment-methods`, { params: { enabled_only: true } }),
        axios.get(`${API}/admin/commission-payment-info`),
        axios.get(`${API}/payments/pending`),
      ]);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
      setCategories(categoriesRes.data);
      setStats(statsRes.data);
      setCommissions(commissionsRes.data);
      setCommissionStats(commissionStatsRes.data);
      setSellerPaymentMethods(sellerMethodsRes.data);
      setAvailablePaymentMethods(allMethodsRes.data);
      setCommissionPaymentInfo(paymentInfoRes.data);
      setPendingPayments(pendingRes.data);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const openAddProduct = () => {
    setProductForm({ name: "", description: "", price: "", category_id: "", brand: "", condition: "new", stock: "", images: "", compatible_cars: "" });
    setProductModal({ open: true, product: null });
  };

  const openEditProduct = (product) => {
    setProductForm({
      name: product.name, description: product.description, price: product.price.toString(),
      category_id: product.category_id, brand: product.brand, condition: product.condition,
      stock: product.stock.toString(), images: product.images?.join(", ") || "",
      compatible_cars: product.compatible_cars?.join(", ") || "",
    });
    setProductModal({ open: true, product });
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    const data = {
      ...productForm,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock),
      images: productForm.images.split(",").map((s) => s.trim()).filter(Boolean),
      compatible_cars: productForm.compatible_cars.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (productModal.product) {
        await axios.put(`${API}/products/${productModal.product.id}`, data);
        toast.success("Product updated!");
      } else {
        await axios.post(`${API}/products`, data);
        toast.success("Product added!");
      }
      setProductModal({ open: false, product: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save product");
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${API}/products/${productId}`);
      toast.success("Product deleted");
      fetchData();
    } catch (err) { toast.error("Failed to delete"); }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status`, { status });
      toast.success("Status updated");
      fetchData();
    } catch (err) { toast.error("Failed to update"); }
  };

  const confirmPayment = async (paymentId) => {
    try {
      await axios.post(`${API}/payments/${paymentId}/confirm`);
      toast.success("Payment confirmed!");
      fetchData();
    } catch (err) { toast.error("Failed to confirm"); }
  };

  const rejectPayment = async (paymentId) => {
    try {
      await axios.post(`${API}/payments/${paymentId}/reject`);
      toast.success("Payment rejected");
      fetchData();
    } catch (err) { toast.error("Failed to reject"); }
  };

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/seller/payment-methods`, paymentMethodForm);
      toast.success("Payment method added!");
      setPaymentMethodModal({ open: false });
      setPaymentMethodForm({ payment_method_id: "", account_name: "", account_number: "" });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed to add"); }
  };

  const removePaymentMethod = async (methodId) => {
    if (!window.confirm("Remove this payment method?")) return;
    try {
      await axios.delete(`${API}/seller/payment-methods/${methodId}`);
      toast.success("Payment method removed");
      fetchData();
    } catch (err) { toast.error("Failed to remove"); }
  };

  const handleCommissionFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCommissionPayForm({ ...commissionPayForm, receipt_image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handlePayCommission = async (e) => {
    e.preventDefault();
    if (!commissionPayForm.transaction_ref) { toast.error("Enter transaction ref"); return; }
    try {
      await axios.post(`${API}/commissions/${commissionPayModal.commission.id}/pay`, {
        commission_id: commissionPayModal.commission.id,
        transaction_ref: commissionPayForm.transaction_ref,
        receipt_image: commissionPayForm.receipt_image,
      });
      toast.success("Commission payment submitted!");
      setCommissionPayModal({ open: false, commission: null });
      setCommissionPayForm({ transaction_ref: "", receipt_image: null });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed to submit"); }
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
    <div className="min-h-screen bg-slate-950" data-testid="seller-dashboard">
      <div className="ethio-stripe" />
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/"><Button variant="ghost" size="icon" className="text-slate-400"><ArrowLeft className="h-5 w-5" /></Button></Link>
              <div>
                <h1 className="text-xl font-bold text-white">Seller Dashboard</h1>
                <p className="text-slate-400 text-sm">{user.business_name || user.name}</p>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <p className="text-slate-400 text-xs">Pending Commission</p>
            <p className="text-2xl font-bold text-amber-400">{(commissionStats.total_owed || 0).toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs">Paid Commission</p>
            <p className="text-2xl font-bold text-slate-400">{(commissionStats.paid_amount || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-slate-800 flex-wrap">
            <TabsTrigger value="products" className="data-[state=active]:bg-emerald-500"><Package className="h-4 w-4 mr-2" />Products</TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-emerald-500"><ShoppingBag className="h-4 w-4 mr-2" />Orders</TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-emerald-500"><CreditCard className="h-4 w-4 mr-2" />Payments{pendingPayments.length > 0 && <Badge className="ml-2 bg-amber-500">{pendingPayments.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="payment-methods" className="data-[state=active]:bg-emerald-500"><Building className="h-4 w-4 mr-2" />Payment Methods</TabsTrigger>
            <TabsTrigger value="commissions" className="data-[state=active]:bg-emerald-500"><DollarSign className="h-4 w-4 mr-2" />Commissions</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-white text-lg font-bold">My Products</h3>
              <Button onClick={openAddProduct} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-product-btn">
                <Plus className="h-4 w-4 mr-2" />Add Product
              </Button>
            </div>
            {loading ? (
              <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" /></div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                <Package className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-semibold">No products yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="aspect-video bg-slate-800">
                      {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>}
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="text-white font-semibold line-clamp-1">{product.name}</h4>
                        <Badge className="bg-emerald-500">{product.stock} in stock</Badge>
                      </div>
                      <p className="text-emerald-400 font-bold">{product.price.toLocaleString()} ETB</p>
                      <div className="flex space-x-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1 border-slate-700" onClick={() => openEditProduct(product)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                        <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/20" onClick={() => deleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                <ShoppingBag className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-semibold">No orders yet</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-white font-bold">{order.order_number}</p>
                      <p className="text-slate-500 text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <Select value={order.order_status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                      <SelectTrigger className="w-40 bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 text-sm">
                    {order.items.filter((item) => item.seller_id === user.id).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300">
                        <span>{item.product_name} × {item.quantity}</span>
                        <span>{item.total.toLocaleString()} ETB</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800 text-sm text-slate-400">
                    <p>Ship to: {order.shipping_address}, {order.shipping_city}</p>
                    <p>Phone: {order.shipping_phone}</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Pending Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <h3 className="text-white text-lg font-bold">Pending Payment Verifications</h3>
            {pendingPayments.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <p className="text-white font-semibold">All payments verified!</p>
              </div>
            ) : (
              pendingPayments.map((payment) => (
                <div key={payment.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-semibold">{payment.order_number}</p>
                      <p className="text-emerald-400 font-bold text-lg">{payment.total_amount?.toLocaleString()} ETB</p>
                      <p className="text-slate-400 text-sm">Ref: {payment.transaction_ref}</p>
                      <p className="text-slate-500 text-xs">{new Date(payment.created_at).toLocaleString()}</p>
                      {payment.receipt_image && (
                        <a href={payment.receipt_image} target="_blank" rel="noopener noreferrer" className="text-emerald-400 text-sm underline">View Receipt</a>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={() => confirmPayment(payment.id)} className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle className="h-4 w-4 mr-2" />Confirm</Button>
                      <Button variant="outline" className="border-red-500/50 text-red-400" onClick={() => rejectPayment(payment.id)}>Reject</Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-white text-lg font-bold">My Payment Methods</h3>
              <Button onClick={() => setPaymentMethodModal({ open: true })} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="h-4 w-4 mr-2" />Add Method
              </Button>
            </div>
            <p className="text-slate-400 text-sm">Buyers will see these payment options when purchasing your products.</p>
            
            {sellerPaymentMethods.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                <CreditCard className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-semibold">No payment methods added</p>
                <p className="text-slate-400 text-sm mt-2">Add payment methods so buyers can pay you</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sellerPaymentMethods.map((method) => (
                  <div key={method.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {method.method_logo ? (
                        <img src={method.method_logo} alt={method.method_name} className="w-12 h-12 rounded object-contain bg-white p-1" />
                      ) : getMethodIcon(method.method_type)}
                      <div>
                        <p className="text-white font-semibold">{method.method_name}</p>
                        <p className="text-slate-400 text-sm">{method.account_name}</p>
                        <p className="text-slate-500 text-xs font-mono">{method.account_number}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300" onClick={() => removePaymentMethod(method.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions" className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-amber-400 font-semibold">Commission: 10% of each sale</p>
                  <p className="text-slate-400 text-sm">Must be paid within 48 hours after payment confirmation</p>
                </div>
              </div>
            </div>

            {commissionPaymentInfo && commissionPaymentInfo.account_number && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h4 className="text-white font-semibold mb-3">Pay Commission To:</h4>
                <div className="flex items-center space-x-3">
                  {commissionPaymentInfo.logo_url ? (
                    <img src={commissionPaymentInfo.logo_url} alt="" className="w-10 h-10 rounded bg-white p-1" />
                  ) : <CreditCard className="h-10 w-10 text-emerald-400" />}
                  <div>
                    <p className="text-white">{commissionPaymentInfo.method_name}</p>
                    <p className="text-slate-400 text-sm">{commissionPaymentInfo.account_name}</p>
                    <p className="text-emerald-400 font-mono">{commissionPaymentInfo.account_number}</p>
                  </div>
                </div>
              </div>
            )}

            {commissions.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                <DollarSign className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-semibold">No commissions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {commissions.map((commission) => (
                  <div key={commission.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-white font-semibold">{commission.order_number}</p>
                        <p className="text-slate-400 text-sm">Sale: {commission.sale_amount.toLocaleString()} ETB</p>
                        <p className="text-amber-400 font-bold">Commission: {commission.commission_amount.toLocaleString()} ETB</p>
                        <p className="text-slate-500 text-xs">Due: {new Date(commission.due_date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={`${
                          commission.status === "paid" ? "bg-emerald-500" :
                          commission.status === "overdue" ? "bg-red-500" :
                          commission.status === "pending_verification" ? "bg-blue-500" :
                          "bg-amber-500"
                        } capitalize`}>
                          {commission.status === "pending_verification" ? "Pending Review" : commission.status}
                        </Badge>
                        {(commission.status === "pending" || commission.status === "overdue") && (
                          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => setCommissionPayModal({ open: true, commission })}>
                            Pay Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Product Modal */}
      <Dialog open={productModal.open} onOpenChange={(open) => setProductModal({ ...productModal, open })}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white">{productModal.product ? "Edit Product" : "Add New Product"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitProduct} className="space-y-4 mt-4">
            <div><Label className="text-slate-300">Product Name</Label><Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" required /></div>
            <div><Label className="text-slate-300">Description</Label><Textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-slate-300">Price (ETB)</Label><Input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" required /></div>
              <div><Label className="text-slate-300">Stock</Label><Input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-slate-300">Category</Label><Select value={productForm.category_id} onValueChange={(value) => setProductForm({ ...productForm, category_id: value })}><SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent className="bg-slate-800 border-slate-700">{categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent></Select></div>
              <div><Label className="text-slate-300">Condition</Label><Select value={productForm.condition} onValueChange={(value) => setProductForm({ ...productForm, condition: value })}><SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-800 border-slate-700"><SelectItem value="new">New</SelectItem><SelectItem value="used">Used</SelectItem><SelectItem value="refurbished">Refurbished</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label className="text-slate-300">Brand</Label><Input value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" required /></div>
            <div><Label className="text-slate-300">Image URLs (comma separated)</Label><Input value={productForm.images} onChange={(e) => setProductForm({ ...productForm, images: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" /></div>
            <div><Label className="text-slate-300">Compatible Cars (comma separated)</Label><Input value={productForm.compatible_cars} onChange={(e) => setProductForm({ ...productForm, compatible_cars: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" /></div>
            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600">{productModal.product ? "Update" : "Add"} Product</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Method Modal */}
      <Dialog open={paymentMethodModal.open} onOpenChange={(open) => setPaymentMethodModal({ open })}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader><DialogTitle className="text-white">Add Payment Method</DialogTitle></DialogHeader>
          <form onSubmit={handleAddPaymentMethod} className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-300">Select Payment Method</Label>
              <Select value={paymentMethodForm.payment_method_id} onValueChange={(value) => setPaymentMethodForm({ ...paymentMethodForm, payment_method_id: value })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue placeholder="Choose method" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {availablePaymentMethods.filter(m => !sellerPaymentMethods.find(sm => sm.payment_method_id === m.id)).map((method) => (
                    <SelectItem key={method.id} value={method.id}>{method.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-slate-300">Your Account Name</Label><Input value={paymentMethodForm.account_name} onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, account_name: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" required /></div>
            <div><Label className="text-slate-300">Your Account Number</Label><Input value={paymentMethodForm.account_number} onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, account_number: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" required /></div>
            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600">Add Payment Method</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Commission Payment Modal */}
      <Dialog open={commissionPayModal.open} onOpenChange={(open) => setCommissionPayModal({ ...commissionPayModal, open })}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader><DialogTitle className="text-white">Pay Commission</DialogTitle></DialogHeader>
          {commissionPayModal.commission && commissionPaymentInfo && (
            <div className="space-y-4 mt-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Amount to Pay:</p>
                <p className="text-emerald-400 text-2xl font-bold">{commissionPayModal.commission.commission_amount.toLocaleString()} ETB</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-2">Pay to:</p>
                <p className="text-white font-semibold">{commissionPaymentInfo.method_name}</p>
                <p className="text-slate-300">{commissionPaymentInfo.account_name}</p>
                <p className="text-emerald-400 font-mono">{commissionPaymentInfo.account_number}</p>
              </div>
              <form onSubmit={handlePayCommission} className="space-y-4">
                <div><Label className="text-slate-300">Transaction Reference</Label><Input value={commissionPayForm.transaction_ref} onChange={(e) => setCommissionPayForm({ ...commissionPayForm, transaction_ref: e.target.value })} className="bg-slate-800 border-slate-700 text-white mt-1" required /></div>
                <div>
                  <Label className="text-slate-300">Upload Receipt</Label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700/50 mt-1">
                    {commissionPayForm.receipt_image ? (
                      <div className="text-center"><CheckCircle className="h-6 w-6 text-emerald-400 mx-auto" /><p className="text-emerald-400 text-sm">Uploaded</p></div>
                    ) : (
                      <div className="text-center"><Upload className="h-6 w-6 text-slate-400 mx-auto" /><p className="text-slate-400 text-sm">Upload receipt</p></div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleCommissionFileUpload} />
                  </label>
                </div>
                <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600">Submit Payment</Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

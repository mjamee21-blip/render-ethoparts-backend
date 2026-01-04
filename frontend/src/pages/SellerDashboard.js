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
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [productModal, setProductModal] = useState({ open: false, product: null });
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    brand: "",
    condition: "new",
    stock: "",
    images: "",
    compatible_cars: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    if (user.role !== "seller" && user.role !== "admin") {
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes, categoriesRes, statsRes] = await Promise.all([
        axios.get(`${API}/products`, { params: { seller_id: user.id } }),
        axios.get(`${API}/orders`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/seller/stats`),
      ]);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
      setCategories(categoriesRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const openAddProduct = () => {
    setProductForm({
      name: "",
      description: "",
      price: "",
      category_id: "",
      brand: "",
      condition: "new",
      stock: "",
      images: "",
      compatible_cars: "",
    });
    setProductModal({ open: true, product: null });
  };

  const openEditProduct = (product) => {
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category_id: product.category_id,
      brand: product.brand,
      condition: product.condition,
      stock: product.stock.toString(),
      images: product.images?.join(", ") || "",
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
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${API}/products/${productId}`);
      toast.success("Product deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete product");
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
    <div className="min-h-screen bg-slate-950" data-testid="seller-dashboard">
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
                <h1 className="text-xl font-bold text-white">Seller Dashboard</h1>
                <p className="text-slate-400 text-sm">{user.business_name || user.name}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Products</p>
                <p className="text-3xl font-bold text-white">{stats.total_products || 0}</p>
              </div>
              <Package className="h-10 w-10 text-emerald-400" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-white">{stats.total_orders || 0}</p>
              </div>
              <ShoppingBag className="h-10 w-10 text-amber-400" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-white">{(stats.total_revenue || 0).toLocaleString()} ETB</p>
              </div>
              <DollarSign className="h-10 w-10 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="products" className="data-[state=active]:bg-emerald-500">
              <Package className="h-4 w-4 mr-2" />
              My Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-emerald-500">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-white text-lg font-bold">My Products</h3>
              <Button
                onClick={openAddProduct}
                className="bg-emerald-500 hover:bg-emerald-600"
                data-testid="add-product-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                <Package className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold">No products yet</h3>
                <p className="text-slate-400 mt-2">Start by adding your first product</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
                    data-testid={`seller-product-${product.id}`}
                  >
                    <div className="aspect-video bg-slate-800">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="text-white font-semibold line-clamp-1">{product.name}</h4>
                        <Badge className="bg-emerald-500">{product.stock} in stock</Badge>
                      </div>
                      <p className="text-emerald-400 font-bold">{product.price.toLocaleString()} ETB</p>
                      <div className="flex space-x-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-slate-700"
                          onClick={() => openEditProduct(product)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                          onClick={() => deleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                <ShoppingBag className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold">No orders yet</h3>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-white font-bold">{order.order_number}</p>
                      <p className="text-slate-500 text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <Select
                      value={order.order_status}
                      onValueChange={(value) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
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
                    {order.items
                      .filter((item) => item.seller_id === user.id)
                      .map((item, idx) => (
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
        </Tabs>
      </main>

      {/* Product Modal */}
      <Dialog open={productModal.open} onOpenChange={(open) => setProductModal({ ...productModal, open })}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {productModal.product ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitProduct} className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-300">Product Name</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Price (ETB)</Label>
                <Input
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-slate-300">Stock</Label>
                <Input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Category</Label>
                <Select
                  value={productForm.category_id}
                  onValueChange={(value) => setProductForm({ ...productForm, category_id: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Condition</Label>
                <Select
                  value={productForm.condition}
                  onValueChange={(value) => setProductForm({ ...productForm, condition: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="refurbished">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Brand</Label>
              <Input
                value={productForm.brand}
                onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-slate-300">Image URLs (comma separated)</Label>
              <Input
                value={productForm.images}
                onChange={(e) => setProductForm({ ...productForm, images: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              />
            </div>
            <div>
              <Label className="text-slate-300">Compatible Cars (comma separated)</Label>
              <Input
                value={productForm.compatible_cars}
                onChange={(e) => setProductForm({ ...productForm, compatible_cars: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                placeholder="Toyota Corolla, Honda Civic"
              />
            </div>
            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600">
              {productModal.product ? "Update Product" : "Add Product"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

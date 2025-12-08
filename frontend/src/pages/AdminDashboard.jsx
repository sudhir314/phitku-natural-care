import React, { useState, useEffect } from 'react';
import { Package, Truck, Plus, Edit, Trash2, X, Menu, TicketPercent, BarChart2, Users, DollarSign, Eye, MapPin } from 'lucide-react';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// Chart Colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null); // <--- NEW: To store the order being viewed
  
  // Product Form State
  const [formData, setFormData] = useState({
    name: '', price: '', originalPrice: '', category: 'Roll-on', tag: '', description: '', isAvailable: true, image: ''
  });
  
  // Coupon Form State
  const [couponData, setCouponData] = useState({ code: '', discountPercentage: '' });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics') {
          const res = await apiClient.get('/admin/stats');
          setStats(res.data);
      } else if (activeTab === 'products') {
        const res = await apiClient.get('/products');
        setProducts(res.data);
      } else if (activeTab === 'orders') {
        const res = await apiClient.get('/orders/all-orders');
        setOrders(res.data);
      } else if (activeTab === 'coupons') {
        const res = await apiClient.get('/coupons');
        setCoupons(res.data);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // --- Product Handlers ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
      }
  };

  const handleSubmitProduct = async (e) => {
      e.preventDefault();
      const data = new FormData();
      data.append('name', formData.name);
      data.append('price', formData.price);
      data.append('originalPrice', formData.originalPrice);
      data.append('category', formData.category);
      data.append('tag', formData.tag);
      data.append('description', formData.description);
      data.append('isAvailable', formData.isAvailable);
      if (imageFile) data.append('imageFile', imageFile);
      else data.append('image', formData.image);

      try {
          if (editingProduct) {
              await apiClient.put(`/products/${editingProduct._id}`, data);
              toast.success("Product Updated!");
          } else {
              await apiClient.post('/products', data);
              toast.success("Product Created!");
          }
          setShowModal(false);
          setEditingProduct(null);
          fetchData();
      } catch (error) {
          toast.error("Operation failed.");
      }
  };

  const handleDeleteProduct = async (id) => {
      if(window.confirm("Are you sure?")) {
          try {
              await apiClient.delete(`/products/${id}`);
              toast.success("Product Deleted");
              fetchData();
          } catch (error) {
              toast.error("Delete failed");
          }
      }
  };

  // --- Coupon Handlers ---
  const handleCouponSubmit = async (e) => {
      e.preventDefault();
      try {
          await apiClient.post('/coupons', couponData);
          toast.success("Coupon Created!");
          setCouponData({ code: '', discountPercentage: '' });
          fetchData();
      } catch (error) {
          toast.error(error.response?.data?.message || "Failed to create coupon");
      }
  };

  const handleDeleteCoupon = async (id) => {
      if(window.confirm("Delete this coupon?")) {
          try {
              await apiClient.delete(`/coupons/${id}`);
              toast.success("Coupon Deleted");
              fetchData();
          } catch (error) {
              toast.error("Delete failed");
          }
      }
  };

  // --- Order Handlers ---
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
        await apiClient.put(`/orders/${orderId}/status`, { status: newStatus });
        toast.success(`Order updated to ${newStatus}`);
        fetchData();
    } catch (error) {
        toast.error("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
          <h2 className="text-xl font-bold text-green-400">Admin Panel</h2>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-800 rounded-lg">
              {isSidebarOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>
      </div>

      {/* Sidebar */}
      <div className={`
          bg-gray-900 text-white p-6 fixed h-full z-40 w-64 transition-transform duration-300 ease-in-out
          md:translate-x-0 md:static md:block
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <h2 className="text-2xl font-bold mb-8 text-green-400 hidden md:block">Admin Panel</h2>
        <nav className="space-y-4">
          <button onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-lg transition ${activeTab === 'analytics' ? 'bg-green-700' : 'hover:bg-gray-800'}`}>
            <BarChart2 size={20} /> Analytics
          </button>
          <button onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-lg transition ${activeTab === 'products' ? 'bg-green-700' : 'hover:bg-gray-800'}`}>
            <Package size={20} /> Products
          </button>
          <button onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-lg transition ${activeTab === 'orders' ? 'bg-green-700' : 'hover:bg-gray-800'}`}>
            <Truck size={20} /> Orders
          </button>
          <button onClick={() => { setActiveTab('coupons'); setIsSidebarOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-lg transition ${activeTab === 'coupons' ? 'bg-green-700' : 'hover:bg-gray-800'}`}>
            <TicketPercent size={20} /> Coupons
          </button>
        </nav>
      </div>

      {/* Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 w-full overflow-x-hidden">
         <h1 className="text-2xl md:text-3xl font-bold mb-6 capitalize text-gray-800">{activeTab} Management</h1>

         {loading ? <p>Loading...</p> : (
             <>
                {/* --- ANALYTICS TAB --- */}
                {activeTab === 'analytics' && stats && (
                    <div className="space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                                <div className="bg-green-100 p-3 rounded-full text-green-600"><DollarSign size={24}/></div>
                                <div>
                                    <p className="text-gray-500 text-sm">Total Revenue</p>
                                    <h3 className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</h3>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                                <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Truck size={24}/></div>
                                <div>
                                    <p className="text-gray-500 text-sm">Total Orders</p>
                                    <h3 className="text-2xl font-bold">{stats.ordersCount}</h3>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                                <div className="bg-purple-100 p-3 rounded-full text-purple-600"><Users size={24}/></div>
                                <div>
                                    <p className="text-gray-500 text-sm">Total Users</p>
                                    <h3 className="text-2xl font-bold">{stats.usersCount}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Line Chart: Sales Trend */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-6 text-gray-800">Sales Trend (Last 7 Days)</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={stats.dailySales}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="_id" hide />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="sales" stroke="#059669" strokeWidth={3} dot={{r: 4}} activeDot={{r: 8}} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Pie Chart: Category Distribution */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-6 text-gray-800">Product Categories</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.productCategories}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="count"
                                                nameKey="_id"
                                            >
                                                {stats.productCategories.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PRODUCTS TAB */}
                {activeTab === 'products' && (
                    <div>
                        <button onClick={() => { setEditingProduct(null); setShowModal(true); }} className="bg-green-700 text-white px-4 py-2 rounded-lg font-bold mb-6 flex items-center gap-2 hover:bg-green-800">
                            <Plus size={20}/> Add New Product
                        </button>
                        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                            <table className="w-full text-left min-w-[600px]">
                                <thead className="bg-gray-100 border-b">
                                    <tr><th className="p-4">Image</th><th className="p-4">Name</th><th className="p-4">Price</th><th className="p-4">Actions</th></tr>
                                </thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p._id} className="border-b hover:bg-gray-50">
                                            <td className="p-4"><img src={p.image} alt="" className="w-12 h-12 rounded object-cover bg-gray-100"/></td>
                                            <td className="p-4 font-bold">{p.name}</td>
                                            <td className="p-4">₹{p.price}</td>
                                            <td className="p-4 flex gap-3">
                                                <button onClick={() => { setEditingProduct(p); setFormData(p); setImagePreview(p.image); setShowModal(true); }} className="text-blue-600"><Edit size={18}/></button>
                                                <button onClick={() => handleDeleteProduct(p._id)} className="text-red-600"><Trash2 size={18}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ORDERS TAB (UPDATED) */}
                {activeTab === 'orders' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="p-4">Order ID</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Total</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Details</th> {/* Added Column */}
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order._id} className="border-b hover:bg-gray-50">
                                        <td className="p-4 font-mono text-xs text-gray-500">#{order._id.slice(-6)}</td>
                                        <td className="p-4"><div className="font-bold">{order.shippingAddress?.fullName}</div></td>
                                        <td className="p-4 font-bold">₹{order.totalPrice}</td>
                                        <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">{order.status}</span></td>
                                        <td className="p-4">
                                            <select className="border rounded px-2 py-1 text-sm" value={order.status} onChange={(e) => updateOrderStatus(order._id, e.target.value)}>
                                                <option value="Processing">Processing</option><option value="Shipped">Shipped</option><option value="Delivered">Delivered</option><option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        {/* NEW VIEW BUTTON */}
                                        <td className="p-4">
                                            <button onClick={() => setViewingOrder(order)} className="text-green-600 hover:bg-green-50 p-2 rounded-full transition">
                                                <Eye size={20}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* COUPONS TAB */}
                {activeTab === 'coupons' && (
                    <div className="space-y-8">
                        {/* Create Coupon Form */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-md">
                            <h3 className="font-bold text-lg mb-4">Create New Coupon</h3>
                            <form onSubmit={handleCouponSubmit} className="space-y-4">
                                <input 
                                    type="text" placeholder="Coupon Code (e.g. SALE50)" 
                                    className="w-full border p-2 rounded-lg uppercase"
                                    value={couponData.code}
                                    onChange={(e) => setCouponData({...couponData, code: e.target.value})}
                                    required
                                />
                                <input 
                                    type="number" placeholder="Discount Percentage (1-100)" 
                                    className="w-full border p-2 rounded-lg"
                                    value={couponData.discountPercentage}
                                    onChange={(e) => setCouponData({...couponData, discountPercentage: e.target.value})}
                                    min="1" max="100" required
                                />
                                <button type="submit" className="w-full bg-black text-white py-2 rounded-lg font-bold hover:bg-gray-800 transition">
                                    Create Coupon
                                </button>
                            </form>
                        </div>

                        {/* Coupons List */}
                        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                            <table className="w-full text-left min-w-[400px]">
                                <thead className="bg-gray-100 border-b">
                                    <tr><th className="p-4">Code</th><th className="p-4">Discount</th><th className="p-4">Action</th></tr>
                                </thead>
                                <tbody>
                                    {coupons.map(c => (
                                        <tr key={c._id} className="border-b hover:bg-gray-50">
                                            <td className="p-4 font-bold text-green-700">{c.code}</td>
                                            <td className="p-4">{c.discountPercentage}%</td>
                                            <td className="p-4">
                                                <button onClick={() => handleDeleteCoupon(c._id)} className="text-red-600 hover:bg-red-50 p-2 rounded-full"><Trash2 size={18}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
             </>
         )}
      </div>

      {/* --- MODALS --- */}

      {/* 1. Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                    <button onClick={() => setShowModal(false)}><X size={24}/></button>
                </div>
                <form id="productForm" onSubmit={handleSubmitProduct} className="space-y-4">
                    <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Product Name" className="w-full border p-2 rounded" required />
                    <input name="price" type="number" value={formData.price} onChange={handleInputChange} placeholder="Price" className="w-full border p-2 rounded" required />
                    <input name="originalPrice" type="number" value={formData.originalPrice} onChange={handleInputChange} placeholder="Original Price" className="w-full border p-2 rounded" />
                    <select name="category" value={formData.category} onChange={handleInputChange} className="w-full border p-2 rounded">
                        <option>Roll-on</option><option>Foot Spray</option><option>Intimate</option><option>Other</option>
                    </select>
                    <input name="tag" value={formData.tag} onChange={handleInputChange} placeholder="Tag" className="w-full border p-2 rounded" />
                    <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" className="w-full border p-2 rounded h-20"></textarea>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleInputChange} id="stock" />
                        <label htmlFor="stock">In Stock</label>
                    </div>
                    <input type="file" onChange={handleFileChange} className="w-full border p-2 rounded" />
                    {imagePreview && <img src={imagePreview} alt="Preview" className="h-20 object-cover rounded" />}
                    <button type="submit" className="w-full bg-green-700 text-white font-bold py-3 rounded-lg">Save</button>
                </form>
            </div>
        </div>
      )}

      {/* 2. ORDER DETAILS MODAL (NEW) */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] p-6 overflow-y-auto animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Package className="text-green-700"/> Order #{viewingOrder._id.slice(-6)}
                    </h2>
                    <button onClick={() => setViewingOrder(null)} className="p-1 hover:bg-gray-100 rounded-full"><X size={24}/></button>
                </div>
                
                <div className="space-y-6">
                    {/* Shipping Address Section */}
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                             <MapPin size={16}/> Delivery Address
                        </h3>
                        <div className="space-y-1">
                            <p className="font-bold text-lg text-gray-900">{viewingOrder.shippingAddress?.fullName || 'N/A'}</p>
                            <p className="text-gray-700">{viewingOrder.shippingAddress?.address || 'No Address Provided'}</p>
                            <p className="text-gray-700">{viewingOrder.shippingAddress?.city} - {viewingOrder.shippingAddress?.pincode}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 gap-2">
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="font-semibold w-16">Phone:</span> 
                                <a href={`tel:${viewingOrder.shippingAddress?.phone}`} className="text-blue-600 hover:underline">{viewingOrder.shippingAddress?.phone}</a>
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="font-semibold w-16">Email:</span> 
                                <a href={`mailto:${viewingOrder.shippingAddress?.email}`} className="text-blue-600 hover:underline">{viewingOrder.shippingAddress?.email}</a>
                            </p>
                        </div>
                    </div>

                    {/* Order Items Section */}
                    <div>
                        <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">Items Ordered</h3>
                        <div className="space-y-3">
                            {viewingOrder.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 pb-3 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500">
                                            {item.quantity}x
                                        </div>
                                        <span className="font-medium text-gray-800">{item.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between font-bold text-xl mt-4 pt-4 border-t border-gray-200">
                            <span>Total Amount</span>
                            <span className="text-green-700">₹{viewingOrder.totalPrice}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <button onClick={() => setViewingOrder(null)} className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg">
                        Close Details
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
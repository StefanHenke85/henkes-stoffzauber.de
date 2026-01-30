import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Package,
  ShoppingBag,
  Plus,
  Trash2,
  Edit,
  LogOut,
  Loader2,
  X,
  Check,
  Palette,
  Camera,
  Download,
  Tag,
  Scissors,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { productsApi, ordersApi, fabricsApi } from '@/utils/api';
import {
  formatCurrency,
  formatDate,
  cn,
} from '@/utils/helpers';
import { CameraCapture } from '@/components/CameraCapture';
import { AdminVouchers } from '@/components/AdminVouchers';
import { AdminPatterns } from '@/components/AdminPatterns';
import { AdminTailors } from '@/components/AdminTailors';
import { FabricScalePreview } from '@/components/FabricScalePreview';
import type { Product, Order, Fabric } from '@/types';

type Tab = 'products' | 'orders' | 'fabrics' | 'vouchers' | 'patterns' | 'tailors';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('products');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Fabrics state
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [fabricsLoading, setFabricsLoading] = useState(true);
  const [showFabricForm, setShowFabricForm] = useState(false);
  const [editingFabric, setEditingFabric] = useState<Fabric | null>(null);

  // Product form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    fabrics: '',
    availableFabrics: [] as string[],
    isFeatured: false,
    sizeType: 'oneSize' as 'headCircumference' | 'clothing' | 'oneSize' | 'dimensions',
    availableSizes: [] as string[],
    fabricScale: 1.0,
    productScale: 1.0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [maskFile, setMaskFile] = useState<File | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showProductCamera, setShowProductCamera] = useState(false);
  const [previewFabricId, setPreviewFabricId] = useState<string | null>(null);

  // Fabric form state
  const [fabricFormData, setFabricFormData] = useState({
    name: '',
    description: '',
    fabricType: '',
    material: '',
    color: '',
    pattern: '',
    width: '',
    isFeatured: false,
  });
  const [fabricImageFile, setFabricImageFile] = useState<File | null>(null);
  const [fabricFormLoading, setFabricFormLoading] = useState(false);
  const [showFabricCamera, setShowFabricCamera] = useState(false);

  // PWA Install
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/admin');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    loadProducts();
    loadOrders();
    loadFabrics();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsApi.getAdmin();
      setProducts(response.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Produkte');
    } finally {
      setProductsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await ordersApi.getAdmin();
      setOrders(response.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Bestellungen');
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadFabrics = async () => {
    try {
      const data = await fabricsApi.getAdmin();
      setFabrics(data);
    } catch (error) {
      toast.error('Fehler beim Laden der Stoffe');
    } finally {
      setFabricsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
    toast.success('Erfolgreich abgemeldet');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast.success('App erfolgreich installiert!');
      setShowInstallButton(false);
    }

    setDeferredPrompt(null);
  };

  // Product form handlers
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      fabrics: '',
      availableFabrics: [],
      isFeatured: false,
      sizeType: 'oneSize',
      availableSizes: [],
      fabricScale: 1.0,
      productScale: 1.0,
    });
    setImageFile(null);
    setMaskFile(null);
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      fabrics: product.fabrics || '',
      availableFabrics: product.availableFabrics || [],
      isFeatured: product.isFeatured,
      sizeType: product.sizeType || 'oneSize',
      availableSizes: product.availableSizes || [],
      fabricScale: product.fabricScale || 1.0,
      productScale: 1.0,
    });
    setShowProductForm(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('stock', formData.stock);
      data.append('fabrics', formData.fabrics);
      data.append('availableFabrics', JSON.stringify(formData.availableFabrics));
      data.append('isFeatured', String(formData.isFeatured));
      data.append('sizeType', formData.sizeType);
      data.append('availableSizes', JSON.stringify(formData.availableSizes));
      data.append('fabricScale', String(formData.fabricScale));
      data.append('productScale', String(formData.productScale));

      if (imageFile) {
        data.append('imageFile', imageFile);
      }

      if (maskFile) {
        data.append('maskFile', maskFile);
      }

      if (editingProduct) {
        await productsApi.update(editingProduct.id || editingProduct._id || '', data);
        toast.success('Produkt aktualisiert');
      } else {
        await productsApi.create(data);
        toast.success('Produkt erstellt');
      }

      loadProducts();
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Speichern');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Produkt "${product.name}" wirklich löschen?`)) return;

    try {
      await productsApi.delete(product.id || product._id || '');
      toast.success('Produkt gelöscht');
      loadProducts();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  // Fabric form handlers
  const resetFabricForm = () => {
    setFabricFormData({
      name: '',
      description: '',
      fabricType: '',
      material: '',
      color: '',
      pattern: '',
      width: '',
      isFeatured: false,
    });
    setFabricImageFile(null);
    setEditingFabric(null);
    setShowFabricForm(false);
  };

  const handleEditFabric = (fabric: Fabric) => {
    setEditingFabric(fabric);
    setFabricFormData({
      name: fabric.name,
      description: fabric.description,
      fabricType: fabric.fabricType,
      material: fabric.material || '',
      color: fabric.color || '',
      pattern: fabric.pattern || '',
      width: fabric.width ? String(fabric.width) : '',
      isFeatured: fabric.isFeatured,
    });
    setShowFabricForm(true);
  };

  const handleSubmitFabric = async (e: React.FormEvent) => {
    e.preventDefault();
    setFabricFormLoading(true);

    try {
      const data = new FormData();
      data.append('name', fabricFormData.name);
      data.append('description', fabricFormData.description);
      data.append('fabricType', fabricFormData.fabricType);
      data.append('material', fabricFormData.material);
      data.append('color', fabricFormData.color);
      data.append('pattern', fabricFormData.pattern);
      if (fabricFormData.width) {
        data.append('width', fabricFormData.width);
      }
      data.append('isFeatured', String(fabricFormData.isFeatured));

      if (fabricImageFile) {
        data.append('imageFile', fabricImageFile);
      }

      if (editingFabric) {
        await fabricsApi.update(editingFabric.id, data);
        toast.success('Stoff aktualisiert');
      } else {
        await fabricsApi.create(data);
        toast.success('Stoff erstellt');
      }

      loadFabrics();
      resetFabricForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Speichern');
    } finally {
      setFabricFormLoading(false);
    }
  };

  const handleDeleteFabric = async (fabric: Fabric) => {
    if (!confirm(`Stoff "${fabric.name}" wirklich löschen?`)) return;

    try {
      await fabricsApi.delete(fabric.id);
      toast.success('Stoff gelöscht');
      loadFabrics();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const handleUpdateOrderStatus = async (
    order: Order,
    field: 'orderStatus' | 'paymentStatus',
    value: string
  ) => {
    try {
      await ordersApi.updateStatus(order.id, { [field]: value });
      toast.success('Status aktualisiert');
      loadOrders();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!confirm(`Bestellung ${order.orderNumber} wirklich löschen?`)) return;

    try {
      await ordersApi.delete(order.id);
      toast.success('Bestellung gelöscht');
      loadOrders();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Henkes Stoffzauber</title>
      </Helmet>

      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-neutral-800">
                Admin Dashboard
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-neutral-500">Hallo, {user.username}</span>

                {showInstallButton && (
                  <button
                    onClick={handleInstallClick}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 transition-colors"
                    title="App auf dem Gerät installieren"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">App installieren</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Abmelden
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveTab('products')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  activeTab === 'products'
                    ? 'bg-primary-400 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Package className="h-4 w-4" />
                Produkte ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  activeTab === 'orders'
                    ? 'bg-primary-400 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <ShoppingBag className="h-4 w-4" />
                Bestellungen ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('fabrics')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  activeTab === 'fabrics'
                    ? 'bg-primary-400 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Palette className="h-4 w-4" />
                Stoffe ({fabrics.length})
              </button>
              <button
                onClick={() => setActiveTab('vouchers')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  activeTab === 'vouchers'
                    ? 'bg-primary-400 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Tag className="h-4 w-4" />
                Gutscheine
              </button>
              <button
                onClick={() => setActiveTab('patterns')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  activeTab === 'patterns'
                    ? 'bg-primary-400 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Scissors className="h-4 w-4" />
                Schnittmuster
              </button>
              <button
                onClick={() => setActiveTab('tailors')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  activeTab === 'tailors'
                    ? 'bg-primary-400 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Users className="h-4 w-4" />
                Verkäufer
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-neutral-800">
                  Produkte verwalten
                </h2>
                <button
                  onClick={() => setShowProductForm(true)}
                  className="flex items-center gap-2 bg-primary-400 text-white px-4 py-2 rounded-lg hover:bg-primary-500 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Neues Produkt
                </button>
              </div>

              {/* Product Form Modal */}
              {showProductForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold">
                        {editingProduct ? 'Produkt bearbeiten' : 'Neues Produkt'}
                      </h3>
                      <button
                        type="button"
                        onClick={resetForm}
                        aria-label="Formular schließen"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmitProduct} className="space-y-4">
                      <div>
                        <label htmlFor="product-name" className="block text-sm font-medium mb-1">Name</label>
                        <input
                          id="product-name"
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="product-description" className="block text-sm font-medium mb-1">
                          Beschreibung
                        </label>
                        <textarea
                          id="product-description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                          rows={3}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="product-price" className="block text-sm font-medium mb-1">
                            Preis (EUR)
                          </label>
                          <input
                            id="product-price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) =>
                              setFormData({ ...formData, price: e.target.value })
                            }
                            className="w-full px-4 py-2 border rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="product-stock" className="block text-sm font-medium mb-1">
                            Bestand
                          </label>
                          <input
                            id="product-stock"
                            type="number"
                            min="0"
                            value={formData.stock}
                            onChange={(e) =>
                              setFormData({ ...formData, stock: e.target.value })
                            }
                            className="w-full px-4 py-2 border rounded-lg"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Stoffe (Textbeschreibung)
                        </label>
                        <input
                          type="text"
                          value={formData.fabrics}
                          onChange={(e) =>
                            setFormData({ ...formData, fabrics: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="z.B. Jersey, Baumwolle"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Stoffauswahl (für Kunden)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          Wählen Sie Stoffe aus, aus denen Kunden dieses Produkt fertigen lassen können
                        </p>
                        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                          {fabrics.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-2">
                              Keine Stoffe verfügbar. Erstellen Sie zuerst Stoffe im "Stoffe" Tab.
                            </p>
                          ) : (
                            fabrics.map((fabric) => (
                              <label
                                key={fabric.id}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.availableFabrics.includes(fabric.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        availableFabrics: [...formData.availableFabrics, fabric.id],
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        availableFabrics: formData.availableFabrics.filter(
                                          (id) => id !== fabric.id
                                        ),
                                      });
                                    }
                                  }}
                                  className="h-4 w-4 text-primary-500 rounded border-gray-300"
                                />
                                <span className="text-sm">{fabric.name}</span>
                                <span className="text-xs text-gray-400">({fabric.fabricType})</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="size-type" className="block text-sm font-medium mb-2">
                          Größentyp
                        </label>
                        <select
                          id="size-type"
                          value={formData.sizeType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sizeType: e.target.value as any,
                              availableSizes: [] // Reset sizes when type changes
                            })
                          }
                          className="w-full px-4 py-2 border rounded-lg mb-3"
                        >
                          <option value="oneSize">Einheitsgröße (keine Größenauswahl)</option>
                          <option value="headCircumference">Kopfumfang (40-70 cm)</option>
                          <option value="clothing">Kleidergrößen (S, M, L, XL, etc.)</option>
                          <option value="dimensions">Maße (Länge x Breite in cm)</option>
                        </select>

                        {formData.sizeType === 'headCircumference' && (
                          <div className="border rounded-lg p-3 bg-gray-50">
                            <p className="text-sm text-gray-600 mb-2">
                              Verfügbare Kopfumfänge (in cm):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {[48, 50, 52, 54, 56, 58, 60].map((size) => (
                                <label
                                  key={size}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded cursor-pointer hover:bg-primary-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.availableSizes.includes(String(size))}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData({
                                          ...formData,
                                          availableSizes: [...formData.availableSizes, String(size)].sort((a, b) => Number(a) - Number(b)),
                                        });
                                      } else {
                                        setFormData({
                                          ...formData,
                                          availableSizes: formData.availableSizes.filter((s) => s !== String(size)),
                                        });
                                      }
                                    }}
                                    className="h-4 w-4 text-primary-500 rounded border-gray-300"
                                  />
                                  <span className="text-sm">{size} cm</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {formData.sizeType === 'clothing' && (
                          <div className="border rounded-lg p-3 bg-gray-50">
                            <p className="text-sm text-gray-600 mb-2">
                              Verfügbare Kleidergrößen:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                                <label
                                  key={size}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded cursor-pointer hover:bg-primary-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.availableSizes.includes(size)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData({
                                          ...formData,
                                          availableSizes: [...formData.availableSizes, size],
                                        });
                                      } else {
                                        setFormData({
                                          ...formData,
                                          availableSizes: formData.availableSizes.filter((s) => s !== size),
                                        });
                                      }
                                    }}
                                    className="h-4 w-4 text-primary-500 rounded border-gray-300"
                                  />
                                  <span className="text-sm">{size}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {formData.sizeType === 'dimensions' && (
                          <div className="border rounded-lg p-3 bg-gray-50">
                            <p className="text-sm text-gray-600 mb-2">
                              Maße eingeben (Format: "30x40" für 30 cm x 40 cm):
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="z.B. 30x40"
                                className="flex-1 px-3 py-2 border rounded"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.currentTarget;
                                    const value = input.value.trim();
                                    if (value && /^\d+x\d+$/.test(value) && !formData.availableSizes.includes(value)) {
                                      setFormData({
                                        ...formData,
                                        availableSizes: [...formData.availableSizes, value],
                                      });
                                      input.value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                  const value = input.value.trim();
                                  if (value && /^\d+x\d+$/.test(value) && !formData.availableSizes.includes(value)) {
                                    setFormData({
                                      ...formData,
                                      availableSizes: [...formData.availableSizes, value],
                                    });
                                    input.value = '';
                                  }
                                }}
                                className="px-4 py-2 bg-primary-400 text-white rounded hover:bg-primary-500"
                                aria-label="Maß hinzufügen"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            {formData.availableSizes.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {formData.availableSizes.map((size) => (
                                  <span
                                    key={size}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border rounded text-sm"
                                  >
                                    {size} cm
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFormData({
                                          ...formData,
                                          availableSizes: formData.availableSizes.filter((s) => s !== size),
                                        })
                                      }
                                      className="text-red-500 hover:text-red-700"
                                      aria-label={`Maß ${size} entfernen`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="product-image" className="block text-sm font-medium mb-1">Bild</label>
                        <div className="flex gap-2">
                          <input
                            id="product-image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && file.size > 0) {
                                setImageFile(file);
                              } else {
                                setImageFile(null);
                              }
                            }}
                            className="flex-1 px-4 py-2 border rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setShowProductCamera(true)}
                            className="px-4 py-2 bg-secondary-400 text-neutral-800 rounded-lg hover:bg-secondary-500 transition-colors flex items-center gap-2"
                            aria-label="Foto mit Kamera aufnehmen"
                          >
                            <Camera className="h-5 w-5" />
                            <span className="hidden sm:inline">Kamera</span>
                          </button>
                        </div>
                        {imageFile && (
                          <p className="text-sm text-green-600 mt-1">
                            Bild ausgewählt: {imageFile.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="product-mask" className="block text-sm font-medium mb-1">
                          Chamäleon-Maske (optional)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          Schwarz-Weiß-Rot-Bild: <strong>SCHWARZE</strong> Bereiche (RGB 0,0,0) = Außenstoff, <strong>ROTE</strong> Bereiche (RGB 255,0,0) = Innenstoff, alle anderen = original
                        </p>
                        <input
                          id="product-mask"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && file.size > 0) {
                              setMaskFile(file);
                            } else {
                              setMaskFile(null);
                            }
                          }}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        {maskFile && (
                          <p className="text-sm text-green-600 mt-1">
                            Maske ausgewählt: {maskFile.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="fabric-scale" className="block text-sm font-medium mb-1">
                          Stoffmuster-Skalierung
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          Passt die Größe des Stoffmusters an (z.B. wenn Produkt und Stoff aus unterschiedlichen Entfernungen fotografiert wurden)
                        </p>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-500 w-12">25%</span>
                          <input
                            id="fabric-scale"
                            type="range"
                            min="0.25"
                            max="3"
                            step="0.05"
                            value={formData.fabricScale}
                            onChange={(e) =>
                              setFormData({ ...formData, fabricScale: parseFloat(e.target.value) })
                            }
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-400"
                          />
                          <span className="text-xs text-gray-500 w-12">300%</span>
                        </div>
                        <div className="text-center mt-2">
                          <span className="text-sm font-semibold text-primary-600">
                            {Math.round(formData.fabricScale * 100)}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="product-scale" className="block text-sm font-medium mb-1">
                          Produkt-Skalierung (Vorschau)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          Passt die Produktgröße in der Vorschau an, um schwarze Maskenflächen zu eliminieren
                        </p>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-500 w-12">25%</span>
                          <input
                            id="product-scale"
                            type="range"
                            min="0.25"
                            max="3"
                            step="0.05"
                            value={formData.productScale}
                            onChange={(e) =>
                              setFormData({ ...formData, productScale: parseFloat(e.target.value) })
                            }
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary-400"
                          />
                          <span className="text-xs text-gray-500 w-12">300%</span>
                        </div>
                        <div className="text-center mt-2">
                          <span className="text-sm font-semibold text-secondary-600">
                            {Math.round(formData.productScale * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Fabric Scale Preview */}
                      {(imageFile || editingProduct?.imageUrl) && (
                        <>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Stoff für Vorschau auswählen
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                              {fabrics.map((fabric) => {
                                const imageUrl = fabric.thumbnailUrl || fabric.imageUrl;
                                const fullImageUrl = imageUrl?.startsWith('blob:') || imageUrl?.startsWith('http')
                                  ? imageUrl
                                  : imageUrl;

                                return (
                                  <button
                                    key={fabric.id}
                                    type="button"
                                    onClick={() => setPreviewFabricId(fabric.id === previewFabricId ? null : fabric.id)}
                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                      previewFabricId === fabric.id
                                        ? 'border-primary-500 ring-2 ring-primary-200'
                                        : 'border-gray-200 hover:border-primary-300'
                                    }`}
                                    title={`${fabric.name} (${fabric.fabricType})`}
                                  >
                                    {imageUrl ? (
                                      <img
                                        src={fullImageUrl}
                                        alt={fabric.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-xs text-gray-400">Kein Bild</span>
                                      </div>
                                    )}
                                    {previewFabricId === fabric.id && (
                                      <div className="absolute inset-0 bg-primary-500 bg-opacity-20 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            {previewFabricId && (
                              <p className="text-xs text-gray-600 mt-2">
                                Ausgewählt: {fabrics.find(f => f.id === previewFabricId)?.name}
                              </p>
                            )}
                          </div>

                          {previewFabricId && (
                            <FabricScalePreview
                              productImageUrl={
                                imageFile
                                  ? URL.createObjectURL(imageFile)
                                  : editingProduct?.imageUrl || null
                              }
                              maskImageUrl={
                                maskFile
                                  ? URL.createObjectURL(maskFile)
                                  : editingProduct?.maskUrl || null
                              }
                              fabricScale={formData.fabricScale}
                              productScale={formData.productScale}
                              selectedFabric={fabrics.find(f => f.id === previewFabricId) || null}
                            />
                          )}
                        </>
                      )}

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.isFeatured}
                          onChange={(e) =>
                            setFormData({ ...formData, isFeatured: e.target.checked })
                          }
                        />
                        <span>Featured (auf Startseite anzeigen)</span>
                      </label>

                      <button
                        type="submit"
                        disabled={formLoading}
                        className="w-full bg-primary-400 text-white py-3 rounded-lg font-semibold hover:bg-primary-500 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {formLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-5 w-5" />
                            {editingProduct ? 'Speichern' : 'Erstellen'}
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Products Table */}
              {productsLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-400" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Noch keine Produkte</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Produkt
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Preis
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Bestand
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                          Aktionen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product.id || product._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {product.imageUrl && (
                                <img
                                  src={product.imageUrl}
                                  alt=""
                                  className="w-10 h-10 rounded object-cover"
                                />
                              )}
                              <span className="font-medium">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">{formatCurrency(product.price)}</td>
                          <td className="px-4 py-3">{product.stock}</td>
                          <td className="px-4 py-3">
                            {product.isFeatured && (
                              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                                Featured
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleEditProduct(product)}
                              className="p-2 hover:bg-gray-100 rounded"
                              aria-label={`Produkt ${product.name} bearbeiten`}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product)}
                              className="p-2 hover:bg-red-50 text-red-500 rounded"
                              aria-label={`Produkt ${product.name} löschen`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-6">
                Bestellungen verwalten
              </h2>

              {ordersLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-400" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Noch keine Bestellungen</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl p-6 shadow-sm"
                    >
                      <div className="flex flex-wrap justify-between gap-4 mb-4">
                        <div>
                          <p className="font-semibold text-lg">{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">
                            {order.createdAt && formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl text-primary-500">
                            {formatCurrency(order.total)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.items.length} Artikel
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Kunde</p>
                          <p className="font-medium">
                            {order.customer.firstName} {order.customer.lastName}
                          </p>
                          <p className="text-sm">{order.customer.email}</p>
                        </div>

                        <div>
                          <label htmlFor={`order-status-${order.id}`} className="text-sm text-gray-500 mb-1 block">Bestellstatus</label>
                          <select
                            id={`order-status-${order.id}`}
                            value={order.orderStatus}
                            onChange={(e) =>
                              handleUpdateOrderStatus(order, 'orderStatus', e.target.value)
                            }
                            className="px-3 py-1.5 border rounded-lg text-sm w-full"
                            aria-label="Bestellstatus ändern"
                          >
                            <option value="new">Neu</option>
                            <option value="processing">In Bearbeitung</option>
                            <option value="shipped">Versandt</option>
                            <option value="delivered">Geliefert</option>
                            <option value="cancelled">Storniert</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor={`payment-status-${order.id}`} className="text-sm text-gray-500 mb-1 block">Zahlungsstatus</label>
                          <select
                            id={`payment-status-${order.id}`}
                            value={order.paymentStatus}
                            onChange={(e) =>
                              handleUpdateOrderStatus(order, 'paymentStatus', e.target.value)
                            }
                            className="px-3 py-1.5 border rounded-lg text-sm w-full"
                            aria-label="Zahlungsstatus ändern"
                          >
                            <option value="pending">Ausstehend</option>
                            <option value="paid">Bezahlt</option>
                            <option value="failed">Fehlgeschlagen</option>
                            <option value="refunded">Erstattet</option>
                          </select>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-500 mb-2">Bestellte Artikel:</p>
                        <ul className="space-y-1">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="text-sm">
                              {item.name} x {item.quantity} - {formatCurrency(item.price * item.quantity)}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="border-t pt-4">
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(order)}
                          className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Bestellung löschen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fabrics Tab */}
          {activeTab === 'fabrics' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-neutral-800">
                  Stoffe verwalten
                </h2>
                <button
                  onClick={() => setShowFabricForm(true)}
                  className="flex items-center gap-2 bg-primary-400 text-white px-4 py-2 rounded-lg hover:bg-primary-500 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Neuer Stoff
                </button>
              </div>

              {/* Fabric Form Modal */}
              {showFabricForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold">
                        {editingFabric ? 'Stoff bearbeiten' : 'Neuer Stoff'}
                      </h3>
                      <button
                        type="button"
                        onClick={resetFabricForm}
                        aria-label="Formular schließen"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmitFabric} className="space-y-4">
                      <div>
                        <label htmlFor="fabric-name" className="block text-sm font-medium mb-1">Name</label>
                        <input
                          id="fabric-name"
                          type="text"
                          value={fabricFormData.name}
                          onChange={(e) =>
                            setFabricFormData({ ...fabricFormData, name: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="fabric-description" className="block text-sm font-medium mb-1">
                          Beschreibung
                        </label>
                        <textarea
                          id="fabric-description"
                          value={fabricFormData.description}
                          onChange={(e) =>
                            setFabricFormData({ ...fabricFormData, description: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                          rows={3}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Stoffart
                          </label>
                          <input
                            type="text"
                            value={fabricFormData.fabricType}
                            onChange={(e) =>
                              setFabricFormData({ ...fabricFormData, fabricType: e.target.value })
                            }
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="z.B. Jersey, Fleece"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Material
                          </label>
                          <input
                            type="text"
                            value={fabricFormData.material}
                            onChange={(e) =>
                              setFabricFormData({ ...fabricFormData, material: e.target.value })
                            }
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="z.B. 100% Baumwolle"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Farbe
                          </label>
                          <input
                            type="text"
                            value={fabricFormData.color}
                            onChange={(e) =>
                              setFabricFormData({ ...fabricFormData, color: e.target.value })
                            }
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="z.B. Blau, Rot"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Muster
                          </label>
                          <input
                            type="text"
                            value={fabricFormData.pattern}
                            onChange={(e) =>
                              setFabricFormData({ ...fabricFormData, pattern: e.target.value })
                            }
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="z.B. Uni, Streifen"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Breite (cm)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={fabricFormData.width}
                          onChange={(e) =>
                            setFabricFormData({ ...fabricFormData, width: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="z.B. 150"
                        />
                      </div>

                      <div>
                        <label htmlFor="fabric-image" className="block text-sm font-medium mb-1">Bild</label>
                        <div className="flex gap-2">
                          <input
                            id="fabric-image"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setFabricImageFile(e.target.files?.[0] || null)
                            }
                            className="flex-1 px-4 py-2 border rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setShowFabricCamera(true)}
                            className="px-4 py-2 bg-secondary-400 text-neutral-800 rounded-lg hover:bg-secondary-500 transition-colors flex items-center gap-2"
                            aria-label="Foto mit Kamera aufnehmen"
                          >
                            <Camera className="h-5 w-5" />
                            <span className="hidden sm:inline">Kamera</span>
                          </button>
                        </div>
                        {fabricImageFile && (
                          <p className="text-sm text-green-600 mt-1">
                            Bild ausgewählt: {fabricImageFile.name}
                          </p>
                        )}
                      </div>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={fabricFormData.isFeatured}
                          onChange={(e) =>
                            setFabricFormData({ ...fabricFormData, isFeatured: e.target.checked })
                          }
                        />
                        <span>Featured (auf Startseite anzeigen)</span>
                      </label>

                      <button
                        type="submit"
                        disabled={fabricFormLoading}
                        className="w-full bg-primary-400 text-white py-3 rounded-lg font-semibold hover:bg-primary-500 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {fabricFormLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-5 w-5" />
                            {editingFabric ? 'Speichern' : 'Erstellen'}
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Fabrics Grid */}
              {fabricsLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-400" />
                </div>
              ) : fabrics.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <Palette className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Noch keine Stoffe</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fabrics.map((fabric) => (
                    <div
                      key={fabric.id}
                      className="bg-white rounded-xl shadow-sm overflow-hidden"
                    >
                      {fabric.imageUrl && (
                        <img
                          src={fabric.imageUrl}
                          alt={fabric.name}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{fabric.name}</h3>
                          {fabric.isFeatured && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          {fabric.fabricType}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {fabric.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {fabric.material && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {fabric.material}
                            </span>
                          )}
                          {fabric.color && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {fabric.color}
                            </span>
                          )}
                          {fabric.width && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {fabric.width} cm
                            </span>
                          )}
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditFabric(fabric)}
                            className="p-2 hover:bg-gray-100 rounded"
                            aria-label={`Stoff ${fabric.name} bearbeiten`}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFabric(fabric)}
                            className="p-2 hover:bg-red-50 text-red-500 rounded"
                            aria-label={`Stoff ${fabric.name} löschen`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Camera Modals */}
      {showProductCamera && (
        <CameraCapture
          onCapture={(file) => {
            setImageFile(file);
            setShowProductCamera(false);
          }}
          onCancel={() => setShowProductCamera(false)}
        />
      )}

      {/* Vouchers Tab */}
      {activeTab === 'vouchers' && <AdminVouchers />}

      {/* Patterns Tab */}
      {activeTab === 'patterns' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminPatterns />
        </main>
      )}

      {/* Tailors Tab */}
      {activeTab === 'tailors' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminTailors />
        </main>
      )}

      {showFabricCamera && (
        <CameraCapture
          onCapture={(file) => {
            setFabricImageFile(file);
            setShowFabricCamera(false);
          }}
          onCancel={() => setShowFabricCamera(false)}
        />
      )}
    </>
  );
}

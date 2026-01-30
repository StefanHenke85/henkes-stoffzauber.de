import { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Scissors,
  LogOut,
  Loader2,
  User,
  Plus,
  Edit,
  Trash2,
  FileText,
  Archive,
  X,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { tailorAuthApi, patternsApi } from '@/utils/api';

interface TailorUser {
  id: string;
  name: string;
  slug: string;
  username: string;
  email: string;
  description: string | null;
  logoUrl: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  isFeatured: boolean;
}

interface Pattern {
  id: string;
  filename: string;
  name: string;
  type: 'pdf' | 'zip';
  sizeFormatted: string;
  hasThumbnail: boolean;
  thumbnailUrl: string | null;
}

type Tab = 'products' | 'patterns' | 'profile';

export function TailorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tailor, setTailor] = useState<TailorUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('products');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSaving, setProductSaving] = useState(false);

  // Product form state
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('Sonstiges');
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const productImageRef = useRef<HTMLInputElement>(null);

  // Patterns state
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [patternsLoading, setPatternsLoading] = useState(true);
  const [patternUploading, setPatternUploading] = useState(false);
  const patternInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const tailorData = await tailorAuthApi.getMe();
      if (!tailorData) {
        navigate('/verkaeufer/login');
        return;
      }
      setTailor(tailorData);
      loadProducts();
      loadPatterns();
    } catch (error) {
      navigate('/verkaeufer/login');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await tailorAuthApi.getMyProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadPatterns = async () => {
    try {
      setPatternsLoading(true);
      const response = await tailorAuthApi.getMyPatterns();
      setPatterns(response.data || []);
    } catch (error) {
      console.error('Error loading patterns:', error);
    } finally {
      setPatternsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await tailorAuthApi.logout();
      localStorage.removeItem('tailor');
      localStorage.removeItem('tailor_token');
      toast.success('Erfolgreich abgemeldet');
      navigate('/verkaeufer/login');
    } catch (error) {
      toast.error('Fehler beim Abmelden');
    }
  };

  // Product functions
  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductName(product.name);
      setProductDescription(product.description);
      setProductPrice(product.price.toString());
      setProductImagePreview(product.imageUrl);
    } else {
      setEditingProduct(null);
      setProductName('');
      setProductDescription('');
      setProductPrice('');
      setProductCategory('Sonstiges');
      setProductImage(null);
      setProductImagePreview(null);
    }
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setProductName('');
    setProductDescription('');
    setProductPrice('');
    setProductImage(null);
    setProductImagePreview(null);
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async () => {
    if (!productName || !productPrice) {
      toast.error('Name und Preis sind erforderlich');
      return;
    }

    setProductSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', productName);
      formData.append('description', productDescription);
      formData.append('price', productPrice);
      formData.append('stock', '1');
      formData.append('category', productCategory);
      if (productImage) {
        formData.append('image', productImage);
      }

      if (editingProduct) {
        await tailorAuthApi.updateProduct(editingProduct.id, formData);
        toast.success('Produkt aktualisiert');
      } else {
        await tailorAuthApi.createProduct(formData);
        toast.success('Produkt erstellt');
      }

      closeProductModal();
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Speichern');
    } finally {
      setProductSaving(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Möchten Sie "${product.name}" wirklich löschen?`)) {
      return;
    }

    try {
      await tailorAuthApi.deleteProduct(product.id);
      toast.success('Produkt gelöscht');
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Löschen');
    }
  };

  // Pattern functions
  const handlePatternUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.pdf') && !ext.endsWith('.zip')) {
      toast.error('Nur PDF und ZIP Dateien erlaubt');
      return;
    }

    setPatternUploading(true);
    try {
      await tailorAuthApi.uploadPattern(file);
      toast.success('Schnittmuster hochgeladen');
      loadPatterns();
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Hochladen');
    } finally {
      setPatternUploading(false);
      if (patternInputRef.current) {
        patternInputRef.current.value = '';
      }
    }
  };

  const handleDeletePattern = async (pattern: Pattern) => {
    if (!confirm(`Möchten Sie "${pattern.name}" wirklich löschen?`)) {
      return;
    }

    try {
      await tailorAuthApi.deletePattern(pattern.id);
      toast.success('Schnittmuster gelöscht');
      loadPatterns();
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Löschen');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (!tailor) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Mein Dashboard - {tailor.name} | Henkes Stoffzauber</title>
      </Helmet>

      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  {tailor.logoUrl ? (
                    <img
                      src={tailor.logoUrl}
                      alt={tailor.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-primary-500" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-neutral-800">
                    {tailor.name}
                  </h1>
                  <p className="text-sm text-gray-500">Verkäufer Dashboard</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'products'
                    ? 'bg-primary-400 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Package className="h-4 w-4" />
                Meine Produkte
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('patterns')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'patterns'
                    ? 'bg-primary-400 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Scissors className="h-4 w-4" />
                Meine Schnittmuster
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-primary-400 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <User className="h-4 w-4" />
                Mein Profil
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-800">
                    Meine Produkte
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {products.length} Produkte
                  </p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 transition-colors"
                  onClick={() => openProductModal()}
                >
                  <Plus className="h-4 w-4" />
                  Neues Produkt
                </button>
              </div>

              {productsLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-400" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Sie haben noch keine Produkte</p>
                  <button
                    type="button"
                    className="text-primary-500 hover:underline"
                    onClick={() => openProductModal()}
                  >
                    Erstes Produkt erstellen
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl shadow-sm overflow-hidden"
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-primary-500 font-bold mt-1">
                          {product.price.toFixed(2)} EUR
                        </p>
                        <div className="flex justify-end gap-2 mt-4">
                          <button
                            type="button"
                            className="p-2 hover:bg-gray-100 rounded"
                            onClick={() => openProductModal(product)}
                            title="Bearbeiten"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-2 hover:bg-red-50 text-red-500 rounded"
                            onClick={() => handleDeleteProduct(product)}
                            title="Löschen"
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

          {/* Patterns Tab */}
          {activeTab === 'patterns' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-800">
                    Meine Schnittmuster
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {patterns.length} Schnittmuster
                  </p>
                </div>
                <label className="flex items-center gap-2 px-4 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 transition-colors cursor-pointer">
                  {patternUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Hochladen
                  <input
                    ref={patternInputRef}
                    type="file"
                    accept=".pdf,.zip"
                    className="hidden"
                    onChange={handlePatternUpload}
                    disabled={patternUploading}
                  />
                </label>
              </div>

              {patternsLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-400" />
                </div>
              ) : patterns.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <Scissors className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Sie haben noch keine Schnittmuster</p>
                  <label className="text-primary-500 hover:underline cursor-pointer">
                    Erstes Schnittmuster hochladen
                    <input
                      type="file"
                      accept=".pdf,.zip"
                      className="hidden"
                      onChange={handlePatternUpload}
                      disabled={patternUploading}
                    />
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {patterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="bg-white rounded-xl shadow-sm overflow-hidden"
                    >
                      <div
                        className={`h-32 flex items-center justify-center ${
                          pattern.type === 'pdf' ? 'bg-gray-100' : 'bg-amber-50'
                        }`}
                      >
                        {pattern.hasThumbnail ? (
                          <img
                            src={
                              pattern.thumbnailUrl?.startsWith('http')
                                ? pattern.thumbnailUrl
                                : patternsApi.getThumbnailUrl(pattern.id)
                            }
                            alt={pattern.name}
                            className="w-full h-full object-contain"
                          />
                        ) : pattern.type === 'pdf' ? (
                          <FileText className="h-12 w-12 text-red-400" />
                        ) : (
                          <Archive className="h-12 w-12 text-amber-500" />
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm truncate" title={pattern.name}>
                          {pattern.name}
                        </h3>
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                          <span className="uppercase font-semibold px-2 py-0.5 rounded bg-gray-100">
                            {pattern.type}
                          </span>
                          <span>{pattern.sizeFormatted}</span>
                        </div>
                        <button
                          type="button"
                          className="mt-3 w-full p-2 text-red-500 hover:bg-red-50 rounded text-sm flex items-center justify-center gap-1"
                          onClick={() => handleDeletePattern(pattern)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Löschen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold text-neutral-800 mb-6">
                Mein Profil
              </h2>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    {tailor.logoUrl ? (
                      <img
                        src={tailor.logoUrl}
                        alt={tailor.name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-primary-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{tailor.name}</h3>
                    <p className="text-gray-500">@{tailor.username}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">E-Mail</label>
                    <p className="text-neutral-800">{tailor.email}</p>
                  </div>

                  {tailor.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Über mich</label>
                      <p className="text-neutral-800">{tailor.description}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Profil-URL</label>
                    <p className="text-primary-500">
                      henkes-stoffzauber.de/verkaeufer/{tailor.slug}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingProduct ? 'Produkt bearbeiten' : 'Neues Produkt'}
              </h3>
              <button
                type="button"
                onClick={closeProductModal}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produktbild
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 transition-colors"
                  onClick={() => productImageRef.current?.click()}
                >
                  {productImagePreview ? (
                    <img
                      src={productImagePreview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded"
                    />
                  ) : (
                    <div className="py-8">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Klicken zum Hochladen</p>
                    </div>
                  )}
                </div>
                <input
                  ref={productImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProductImageChange}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  placeholder="z.B. Handgenähte Mütze"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  placeholder="Beschreiben Sie Ihr Produkt..."
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preis (EUR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  placeholder="19.99"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategorie
                </label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                >
                  <option value="Mützen">Mützen</option>
                  <option value="Schals">Schals</option>
                  <option value="Loops">Loops</option>
                  <option value="Taschen">Taschen</option>
                  <option value="Kleidung">Kleidung</option>
                  <option value="Accessoires">Accessoires</option>
                  <option value="Sonstiges">Sonstiges</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                type="button"
                onClick={closeProductModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={productSaving}
                className="px-4 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {productSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingProduct ? 'Speichern' : 'Erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

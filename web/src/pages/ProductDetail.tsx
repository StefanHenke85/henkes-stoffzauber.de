import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShoppingCart, ArrowLeft, Check, Ruler, X, Maximize2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi, fabricsApi } from '@/utils/api';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency, getImageUrl, cn } from '@/utils/helpers';
import type { Product, Fabric } from '@/types';

export function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [allFabrics, setAllFabrics] = useState<Fabric[]>([]);
  const [selectedOuterFabricId, setSelectedOuterFabricId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [chameleonImageUrl, setChameleonImageUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const productImgRef = useRef<HTMLImageElement>(null);
  const fabricImgRef = useRef<HTMLImageElement>(null);
  const maskImgRef = useRef<HTMLImageElement>(null);

  const { addItem, isInCart, getItemQuantity } = useCart();

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;

      try {
        const data = await productsApi.getById(productId);
        if (data) {
          setProduct(data);
          // Set default size if available
          if (data.sizeType === 'oneSize') {
            setSelectedSize('Einheitsgröße');
          }
        } else {
          setError('Produkt nicht gefunden');
        }
      } catch (err) {
        setError('Fehler beim Laden des Produkts');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  // Load all fabrics
  useEffect(() => {
    const loadFabrics = async () => {
      try {
        const data = await fabricsApi.getAll();
        setAllFabrics(data.filter(f => f.isActive));
      } catch (err) {
        console.error('Error loading fabrics:', err);
      }
    };

    loadFabrics();
  }, []);

  // ESC-Taste schließt Vollbild
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Chamäleon-Funktion: Überträgt Stofffarbe auf Produkt
  useEffect(() => {
    const selectedOuterFabric = selectedOuterFabricId
      ? allFabrics.find(f => f.id === selectedOuterFabricId)
      : null;

    if (!selectedOuterFabric || !productImgRef.current || !fabricImgRef.current || !canvasRef.current || !product) {
      setChameleonImageUrl(null);
      return;
    }

    const applyFabricToProduct = async () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      const productImg = productImgRef.current!;
      const fabricImg = fabricImgRef.current!;
      const maskImg = maskImgRef.current;

      // Warte bis alle Bilder geladen sind
      const imagesToLoad = [
        productImg.complete ? Promise.resolve() : new Promise(r => productImg.onload = r),
        fabricImg.complete ? Promise.resolve() : new Promise(r => fabricImg.onload = r)
      ];
      if (maskImg && product.maskUrl) {
        imagesToLoad.push(maskImg.complete ? Promise.resolve() : new Promise(r => maskImg!.onload = r));
      }
      await Promise.all(imagesToLoad);

      // Canvas bleibt bei Original-Produktgröße
      const originalProductWidth = productImg.naturalWidth;
      const originalProductHeight = productImg.naturalHeight;

      canvas.width = originalProductWidth;
      canvas.height = originalProductHeight;

      // Wende fabricScale und productScale an (Standard jeweils: 1.0)
      const fabricScaleValue = product.fabricScale || 1.0;
      const productScaleValue = product.productScale || 1.0;
      console.log('[ProductDetail] fabricScale:', fabricScaleValue, 'productScale:', productScaleValue, 'für Produkt:', product.name);

      // Berechne skalierte Produktgröße (kleiner = mehr Platz für Stoff)
      const scaledProductWidth = originalProductWidth * productScaleValue;
      const scaledProductHeight = originalProductHeight * productScaleValue;

      // Zentriere das skalierte Produkt auf dem Canvas
      const productX = (canvas.width - scaledProductWidth) / 2;
      const productY = (canvas.height - scaledProductHeight) / 2;

      // 1. Zeichne Produktbild (skaliert und zentriert)
      ctx.drawImage(productImg, productX, productY, scaledProductWidth, scaledProductHeight);
      const productData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // 2. Zeichne Außen-Stoffmuster (skaliert, OHNE Kacheln)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Skaliere Stoff basierend auf fabricScale
      const scaledFabricWidth = fabricImg.naturalWidth * fabricScaleValue;
      const scaledFabricHeight = fabricImg.naturalHeight * fabricScaleValue;

      // Zentriere und zeichne Stoff EINMAL (ohne Kacheln)
      const fabricX = (canvas.width - scaledFabricWidth) / 2;
      const fabricY = (canvas.height - scaledFabricHeight) / 2;

      ctx.drawImage(
        fabricImg,
        fabricX,
        fabricY,
        scaledFabricWidth,
        scaledFabricHeight
      );

      const fabricData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Lade Maske falls vorhanden
      let maskData: ImageData | null = null;
      if (maskImg && product.maskUrl) {
        // WICHTIG: Prüfe ob Maske die gleiche Größe wie das Produktbild hat
        const maskWidth = maskImg.naturalWidth;
        const maskHeight = maskImg.naturalHeight;
        const productWidth = productImg.naturalWidth;
        const productHeight = productImg.naturalHeight;

        console.log('[Mask Debug]', {
          maskSize: `${maskWidth}x${maskHeight}`,
          productSize: `${productWidth}x${productHeight}`,
          match: maskWidth === productWidth && maskHeight === productHeight
        });

        if (maskWidth !== productWidth || maskHeight !== productHeight) {
          console.warn('⚠️ WARNUNG: Maske hat andere Größe als Produktbild!');
          console.warn(`Maske: ${maskWidth}x${maskHeight}, Produkt: ${productWidth}x${productHeight}`);
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Zeichne Maske auch skaliert und zentriert wie das Produkt
        ctx.drawImage(maskImg, productX, productY, scaledProductWidth, scaledProductHeight);
        maskData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }

      // Übertrage Stoffmuster auf Produkt (Chamäleon-Effekt!)
      const result = ctx.createImageData(productData);

      // Debug: Analysiere Masken-Helligkeitsverteilung
      let minBrightness = 1;
      let maxBrightness = 0;
      let sampleCount = 0;
      if (maskData) {
        for (let i = 0; i < maskData.data.length; i += 4) {
          if (sampleCount++ % 1000 === 0) {
            const r = maskData.data[i];
            const g = maskData.data[i + 1];
            const b = maskData.data[i + 2];
            const brightness = (r + g + b) / 3 / 255;
            minBrightness = Math.min(minBrightness, brightness);
            maxBrightness = Math.max(maxBrightness, brightness);
          }
        }
      }

      console.log('[Chameleon Debug]', {
        hasMask: !!maskData,
        maskUrl: product.maskUrl,
        canvasSize: `${canvas.width}x${canvas.height}`,
        maskBrightnessRange: maskData ? `${minBrightness.toFixed(2)} - ${maxBrightness.toFixed(2)}` : 'N/A'
      });

      for (let i = 0; i < productData.data.length; i += 4) {
        const productR = productData.data[i];
        const productG = productData.data[i + 1];
        const productB = productData.data[i + 2];
        const productA = productData.data[i + 3];

        // Skip transparent pixels
        if (productA < 10) {
          result.data[i] = productR;
          result.data[i + 1] = productG;
          result.data[i + 2] = productB;
          result.data[i + 3] = productA;
          continue;
        }

        // Berechne Helligkeit des Original-Produkt-Pixels
        const brightness = (productR + productG + productB) / 3 / 255;

        // Prüfe ob Pixel eingefärbt werden soll
        let shouldColor = false;

        if (maskData) {
          // MIT MASKE: Erkenne Schwarz für Stoffbereich
          const maskR = maskData.data[i];
          const maskG = maskData.data[i + 1];
          const maskB = maskData.data[i + 2];
          const maskBrightness = (maskR + maskG + maskB) / 3 / 255;

          // Prüfe auf SCHWARZ (RGB ≈ 0,0,0) - Stoffbereich
          shouldColor = maskBrightness < 0.1;
        } else {
          // OHNE MASKE: Nutze Helligkeits-Erkennung (alte Methode)
          shouldColor = brightness < 0.7; // Dunkle Pixel = einfärben
        }

        if (shouldColor) {
          // Nehme Stofffarbe an dieser Position
          const fabricR = fabricData.data[i];
          const fabricG = fabricData.data[i + 1];
          const fabricB = fabricData.data[i + 2];

          // Übertrage mit Produkt-Helligkeit (Chamäleon-Effekt)
          result.data[i] = Math.min(255, fabricR * brightness * 1.4);
          result.data[i + 1] = Math.min(255, fabricG * brightness * 1.4);
          result.data[i + 2] = Math.min(255, fabricB * brightness * 1.4);
          result.data[i + 3] = productA;
        } else {
          // Original behalten
          result.data[i] = productR;
          result.data[i + 1] = productG;
          result.data[i + 2] = productB;
          result.data[i + 3] = productA;
        }
      }

      ctx.putImageData(result, 0, 0);

      // Auto-Crop: Finde die tatsächlichen Grenzen des Bildes (nicht-transparente Pixel)
      // OPTIMIERT: Prüfe nur jeden 4. Pixel für bessere Performance
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;

      // Finde die Bounding Box des sichtbaren Inhalts (mit Sampling für Performance)
      const step = 4; // Prüfe nur jeden 4. Pixel
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const i = (y * canvas.width + x) * 4;
          const alpha = pixels[i + 3];

          // Pixel ist sichtbar (nicht transparent)
          if (alpha > 10) {
            if (x < minX) minX = Math.max(0, x - step);
            if (x > maxX) maxX = Math.min(canvas.width - 1, x + step);
            if (y < minY) minY = Math.max(0, y - step);
            if (y > maxY) maxY = Math.min(canvas.height - 1, y + step);
          }
        }
      }

      // Erstelle ein neues Canvas mit nur dem sichtbaren Inhalt
      const croppedWidth = maxX - minX + 1;
      const croppedHeight = maxY - minY + 1;

      if (croppedWidth > 0 && croppedHeight > 0) {
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = croppedWidth;
        croppedCanvas.height = croppedHeight;
        const croppedCtx = croppedCanvas.getContext('2d')!;

        // Kopiere nur den sichtbaren Bereich
        croppedCtx.putImageData(
          ctx.getImageData(minX, minY, croppedWidth, croppedHeight),
          0,
          0
        );

        setChameleonImageUrl(croppedCanvas.toDataURL());
      } else {
        setChameleonImageUrl(canvas.toDataURL());
      }
    };

    applyFabricToProduct().catch(console.error);
  }, [selectedOuterFabricId, allFabrics, product, imageError]);

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-400 border-t-transparent" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-red-500 text-xl mb-4">{error || 'Produkt nicht gefunden'}</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-primary-500 hover:underline"
        >
          <ArrowLeft className="h-5 w-5" />
          Zurück zum Shop
        </Link>
      </div>
    );
  }

  const inCart = isInCart(product.id || product._id || '');
  const cartQuantity = getItemQuantity(product.id || product._id || '');
  const isAvailable = product.stock > 0;
  const productImageUrl = imageError
    ? 'https://placehold.co/600x600/F2B2B4/ffffff?text=Stoffzauber'
    : getImageUrl(product.imageUrl, product.imageUrlWebp);

  const selectedOuterFabric = selectedOuterFabricId
    ? allFabrics.find(f => f.id === selectedOuterFabricId)
    : null;


  const handleAddToCart = () => {
    if (!isAvailable) {
      toast.error('Produkt ist nicht verfügbar');
      return;
    }

    // Validate size selection if product requires size
    if (product.sizeType && product.sizeType !== 'oneSize' && !selectedSize) {
      toast.error('Bitte wähle eine Größe aus');
      return;
    }

    // Validate head circumference input
    if (product.sizeType === 'headCircumference' && selectedSize) {
      const circumference = parseFloat(selectedSize);
      if (isNaN(circumference) || circumference < 40 || circumference > 70) {
        toast.error('Bitte gib einen gültigen Kopfumfang zwischen 40 und 70 cm ein');
        return;
      }
    }

    // Create cart item with selected fabrics and size
    const cartItem: Product & { selectedOuterFabric?: any; selectedInnerFabric?: any; selectedSize?: string } = {
      ...product,
    };

    if (selectedOuterFabric) {
      cartItem.selectedOuterFabric = {
        fabricId: selectedOuterFabric.id,
        fabricName: selectedOuterFabric.name,
        fabricImageUrl: selectedOuterFabric.imageUrl,
      };
    }

    if (selectedSize) {
      cartItem.selectedSize = selectedSize;
    }

    addItem(cartItem as Product, 1);
    toast.success('Produkt zum Warenkorb hinzugefügt!');
  };

  const getSizeLabel = () => {
    if (!product.sizeType) return null;
    if (product.sizeType === 'headCircumference') return 'Kopfumfang (cm)';
    if (product.sizeType === 'clothing') return 'Größe';
    if (product.sizeType === 'dimensions') return 'Maße (Länge x Breite)';
    return null;
  };

  return (
    <>
      <Helmet>
        <title>{product.name} - Henkes Stoffzauber</title>
        <meta name="description" content={product.description} />
      </Helmet>

      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 mb-8 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Zurück zum Shop
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image with Fabric Preview */}
            <div className="space-y-4">
              <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden aspect-square max-h-[800px]">
                {/* Chamäleon-Bild (mit Stofffarbe) oder Original */}
                <img
                  src={chameleonImageUrl || productImageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />

                {/* Vollbild-Button (nur wenn Stoff ausgewählt) */}
                {selectedOuterFabric && chameleonImageUrl && (
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="absolute top-4 right-4 bg-white/95 hover:bg-white backdrop-blur-sm p-2.5 rounded-lg shadow-lg transition-all hover:scale-105"
                    title="Vollbild anzeigen"
                  >
                    <Maximize2 className="h-5 w-5 text-neutral-700" />
                  </button>
                )}
              </div>

              {/* Versteckte Bilder für Canvas-Verarbeitung */}
              <div className="hidden">
                <img
                  ref={productImgRef}
                  src={productImageUrl}
                  alt="product"
                  crossOrigin="anonymous"
                />
                {selectedOuterFabric && (
                  <img
                    ref={fabricImgRef}
                    src={getImageUrl(selectedOuterFabric.imageUrl, selectedOuterFabric.imageUrlWebp)}
                    alt="fabric"
                    crossOrigin="anonymous"
                  />
                )}
                {product.maskUrl && (
                  <img
                    ref={maskImgRef}
                    src={`${product.maskUrl}?t=${Date.now()}`}
                    alt=""
                    style={{ display: 'none' }}
                    crossOrigin="anonymous"
                  />
                )}
                <canvas ref={canvasRef} />
              </div>

              {/* Selected Fabric Info */}
              {selectedOuterFabric && (
                <div className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={getImageUrl(selectedOuterFabric.imageUrl, selectedOuterFabric.imageUrlWebp)}
                      alt={selectedOuterFabric.name}
                      className="w-16 h-16 object-cover rounded-lg border-2 border-primary-200"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-neutral-500">Gewählter Stoff:</p>
                      <h3 className="font-semibold text-neutral-800">{selectedOuterFabric.name}</h3>
                      <p className="text-xs text-neutral-600">{selectedOuterFabric.fabricType}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-neutral-800 mb-3">
                  {product.name}
                </h1>
                <p className="text-3xl font-bold text-primary-500">
                  {formatCurrency(product.price)}
                </p>
              </div>

              {/* Description */}
              <div className="prose prose-neutral max-w-none">
                <p className="text-neutral-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Seller Info */}
              {product.tailorName && (
                <div className="flex items-center gap-2">
                  <span className="text-neutral-600">
                    Handgefertigt von <span className="font-semibold text-primary-500">{product.tailorName}</span>
                  </span>
                </div>
              )}

              {/* Availability Status */}
              <div className="flex items-center gap-2">
                {isAvailable ? (
                  <>
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-green-600 font-semibold">Verfügbar</span>
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5 text-red-500" />
                    <span className="text-red-600 font-semibold">Nicht verfügbar</span>
                  </>
                )}
              </div>

              {/* Fabric Selection */}
              <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                  <span className="text-2xl">🧵</span>
                  Stoff auswählen
                </h3>
                <p className="text-sm text-neutral-600">
                  Wähle den Stoff für dein Produkt.
                </p>

                {/* Fabric Grid Selection with Thumbnails */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {/* Option for no fabric */}
                  <button
                    type="button"
                    onClick={() => setSelectedOuterFabricId(null)}
                    className={cn(
                      'relative aspect-square rounded-lg border-3 transition-all overflow-hidden',
                      selectedOuterFabricId === null
                        ? 'border-primary-400 ring-2 ring-primary-400 ring-offset-2'
                        : 'border-gray-200 hover:border-primary-300'
                    )}
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <span className="text-3xl">✖️</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 text-center">
                      Original
                    </div>
                  </button>

                  {/* Fabric options with thumbnails */}
                  {allFabrics.map(fabric => (
                    <button
                      type="button"
                      key={fabric.id}
                      onClick={() => setSelectedOuterFabricId(fabric.id)}
                      className={cn(
                        'relative aspect-square rounded-lg border-3 transition-all overflow-hidden',
                        selectedOuterFabricId === fabric.id
                          ? 'border-primary-400 ring-2 ring-primary-400 ring-offset-2'
                          : 'border-gray-200 hover:border-primary-300'
                      )}
                      title={`${fabric.name} - ${fabric.fabricType}`}
                    >
                      <img
                        src={getImageUrl(fabric.thumbnailUrl || fabric.imageUrl, fabric.imageUrlWebp)}
                        alt={fabric.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 text-center line-clamp-2">
                        {fabric.name}
                      </div>
                      {selectedOuterFabricId === fabric.id && (
                        <div className="absolute top-2 right-2 bg-primary-400 text-white rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Hinweis zur Mustervariation */}
                {selectedOuterFabricId && (
                  <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-amber-800 mb-1">
                        Hinweis zur Stoffauswahl
                      </h4>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Bei eigener Stoffauswahl kann das Muster auf dem Produkt leicht variieren.
                        Dies hängt vom gewählten Stoff und dessen Musterung ab. Jedes Stück wird dadurch zu einem einzigartigen Unikat.
                      </p>
                    </div>
                  </div>
                )}
              </div>


              {/* Size Selection */}
              {product.sizeType && product.sizeType !== 'oneSize' && (
                <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                  <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                    <Ruler className="h-5 w-5" />
                    {getSizeLabel()}
                  </h3>

                  {/* Input field for head circumference */}
                  {product.sizeType === 'headCircumference' ? (
                    <div className="space-y-2">
                      <label htmlFor="head-circumference" className="block text-sm font-medium text-neutral-700">
                        Kopfumfang in cm eingeben
                      </label>
                      <input
                        id="head-circumference"
                        type="number"
                        min="40"
                        max="70"
                        step="0.5"
                        value={selectedSize || ''}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        placeholder="z.B. 52"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all text-lg font-semibold"
                      />
                      <p className="text-xs text-neutral-500">
                        Empfohlener Bereich: 40-70 cm
                      </p>
                    </div>
                  ) : (
                    /* Button grid for clothing sizes and dimensions */
                    product.availableSizes && product.availableSizes.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {product.availableSizes.map((size) => (
                          <button
                            type="button"
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={cn(
                              'px-4 py-3 rounded-lg font-semibold transition-all border-2',
                              selectedSize === size
                                ? 'bg-primary-400 text-white border-primary-400'
                                : 'bg-white text-neutral-700 border-gray-300 hover:border-primary-300'
                            )}
                          >
                            {product.sizeType === 'dimensions' ? `${size} cm` : size}
                          </button>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Add to Cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isAvailable}
                className={cn(
                  'w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3',
                  isAvailable
                    ? 'bg-primary-400 text-white hover:bg-primary-500 hover:shadow-lg hover:-translate-y-0.5'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                <ShoppingCart className="h-6 w-6" />
                {inCart ? `Im Warenkorb (${cartQuantity})` : 'In den Warenkorb'}
              </button>

              {/* Product Info */}
              {product.fabrics && (
                <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
                  <p className="text-sm text-neutral-700">
                    <strong>Original-Stoff:</strong> {product.fabrics}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vollbild-Modal */}
      {isFullscreen && chameleonImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-lg transition-all z-10"
            title="Schließen (ESC)"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          <div className="w-full h-full flex flex-col items-center justify-center">
            <img
              src={chameleonImageUrl}
              alt={`${product.name} mit ${selectedOuterFabric?.name || 'eigenem Stoff'}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {selectedOuterFabric && (
              <div className="mt-4 text-center">
                <p className="text-white text-sm">
                  🎨 {product.name} mit {selectedOuterFabric.name}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

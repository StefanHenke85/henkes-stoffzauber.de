import { useEffect, useRef } from 'react';
import { Fabric } from '../types';

interface FabricScalePreviewProps {
  productImageUrl: string | null;
  maskImageUrl: string | null;
  fabricScale: number;
  productScale: number; // NEW: Scale for the product itself
  selectedFabric: Fabric | null;
}

export function FabricScalePreview({
  productImageUrl,
  maskImageUrl,
  fabricScale,
  productScale,
  selectedFabric,
}: FabricScalePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const productImgRef = useRef<HTMLImageElement>(null);
  const fabricImgRef = useRef<HTMLImageElement>(null);
  const maskImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!productImageUrl || !selectedFabric) return;

    const applyFabricToProduct = async () => {
      const canvas = canvasRef.current;
      const productImg = productImgRef.current;
      const fabricImg = fabricImgRef.current;
      const maskImg = maskImgRef.current;

      if (!canvas || !productImg || !fabricImg) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Wait for images to load
      const imagesToLoad = [
        productImg.complete ? Promise.resolve() : new Promise(r => productImg.onload = r),
        fabricImg.complete ? Promise.resolve() : new Promise(r => fabricImg.onload = r)
      ];
      if (maskImg && maskImageUrl) {
        imagesToLoad.push(maskImg.complete ? Promise.resolve() : new Promise(r => maskImg!.onload = r));
      }
      await Promise.all(imagesToLoad);

      // Canvas bleibt bei Original-Produktgröße
      const originalProductWidth = productImg.naturalWidth;
      const originalProductHeight = productImg.naturalHeight;

      canvas.width = originalProductWidth;
      canvas.height = originalProductHeight;

      // Berechne skalierte Produktgröße (kleiner = mehr Platz für Stoff)
      const scaledProductWidth = originalProductWidth * productScale;
      const scaledProductHeight = originalProductHeight * productScale;

      // Zentriere das skalierte Produkt auf dem Canvas
      const productX = (canvas.width - scaledProductWidth) / 2;
      const productY = (canvas.height - scaledProductHeight) / 2;

      // 1. Zeichne Produktbild (skaliert und zentriert)
      ctx.drawImage(productImg, productX, productY, scaledProductWidth, scaledProductHeight);
      const productData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // 2. Zeichne Stoff skaliert (OHNE Kacheln, einmal gestreckt)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Skaliere Stoff basierend auf fabricScale
      const scaledFabricWidth = fabricImg.naturalWidth * fabricScale;
      const scaledFabricHeight = fabricImg.naturalHeight * fabricScale;

      // Zentriere und zeichne Stoff
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

      // 3. Lade Maske (falls vorhanden)
      let maskData: ImageData | null = null;
      if (maskImg && maskImageUrl) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Zeichne Maske auch skaliert und zentriert wie das Produkt
        ctx.drawImage(maskImg, productX, productY, scaledProductWidth, scaledProductHeight);
        maskData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }

      // 4. Wende Chamäleon-Effekt an
      const result = ctx.createImageData(productData);

      for (let i = 0; i < productData.data.length; i += 4) {
        const productR = productData.data[i];
        const productG = productData.data[i + 1];
        const productB = productData.data[i + 2];
        const productA = productData.data[i + 3];

        if (productA < 10) {
          result.data[i] = productR;
          result.data[i + 1] = productG;
          result.data[i + 2] = productB;
          result.data[i + 3] = productA;
          continue;
        }

        const brightness = (productR + productG + productB) / 3 / 255;
        let shouldColor = false;

        if (maskData) {
          const maskBrightness = (maskData.data[i] + maskData.data[i + 1] + maskData.data[i + 2]) / 3 / 255;
          shouldColor = maskBrightness < 0.1;
        } else {
          shouldColor = brightness < 0.5;
        }

        if (shouldColor) {
          const fabricR = fabricData.data[i];
          const fabricG = fabricData.data[i + 1];
          const fabricB = fabricData.data[i + 2];

          result.data[i] = Math.min(255, fabricR * brightness * 1.4);
          result.data[i + 1] = Math.min(255, fabricG * brightness * 1.4);
          result.data[i + 2] = Math.min(255, fabricB * brightness * 1.4);
          result.data[i + 3] = productA;
        } else {
          result.data[i] = productR;
          result.data[i + 1] = productG;
          result.data[i + 2] = productB;
          result.data[i + 3] = productA;
        }
      }

      ctx.putImageData(result, 0, 0);
    };

    applyFabricToProduct().catch(console.error);
  }, [productImageUrl, maskImageUrl, fabricScale, productScale, selectedFabric]);

  if (!productImageUrl || !selectedFabric) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500 text-sm">
          Bitte lade ein Produktbild hoch und wähle einen Stoff für die Vorschau
        </p>
      </div>
    );
  }

  const getImageUrl = (url: string, webpUrl?: string) => {
    const urlToUse = webpUrl || url;
    if (urlToUse.startsWith('blob:')) return urlToUse;
    if (urlToUse.startsWith('http')) return urlToUse;
    // Use relative URL for uploads
    return urlToUse;
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold mb-2">
        Live-Vorschau (Stoffmuster: {Math.round(fabricScale * 100)}% | Produkt: {Math.round(productScale * 100)}%)
      </h4>
      <div className="relative">
        <img
          ref={productImgRef}
          src={getImageUrl(productImageUrl)}
          alt="product"
          style={{ display: 'none' }}
          crossOrigin="anonymous"
        />
        <img
          ref={fabricImgRef}
          src={getImageUrl(selectedFabric.imageUrlWebp || selectedFabric.imageUrl || '')}
          alt="fabric"
          style={{ display: 'none' }}
          crossOrigin="anonymous"
        />
        {maskImageUrl && (
          <img
            ref={maskImgRef}
            src={getImageUrl(maskImageUrl)}
            alt="mask"
            style={{ display: 'none' }}
            crossOrigin="anonymous"
          />
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-auto max-h-[800px] object-contain rounded"
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Bewege den Schieberegler, um die Stoffmuster-Größe anzupassen
      </p>
    </div>
  );
}

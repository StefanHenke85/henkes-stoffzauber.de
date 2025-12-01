import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Info, Loader2, Palette } from 'lucide-react';
import { fabricsApi } from '@/utils/api';
import type { Fabric } from '@/types';

export function Stoffe() {
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null);

  useEffect(() => {
    loadFabrics();
  }, []);

  const loadFabrics = async () => {
    try {
      const data = await fabricsApi.getAll();
      setFabrics(data);
    } catch (error) {
      console.error('Fehler beim Laden der Stoffe:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Stoffe - Henkes Stoffzauber</title>
        <meta
          name="description"
          content="Entdecken Sie unsere Stoffauswahl: Jersey, Baumwolle, Fleece und mehr. Hochwertige Materialien für Ihre Nähprojekte."
        />
      </Helmet>

      <div className="min-h-screen bg-neutral-50">
        {/* Header with Banner Background */}
        <div className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="/api/uploads/1764276141636-banner.jpg"
              alt="Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-secondary-100/90 to-primary-100/90"></div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-neutral-800 mb-4 drop-shadow-sm">
              Unsere Stoffe
            </h1>
            <p className="text-neutral-800 max-w-2xl mx-auto drop-shadow-sm">
              Hochwertige Materialien für Ihre kreativen Nähprojekte. Jeder Stoff
              wird sorgfältig ausgewählt.
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-secondary-50 rounded-xl p-6 flex items-start gap-4">
            <Info className="h-6 w-6 text-secondary-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-semibold text-neutral-800 mb-1">
                Stoffauswahl bei Bestellung
              </h2>
              <p className="text-neutral-600 text-sm">
                Viele unserer Produkte können aus verschiedenen Stoffen gefertigt
                werden. Bei der Bestellung können Sie Ihren Wunschstoff angeben.
                Kontaktieren Sie uns gerne für individuelle Anfragen!
              </p>
            </div>
          </div>
        </div>

        {/* Fabric Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-400" />
              <p className="text-neutral-500 mt-4">Stoffe werden geladen...</p>
            </div>
          ) : fabrics.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <Palette className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Derzeit sind keine Stoffe verfügbar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {fabrics.map((fabric) => (
                <article
                  key={fabric.id}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => setSelectedFabric(fabric)}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
                    {fabric.imageUrl ? (
                      <img
                        src={fabric.imageUrl}
                        alt={fabric.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Palette className="h-16 w-16 text-neutral-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-neutral-800">
                        {fabric.name}
                      </h3>
                      {fabric.isFeatured && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                          Beliebt
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-primary-500 font-medium mb-2">
                      {fabric.fabricType}
                    </p>
                    <p className="text-neutral-600 line-clamp-2">
                      {fabric.description}
                    </p>
                    {(fabric.material || fabric.color || fabric.width) && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {fabric.material && (
                          <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
                            {fabric.material}
                          </span>
                        )}
                        {fabric.color && (
                          <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
                            {fabric.color}
                          </span>
                        )}
                        {fabric.width && (
                          <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
                            {fabric.width} cm breit
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Fabric Detail Modal */}
        {selectedFabric && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedFabric(null)}
          >
            <div
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedFabric.imageUrl && (
                <img
                  src={selectedFabric.imageUrl}
                  alt={selectedFabric.name}
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-800">
                      {selectedFabric.name}
                    </h2>
                    <p className="text-primary-500 font-medium">
                      {selectedFabric.fabricType}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFabric(null)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <p className="text-neutral-600 mb-6">
                  {selectedFabric.description}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {selectedFabric.material && (
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <p className="text-xs text-neutral-500 mb-1">Material</p>
                      <p className="font-medium text-neutral-800">
                        {selectedFabric.material}
                      </p>
                    </div>
                  )}
                  {selectedFabric.color && (
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <p className="text-xs text-neutral-500 mb-1">Farbe</p>
                      <p className="font-medium text-neutral-800">
                        {selectedFabric.color}
                      </p>
                    </div>
                  )}
                  {selectedFabric.pattern && (
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <p className="text-xs text-neutral-500 mb-1">Muster</p>
                      <p className="font-medium text-neutral-800">
                        {selectedFabric.pattern}
                      </p>
                    </div>
                  )}
                  {selectedFabric.width && (
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <p className="text-xs text-neutral-500 mb-1">Breite</p>
                      <p className="font-medium text-neutral-800">
                        {selectedFabric.width} cm
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-primary-400 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Haben Sie einen besonderen Stoffwunsch?
            </h2>
            <p className="text-white/90 mb-6">
              Kontaktieren Sie uns - wir beraten Sie gerne!
            </p>
            <a
              href="mailto:info@henkes-stoffzauber.de"
              className="inline-block bg-white text-primary-500 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Kontakt aufnehmen
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

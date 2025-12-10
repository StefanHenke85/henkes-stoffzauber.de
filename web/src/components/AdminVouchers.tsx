import { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Loader2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { vouchersApi } from '@/utils/api';
import { formatCurrency } from '@/utils/helpers';

interface Voucher {
  id: string;
  code: string;
  value: number;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
  createdAt: string;
}

const VOUCHER_VALUES = [5, 10, 15, 25, 50];

export function AdminVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      const data = await vouchersApi.getAll();
      setVouchers(data);
    } catch (error) {
      toast.error('Fehler beim Laden der Gutscheine');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (value: number) => {
    setCreating(true);
    try {
      const newVoucher = await vouchersApi.create(value);
      toast.success(`Gutschein erstellt: ${newVoucher.code}`);
      await loadVouchers();

      // Auto-copy to clipboard
      await navigator.clipboard.writeText(newVoucher.code);
      setCopiedCode(newVoucher.code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast.error('Fehler beim Erstellen des Gutscheins');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Gutschein "${code}" wirklich löschen?`)) return;

    try {
      await vouchersApi.delete(id);
      toast.success('Gutschein gelöscht');
      setVouchers(vouchers.filter(v => v.id !== id));
    } catch (error) {
      toast.error('Fehler beim Löschen des Gutscheins');
      console.error(error);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      toast.success('Code kopiert!');
    } catch (error) {
      toast.error('Fehler beim Kopieren');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    );
  }

  const unusedVouchers = vouchers.filter(v => !v.isUsed);
  const usedVouchers = vouchers.filter(v => v.isUsed);

  return (
    <div className="space-y-6">
      {/* Create Vouchers */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary-400" />
          Neue Gutscheine erstellen
        </h2>
        <div className="flex flex-wrap gap-3">
          {VOUCHER_VALUES.map(value => (
            <button
              key={value}
              onClick={() => handleCreate(value)}
              disabled={creating}
              className="px-6 py-3 bg-primary-400 text-white rounded-lg font-semibold hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formatCurrency(value)} Gutschein
            </button>
          ))}
        </div>
      </div>

      {/* Unused Vouchers */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-green-600" />
          Verfügbare Gutscheine ({unusedVouchers.length})
        </h2>
        {unusedVouchers.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">
            Keine verfügbaren Gutscheine
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unusedVouchers.map(voucher => (
              <div
                key={voucher.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-400 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCode(voucher.code)}
                      className="font-mono font-bold text-lg text-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1"
                      title="Code kopieren"
                    >
                      {voucher.code}
                      {copiedCode === voucher.code ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(voucher.id, voucher.code)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Gutschein löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-neutral-800">
                    {formatCurrency(voucher.value)}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {new Date(voucher.createdAt).toLocaleDateString('de-DE')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Used Vouchers */}
      {usedVouchers.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-gray-400" />
            Eingelöste Gutscheine ({usedVouchers.length})
          </h2>
          <div className="space-y-2">
            {usedVouchers.map(voucher => (
              <div
                key={voucher.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono font-medium text-gray-600">
                    {voucher.code}
                  </span>
                  <span className="font-bold text-neutral-800">
                    {formatCurrency(voucher.value)}
                  </span>
                </div>
                <div className="text-right text-sm">
                  <p className="text-neutral-600">{voucher.usedBy}</p>
                  <p className="text-neutral-400">
                    {voucher.usedAt && new Date(voucher.usedAt).toLocaleDateString('de-DE', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

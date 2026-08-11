import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Package, Plus, Pencil, Trash2, RefreshCw, Search, X } from 'lucide-react';
import type { Product, ProductInput } from '../../types';
import { useI18n } from '../../i18n';
import { ApiService } from '../../services/api';
import { activeProducts } from '../../constants/products';
import { AppBottomSheetHandle } from '../UI/AppBottomSheetHandle';
import { useAppBottomSheet } from '../../hooks/useAppBottomSheet';

interface ProductFormState {
  id: string;
  name_ru: string;
  name_en: string;
  sort_order: string;
  is_active: boolean;
}

const emptyForm = (): ProductFormState => ({
  id: '',
  name_ru: '',
  name_en: '',
  sort_order: '0',
  is_active: true,
});

const fieldClass =
  'product-catalog-field w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white min-h-[2.75rem]';

interface ProductCatalogPageProps {
  products: Product[];
  onProductsChanged: () => Promise<void>;
}

interface ProductModalShellProps {
  onClose: () => void;
  maxWidthClass?: string;
  children: React.ReactNode;
}

const ProductModalShell: React.FC<ProductModalShellProps> = ({
  onClose,
  maxWidthClass = 'max-w-md',
  children,
}) => {
  const {
    sheetRef,
    sheetStyle,
    isDragging,
    dragEnabled,
    onHandlePointerDown,
  } = useAppBottomSheet(onClose);

  return (
    <div className="modal-backdrop modal-backdrop--sheet">
      <div
        ref={sheetRef}
        style={sheetStyle}
        className={`product-catalog-modal app-modal-sheet modal-panel bg-slate-900 border border-slate-700 rounded-2xl w-full ${maxWidthClass} shadow-2xl text-slate-100 flex flex-col ${isDragging ? 'is-sheet-dragging' : ''}`}
      >
        <AppBottomSheetHandle
          onPointerDown={dragEnabled ? onHandlePointerDown : () => {}}
          isDragging={isDragging}
        />
        {children}
      </div>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  statusBadge: (p: Product) => React.ReactNode;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  locale,
  t,
  onEdit,
  onDelete,
  statusBadge,
}) => (
  <article className="product-catalog-card">
    <div className="product-catalog-card-header">
      <span className="product-catalog-card-id">{product.id}</span>
      {statusBadge(product)}
    </div>
    <div className="product-catalog-card-name">
      {locale === 'ru' ? product.name_ru : product.name_en}
    </div>
    <div className="product-catalog-card-alt">
      {locale === 'ru' ? product.name_en : product.name_ru}
    </div>
    <div className="product-catalog-card-meta">
      <span className="product-catalog-card-order">
        {t('products.colOrder')}: {product.sort_order ?? 0}
      </span>
    </div>
    <div className="product-catalog-card-actions">
      <button
        type="button"
        onClick={() => onEdit(product)}
        className="product-catalog-card-action product-catalog-card-action--edit"
      >
        <Pencil className="w-4 h-4 shrink-0" />
        {t('products.edit')}
      </button>
      <button
        type="button"
        onClick={() => onDelete(product)}
        className="product-catalog-card-action product-catalog-card-action--delete"
      >
        <Trash2 className="w-4 h-4 shrink-0" />
        {t('products.delete')}
      </button>
    </div>
  </article>
);

export const ProductCatalogPage: React.FC<ProductCatalogPageProps> = ({
  products,
  onProductsChanged,
}) => {
  const { t, locale } = useI18n();
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  const displayList = useMemo(() => {
    const base = showInactive ? products : activeProducts(products);
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(p =>
      [p.id, p.name_ru, p.name_en].some(v => v.toLowerCase().includes(q)),
    );
  }, [products, search, showInactive]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setError('');
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      id: p.id,
      name_ru: p.name_ru,
      name_en: p.name_en,
      sort_order: String(p.sort_order ?? 0),
      is_active: p.is_active !== false,
    });
    setError('');
    setModalOpen(true);
  };

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      await onProductsChanged();
    } finally {
      setLoading(false);
    }
  }, [onProductsChanged]);

  useEffect(() => {
    void handleRefresh();
  }, [handleRefresh]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name_ru.trim() || !form.name_en.trim()) {
      setError(t('products.validationRequired'));
      return;
    }
    if (!editing && !form.id.trim()) {
      setError(t('products.validationRequired'));
      return;
    }

    setSaving(true);
    try {
      const sortOrder = Number(form.sort_order) || 0;
      if (editing) {
        await ApiService.updateProduct(editing.id, {
          name_ru: form.name_ru.trim(),
          name_en: form.name_en.trim(),
          sort_order: sortOrder,
          is_active: form.is_active,
        });
      } else {
        const input: ProductInput = {
          id: form.id.trim(),
          name_ru: form.name_ru.trim(),
          name_en: form.name_en.trim(),
          sort_order: sortOrder,
          is_active: form.is_active,
        };
        await ApiService.createProduct(input);
      }
      setModalOpen(false);
      await onProductsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('products.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const { soft } = await ApiService.deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      await onProductsChanged();
      if (soft) {
        setError(t('products.softDeleted'));
        setTimeout(() => setError(''), 4000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('products.deleteFailed'));
    } finally {
      setSaving(false);
    }
  };

  const productLabel = (p: Product) => (locale === 'ru' ? p.name_ru : p.name_en);

  const statusBadge = (p: Product) => (
    <span className={`product-catalog-status-badge text-xs px-2 py-0.5 rounded border ${
      p.is_active !== false
        ? 'product-catalog-status-badge--active bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        : 'product-catalog-status-badge--inactive bg-slate-500/10 text-slate-400 border-slate-500/30'
    }`}>
      {p.is_active !== false ? t('products.active') : t('products.inactive')}
    </span>
  );

  return (
    <div className="product-catalog-page p-4 sm:p-6 space-y-4 sm:space-y-5 bg-slate-950 min-h-full text-slate-100">
      <div className="product-catalog-toolbar shipments-list-toolbar bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="product-catalog-toolbar-head flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400 shrink-0" />
              <span className="truncate">{t('products.title')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">{t('products.subtitle')}</p>
          </div>
          <div className="product-catalog-toolbar-actions flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={loading}
              className="product-catalog-toolbar-btn px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 flex items-center justify-center gap-1.5 min-h-[2.75rem] sm:min-h-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {t('products.refresh')}
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="product-catalog-toolbar-btn px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 flex items-center justify-center gap-1.5 min-h-[2.75rem] sm:min-h-0"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('products.add')}
            </button>
          </div>
        </div>

        <div className="product-catalog-filters-grid">
          <div className="product-catalog-search flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 min-h-[2.75rem] sm:min-h-0">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('products.searchPlaceholder')}
              className="bg-transparent text-sm text-white w-full min-w-0 outline-none placeholder:text-slate-500"
            />
          </div>
          <label className="product-catalog-inactive-toggle flex items-center gap-2 text-xs text-slate-400 px-1 min-h-[2.75rem] sm:min-h-0">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
              className="rounded border-slate-600"
            />
            {t('products.showInactive')}
          </label>
        </div>

        <p className="product-catalog-results text-xs text-slate-500">
          {t('products.results', { count: displayList.length })}
        </p>
      </div>

      {error && !modalOpen && !deleteTarget && (
        <div className="product-catalog-alert text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="product-catalog-table-panel bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="product-catalog-table-desktop overflow-x-auto responsive-table-wrap">
          <table className="w-full text-sm min-w-[28rem] xl:min-w-[36rem]">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase">
              <tr>
                <th className="text-left p-3">{t('products.colId')}</th>
                <th className="text-left p-3">{t('products.colName')}</th>
                <th className="text-left p-3 hidden md:table-cell">{t('products.colNameEn')}</th>
                <th className="text-left p-3 hidden sm:table-cell">{t('products.colOrder')}</th>
                <th className="text-left p-3 hidden sm:table-cell">{t('products.colStatus')}</th>
                <th className="text-right p-3">{t('products.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">{t('products.empty')}</td>
                </tr>
              ) : (
                displayList.map(p => (
                  <tr key={p.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-xs text-slate-400">{p.id}</td>
                    <td className="p-3 text-white">{p.name_ru}</td>
                    <td className="p-3 text-slate-300 hidden md:table-cell">{p.name_en}</td>
                    <td className="p-3 text-slate-400 hidden sm:table-cell">{p.sort_order ?? 0}</td>
                    <td className="p-3 hidden sm:table-cell">{statusBadge(p)}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                          title={t('products.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
                          title={t('products.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="product-catalog-cards-mobile">
        {displayList.length === 0 ? (
          <div className="product-catalog-empty">{t('products.empty')}</div>
        ) : (
          displayList.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              locale={locale}
              t={t}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              statusBadge={statusBadge}
            />
          ))
        )}
      </div>

      {modalOpen && (
        <ProductModalShell onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="product-catalog-form-modal flex flex-col flex-1 min-h-0">
            <header className="modal-panel-header app-modal-sheet-header px-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-white break-words">
                  {editing ? t('products.editTitle') : t('products.addTitle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  aria-label={t('common.close')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>
            <div className="modal-panel-body modal-scrollbar px-4 space-y-3 flex-1 min-h-0 overflow-y-auto">
              {error && <p className="text-sm text-red-400">{error}</p>}
              {!editing && (
                <label className="block space-y-1 text-xs">
                  <span className="text-slate-400">{t('products.colId')}</span>
                  <input
                    required
                    value={form.id}
                    onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                    placeholder="scraps"
                    className={`${fieldClass} font-mono`}
                  />
                  <span className="text-slate-500">{t('products.idHint')}</span>
                </label>
              )}
              <label className="block space-y-1 text-xs">
                <span className="text-slate-400">{t('products.nameRu')}</span>
                <input required value={form.name_ru} onChange={e => setForm(f => ({ ...f, name_ru: e.target.value }))} className={fieldClass} />
              </label>
              <label className="block space-y-1 text-xs">
                <span className="text-slate-400">{t('products.nameEn')}</span>
                <input required value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} className={fieldClass} />
              </label>
              <label className="block space-y-1 text-xs">
                <span className="text-slate-400">{t('products.colOrder')}</span>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                  className={fieldClass}
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 min-h-[2.75rem] sm:min-h-0">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="rounded border-slate-600"
                />
                {t('products.active')}
              </label>
            </div>
            <footer className="product-catalog-form-modal-footer modal-panel-footer px-4 pt-2 pb-4 flex justify-end gap-2 border-t border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-2 text-xs text-slate-400 min-h-[2.75rem] sm:min-h-0">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold disabled:opacity-50 min-h-[2.75rem] sm:min-h-0">
                {saving ? t('admin.users.saving') : t('admin.users.save')}
              </button>
            </footer>
          </form>
        </ProductModalShell>
      )}

      {deleteTarget && (
        <ProductModalShell onClose={() => setDeleteTarget(null)} maxWidthClass="max-w-sm">
          <header className="modal-panel-header app-modal-sheet-header px-4 pb-3">
            <h3 className="font-bold text-white">{t('products.deleteTitle')}</h3>
          </header>
          <div className="modal-panel-body px-4 pb-2 space-y-2">
            <p className="text-sm text-slate-400">
              {t('products.deleteConfirm', { name: productLabel(deleteTarget) })}
            </p>
            <p className="text-xs text-slate-500">{t('products.deleteHint')}</p>
          </div>
          <footer className="product-catalog-form-modal-footer modal-panel-footer px-4 pt-2 pb-4 flex justify-end gap-2 border-t border-slate-800">
            <button type="button" onClick={() => setDeleteTarget(null)} className="px-3 py-2 text-xs text-slate-400 min-h-[2.75rem] sm:min-h-0">
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={saving}
              className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-50 min-h-[2.75rem] sm:min-h-0"
            >
              {t('products.delete')}
            </button>
          </footer>
        </ProductModalShell>
      )}
    </div>
  );
};

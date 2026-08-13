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
        className={`product-catalog-modal app-modal-sheet modal-panel ${maxWidthClass} ${isDragging ? 'is-sheet-dragging' : ''}`}
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

interface ProductActionsProps {
  product: Product;
  t: (key: string, params?: Record<string, string | number>) => string;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  variant: 'table' | 'card';
}

const ProductActions: React.FC<ProductActionsProps> = ({
  product,
  t,
  onEdit,
  onDelete,
  variant,
}) => {
  if (variant === 'card') {
    return (
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
    );
  }

  return (
    <div className="product-catalog-row-actions">
      <button
        type="button"
        onClick={() => onEdit(product)}
        className="product-catalog-row-icon-btn product-catalog-row-icon-btn--edit"
        title={t('products.edit')}
        aria-label={t('products.edit')}
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(product)}
        className="product-catalog-row-icon-btn product-catalog-row-icon-btn--delete"
        title={t('products.delete')}
        aria-label={t('products.delete')}
      >
        <Trash2 className="w-4 h-4" />
      </button>
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
    <ProductActions
      product={product}
      t={t}
      onEdit={onEdit}
      onDelete={onDelete}
      variant="card"
    />
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
    <span className={`product-catalog-status-badge ${
      p.is_active !== false
        ? 'product-catalog-status-badge--active'
        : 'product-catalog-status-badge--inactive'
    }`}>
      {p.is_active !== false ? t('products.active') : t('products.inactive')}
    </span>
  );

  const cardProps = {
    locale,
    t,
    onEdit: openEdit,
    onDelete: setDeleteTarget,
    statusBadge,
  };

  return (
    <div className="product-catalog-page">
      <div className="product-catalog-toolbar shipments-list-toolbar">
        <div className="product-catalog-toolbar-top">
          <div className="shipments-list-toolbar-head">
            <span className="shipments-list-toolbar-icon" aria-hidden>
              <Package />
            </span>
            <div className="shipments-list-toolbar-text">
              <h2 className="shipments-list-title">
                <span className="truncate">{t('products.title')}</span>
              </h2>
              <p className="shipments-list-subtitle">{t('products.subtitle')}</p>
            </div>
          </div>
          <div className="product-catalog-toolbar-actions">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={loading}
              className="product-catalog-toolbar-btn product-catalog-toolbar-btn--refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {t('products.refresh')}
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="product-catalog-toolbar-btn product-catalog-toolbar-btn--add"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('products.add')}
            </button>
          </div>
        </div>

        <div className="product-catalog-filters-grid shipments-list-filters-grid">
          <div className="product-catalog-search shipments-list-search">
            <Search aria-hidden />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('products.searchPlaceholder')}
            />
          </div>
          <label className="product-catalog-inactive-toggle">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
            />
            {t('products.showInactive')}
          </label>
        </div>
      </div>

      {error && !modalOpen && !deleteTarget && (
        <div className="product-catalog-alert">{error}</div>
      )}

      <div className="product-catalog-results-bar">
        {t('products.results', { count: displayList.length })}
      </div>

      <div className="product-catalog-table-panel">
        <div className="product-catalog-table-head-bar">
          {t('products.results', { count: displayList.length })}
        </div>
        <div className="product-catalog-table-desktop responsive-table-wrap theme-scrollbar">
          <table className="product-catalog-table">
            <thead>
              <tr>
                <th>{t('products.colId')}</th>
                <th>{t('products.colName')}</th>
                <th className="product-catalog-col-name-en">{t('products.colNameEn')}</th>
                <th className="product-catalog-col-order">{t('products.colOrder')}</th>
                <th className="product-catalog-col-status">{t('products.colStatus')}</th>
                <th className="product-catalog-col-actions">{t('products.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="product-catalog-table-empty">{t('products.empty')}</td>
                </tr>
              ) : (
                displayList.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span className="product-catalog-cell-id">{p.id}</span>
                    </td>
                    <td>
                      <div className="product-catalog-cell-name">{p.name_ru}</div>
                    </td>
                    <td className="product-catalog-col-name-en">
                      <div className="product-catalog-cell-name-en">{p.name_en}</div>
                    </td>
                    <td className="product-catalog-col-order product-catalog-cell-order">
                      {p.sort_order ?? 0}
                    </td>
                    <td className="product-catalog-col-status">{statusBadge(p)}</td>
                    <td className="product-catalog-col-actions">
                      <ProductActions
                        product={p}
                        t={t}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                        variant="table"
                      />
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
            <ProductCard key={p.id} product={p} {...cardProps} />
          ))
        )}
      </div>

      {modalOpen && (
        <ProductModalShell onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="product-catalog-form-modal flex flex-col flex-1 min-h-0">
            <header className="modal-panel-header app-modal-sheet-header">
              <div className="product-catalog-modal-head">
                <h3 className="product-catalog-modal-title">
                  {editing ? t('products.editTitle') : t('products.addTitle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="product-catalog-modal-close-btn"
                  aria-label={t('common.close')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>
            <div className="modal-panel-body modal-scrollbar flex-1 min-h-0 overflow-y-auto">
              {error && <p className="product-catalog-form-error">{error}</p>}
              {!editing && (
                <label className="product-catalog-form-field">
                  <span className="product-catalog-form-label">{t('products.colId')}</span>
                  <input
                    required
                    value={form.id}
                    onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                    placeholder="scraps"
                    className="product-catalog-field product-catalog-field--mono"
                  />
                  <span className="product-catalog-form-hint">{t('products.idHint')}</span>
                </label>
              )}
              <label className="product-catalog-form-field">
                <span className="product-catalog-form-label">{t('products.nameRu')}</span>
                <input required value={form.name_ru} onChange={e => setForm(f => ({ ...f, name_ru: e.target.value }))} className="product-catalog-field" />
              </label>
              <label className="product-catalog-form-field">
                <span className="product-catalog-form-label">{t('products.nameEn')}</span>
                <input required value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} className="product-catalog-field" />
              </label>
              <label className="product-catalog-form-field">
                <span className="product-catalog-form-label">{t('products.colOrder')}</span>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                  className="product-catalog-field"
                />
              </label>
              <label className="product-catalog-form-checkbox">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                />
                {t('products.active')}
              </label>
            </div>
            <footer className="product-catalog-form-modal-footer modal-panel-footer">
              <button type="button" onClick={() => setModalOpen(false)} className="product-catalog-form-cancel">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={saving} className="product-catalog-form-submit">
                {saving ? t('admin.users.saving') : t('admin.users.save')}
              </button>
            </footer>
          </form>
        </ProductModalShell>
      )}

      {deleteTarget && (
        <ProductModalShell onClose={() => setDeleteTarget(null)} maxWidthClass="max-w-sm">
          <header className="modal-panel-header app-modal-sheet-header">
            <h3 className="product-catalog-modal-title">{t('products.deleteTitle')}</h3>
          </header>
          <div className="modal-panel-body">
            <p className="product-catalog-modal-text">
              {t('products.deleteConfirm', { name: productLabel(deleteTarget) })}
            </p>
            <p className="product-catalog-modal-hint">{t('products.deleteHint')}</p>
          </div>
          <footer className="product-catalog-form-modal-footer modal-panel-footer">
            <button type="button" onClick={() => setDeleteTarget(null)} className="product-catalog-form-cancel">
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={saving}
              className="product-catalog-form-delete"
            >
              {t('products.delete')}
            </button>
          </footer>
        </ProductModalShell>
      )}
    </div>
  );
};

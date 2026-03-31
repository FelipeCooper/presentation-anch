import { useState, useEffect, useRef, useCallback } from 'react';
import { CoinSearch } from './CoinSearch';
import {
  useCreateHolding,
  useUpdateHolding,
} from '../hooks/useHoldings';
import type { Holding, Coin } from '../types';
import { ApiError } from '../api/client';

interface HoldingFormProps {
  holding?: Holding;
  onClose: () => void;
}

interface FormErrors {
  coin?: string;
  quantity?: string;
  avgPurchasePrice?: string;
  submit?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function HoldingForm({ holding, onClose }: HoldingFormProps) {
  const isEditing = !!holding;
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(
    holding
      ? {
          coingeckoId: holding.coingeckoId,
          symbol: holding.symbol,
          name: holding.name,
        }
      : null,
  );
  const [quantity, setQuantity] = useState(
    holding ? String(holding.quantity) : '',
  );
  const [avgPurchasePrice, setAvgPurchasePrice] = useState(
    holding ? String(holding.avgPurchasePrice) : '',
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const createMutation = useCreateHolding();
  const updateMutation = useUpdateHolding();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onClose]);

  useEffect(() => {
    previousActiveElement.current = document.activeElement;
    document.addEventListener('keydown', handleKeyDown);

    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusable && focusable.length > 0) {
      focusable[0].focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [handleKeyDown]);

  function validate(): FormErrors {
    const newErrors: FormErrors = {};

    if (!isEditing && !selectedCoin) {
      newErrors.coin = 'Please select a coin';
    }

    const qty = parseFloat(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    }

    const price = parseFloat(avgPurchasePrice);
    if (!avgPurchasePrice || isNaN(price) || price <= 0) {
      newErrors.avgPurchasePrice = 'Price must be a positive number';
    }

    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const qty = parseFloat(quantity);
    const price = parseFloat(avgPurchasePrice);

    try {
      if (isEditing && holding) {
        await updateMutation.mutateAsync({
          id: holding.id,
          data: { quantity: qty, avgPurchasePrice: price },
        });
      } else if (selectedCoin) {
        await createMutation.mutateAsync({
          coingeckoId: selectedCoin.coingeckoId,
          symbol: selectedCoin.symbol,
          name: selectedCoin.name,
          quantity: qty,
          avgPurchasePrice: price,
        });
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ submit: 'A holding for this coin already exists' });
      } else if (err instanceof ApiError) {
        setErrors({ submit: err.message });
      } else {
        setErrors({ submit: 'An unexpected error occurred' });
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Edit holding' : 'Add holding'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={modalRef} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl mx-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Holding' : 'Add Holding'}
        </h2>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          {!isEditing ? (
            <div>
              <CoinSearch onSelect={setSelectedCoin} />
              {selectedCoin && (
                <p className="mt-1 text-sm text-green-600">
                  Selected: {selectedCoin.name} (
                  {selectedCoin.symbol.toUpperCase()})
                </p>
              )}
              {errors.coin && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.coin}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Asset
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {holding.name} ({holding.symbol.toUpperCase()})
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-gray-700"
            >
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              step="any"
              min="0"
              required
              aria-required="true"
              aria-describedby={errors.quantity ? 'quantity-error' : undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {errors.quantity && (
              <p id="quantity-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.quantity}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="avg-purchase-price"
              className="block text-sm font-medium text-gray-700"
            >
              Average Purchase Price (USD)
            </label>
            <input
              id="avg-purchase-price"
              type="number"
              step="any"
              min="0"
              required
              aria-required="true"
              aria-describedby={errors.avgPurchasePrice ? 'avg-purchase-price-error' : undefined}
              value={avgPurchasePrice}
              onChange={(e) => setAvgPurchasePrice(e.target.value)}
              placeholder="0.00"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {errors.avgPurchasePrice && (
              <p id="avg-purchase-price-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.avgPurchasePrice}
              </p>
            )}
          </div>

          {errors.submit && (
            <p className="text-sm text-red-600" role="alert">
              {errors.submit}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving...'
                : isEditing
                  ? 'Update'
                  : 'Add Holding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

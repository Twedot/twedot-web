"use client";

import { useState, useEffect, useCallback } from "react";
import { IoClose, IoRemove, IoAdd, IoCartOutline } from "react-icons/io5";
import { apiGet, apiPost } from "../lib/api";

interface ProductVariant { id: string; name: string; sortOrder: number; }
interface ProductSku { id: string; variantValues: Record<string, string>; label: string | null; price: number; stock: number; reservedStock: number; availableStock: number; isActive: boolean; }
interface ProductImage { id: string; imageUrl: string; thumbnailUrl?: string; sortOrder: number; }
interface Seller { id: string; name: string; photo: string | null; occupation: string | null; }
interface ProductDetail {
  id: string; sellerId: string; name: string; description: string | null; price: number;
  quantity: number; availableQuantity: number; condition: string; category: string;
  hasVariants: boolean; images: ProductImage[]; variants: ProductVariant[];
  skus: ProductSku[]; seller: Seller | null; createdAt: string;
}

interface Props {
  visible: boolean;
  productId: string;
  sellerId: string;
  onClose: () => void;
}

export default function ProductBuyModal({ visible, productId, sellerId, onClose }: Props) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [selectedSku, setSelectedSku] = useState<ProductSku | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [variantSelections, setVariantSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setSelectedSku(null);
    setQuantity(1);
    setImageIndex(0);
    setVariantSelections({});

    apiGet<ProductDetail>(`/commerce/products/${productId}`)
      .then(data => { setProduct(data); setLoading(false); })
      .catch(() => { setProduct(null); setLoading(false); });
  }, [visible, productId]);

  useEffect(() => {
    if (!product?.hasVariants || !product.variants.length) { setSelectedSku(null); return; }
    const allSelected = product.variants.every(v => variantSelections[v.id]);
    if (!allSelected) { setSelectedSku(null); return; }
    const match = product.skus.find(s =>
      product.variants.every(v => s.variantValues[v.id] === variantSelections[v.id])
    );
    setSelectedSku(match ?? null);
    setQuantity(1);
  }, [variantSelections, product]);

  const unitPrice = selectedSku ? selectedSku.price : (product?.price ?? 0);
  const totalPrice = unitPrice * quantity;
  const maxQty = selectedSku ? selectedSku.availableStock : (product?.availableQuantity ?? 0);
  const inStock = maxQty > 0;
  const canBuy = product && inStock && quantity > 0 && quantity <= maxQty &&
    (!product.hasVariants || selectedSku !== null);

  const getValuesForVariant = (variantId: string): string[] => {
    if (!product) return [];
    const values = new Set<string>();
    for (const sku of product.skus) {
      if (sku.variantValues[variantId]) values.add(sku.variantValues[variantId]);
    }
    return Array.from(values);
  };

  const isValueAvailable = (variantId: string, value: string): boolean => {
    if (!product) return false;
    return product.skus.some(s => {
      if (s.variantValues[variantId] !== value) return false;
      if (s.availableStock <= 0) return false;
      return product.variants.every(v => {
        if (v.id === variantId) return true;
        const sel = variantSelections[v.id];
        return !sel || s.variantValues[v.id] === sel;
      });
    });
  };

  const handleBuy = useCallback(async () => {
    if (!canBuy || !product) return;
    setBuying(true);
    try {
      const body: Record<string, unknown> = { productId, sellerId, quantity };
      if (selectedSku) body.skuId = selectedSku.id;
      const data = await apiPost<{ authorizationUrl: string; reference: string; orderId: string }>("/commerce/orders/initiate", body);
      if (!data?.authorizationUrl) {
        alert("Could not initiate payment");
        setBuying(false);
        return;
      }
      window.location.href = data.authorizationUrl;
    } catch {
      alert("Could not initiate payment. Please try again.");
    }
    setBuying(false);
  }, [canBuy, product, productId, sellerId, selectedSku, quantity, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full sm:w-[480px] sm:max-w-[90vw] h-[80vh] bg-background rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden border border-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-text">Product Details</h2>
          <button onClick={onClose} className="text-light-text hover:text-text transition-colors">
            <IoClose size={22} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !product ? (
          <div className="flex-1 flex items-center justify-center text-light-text text-sm">
            Product not found
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {/* Images */}
              {product.images.length > 0 ? (
                <div className="relative">
                  <img
                    src={product.images[imageIndex]?.imageUrl}
                    alt={product.name}
                    className="w-full aspect-[4/3] object-cover"
                  />
                  {product.images.length > 1 && (
                    <div className="flex gap-1.5 justify-center py-2">
                      {product.images.map((img, i) => (
                        <button
                          key={img.id}
                          className={`w-10 h-10 rounded-md overflow-hidden border-2 transition-colors ${i === imageIndex ? "border-primary" : "border-transparent opacity-60"}`}
                          onClick={() => setImageIndex(i)}
                        >
                          <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full aspect-[4/3] bg-feed-bg flex items-center justify-center">
                  <IoCartOutline size={48} className="text-light-text" />
                </div>
              )}

              <div className="px-4 pt-4 pb-24">
                {/* Title */}
                <h3 className="text-lg font-bold text-text">{product.name}</h3>

                {/* Price */}
                <p className="text-2xl font-extrabold text-primary mt-1">
                  ₦{unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>

                {/* Stock */}
                <p className={`text-xs font-semibold mt-1 ${inStock ? "text-green-500" : "text-red-500"}`}>
                  {inStock ? `${selectedSku ? selectedSku.availableStock : product.availableQuantity} in stock` : "Out of stock"}
                </p>

                {/* Tags */}
                <div className="flex gap-2 mt-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-feed-bg text-light-text">
                    {product.condition === "new" ? "New" : "Used"}
                  </span>
                  {product.category !== "other" && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-feed-bg text-light-text">
                      {product.category}
                    </span>
                  )}
                </div>

                {/* Variant pickers */}
                {product.hasVariants && product.variants.map(variant => (
                  <div key={variant.id} className="mt-5">
                    <p className="text-xs font-bold text-text uppercase tracking-wide mb-2">{variant.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {getValuesForVariant(variant.id).map(value => {
                        const selected = variantSelections[variant.id] === value;
                        const available = isValueAvailable(variant.id, value);
                        return (
                          <button
                            key={value}
                            className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all
                              ${selected ? "border-primary bg-primary text-white" : available ? "border-border text-text hover:border-primary/50" : "border-border/50 text-light-text/40 cursor-not-allowed"}`}
                            onClick={() => available && setVariantSelections(prev => ({ ...prev, [variant.id]: value }))}
                            disabled={!available}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Quantity */}
                {inStock && (!product.hasVariants || selectedSku) && (
                  <div className="mt-5">
                    <p className="text-xs font-bold text-text uppercase tracking-wide mb-2">Quantity</p>
                    <div className="flex items-center gap-4">
                      <button
                        className="w-9 h-9 rounded-full bg-feed-bg flex items-center justify-center text-text disabled:opacity-30"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                      >
                        <IoRemove size={18} />
                      </button>
                      <span className="text-lg font-bold text-text min-w-[32px] text-center">{quantity}</span>
                      <button
                        className="w-9 h-9 rounded-full bg-feed-bg flex items-center justify-center text-text disabled:opacity-30"
                        onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                        disabled={quantity >= maxQty}
                      >
                        <IoAdd size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <div className="mt-6">
                    <p className="text-sm font-bold text-text mb-2">Product Details</p>
                    <p className="text-sm text-light-text leading-relaxed whitespace-pre-wrap">{product.description}</p>
                  </div>
                )}

                {/* Seller */}
                {product.seller && (
                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
                    {product.seller.photo ? (
                      <img src={product.seller.photo} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-feed-bg flex items-center justify-center text-light-text text-sm">?</div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-text">{product.seller.name}</p>
                      {product.seller.occupation && <p className="text-xs text-light-text">{product.seller.occupation}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 border-t border-border bg-background">
              <div>
                <p className="text-xs text-light-text">Total</p>
                <p className="text-xl font-extrabold text-primary">
                  ₦{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <button
                className="px-8 py-3 rounded-xl bg-primary text-white font-bold text-base disabled:opacity-40 hover:opacity-90 transition-opacity"
                onClick={handleBuy}
                disabled={!canBuy || buying}
              >
                {buying ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Pay Now"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

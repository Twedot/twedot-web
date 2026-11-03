"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoArrowBack,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoStorefrontOutline,
  IoBagHandleOutline,
  IoImageOutline,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { apiGet, apiPost, apiPatch } from "@/lib/api";

type OrderTab = "buying" | "selling";

interface OrderProduct {
  id: string;
  name: string;
  image: string | null;
}

interface Order {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  price: number;
  status: string;
  escrow_status: string;
  escrow_release_at: string | null;
  created_at: string;
  product: OrderProduct | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Awaiting Payment",
  paid: "Paid",
  escrow_held: "In Escrow",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  disputed: "Disputed",
};

const STATUS_COLOR: Record<string, string> = {
  pending_payment: "text-white/50",
  paid: "text-blue-400",
  escrow_held: "text-yellow-400",
  confirmed: "text-green-400",
  shipped: "text-blue-400",
  delivered: "text-green-400",
  cancelled: "text-red-400",
  refunded: "text-orange-400",
  disputed: "text-red-400",
};

export default function OrdersPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<OrderTab>("buying");
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const fetchOrders = async () => {
    const [buy, sell] = await Promise.all([
      apiGet<Order[]>("/commerce/orders/mine").catch(() => [] as Order[]),
      apiGet<Order[]>("/commerce/orders/sales").catch(() => [] as Order[]),
    ]);
    setBuyOrders(buy ?? []);
    setSellOrders(sell ?? []);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOrders().finally(() => setLoading(false));
  }, [isAuthenticated]);

  const doAction = async (key: string, fn: () => Promise<unknown>) => {
    setActionLoading(key);
    try { await fn(); } catch {}
    await fetchOrders();
    setActionLoading(null);
  };

  const submitDispute = async () => {
    if (!disputeOrderId) return;
    const id = disputeOrderId;
    const reason = disputeReason;
    setDisputeOrderId(null);
    setDisputeReason("");
    await doAction(id + ":dispute", () =>
      apiPost(`/commerce/orders/${id}/dispute`, { reason })
    );
  };

  if (!isAuthenticated) return null;

  const orders = tab === "buying" ? buyOrders : sellOrders;

  return (
    <>
      {/* Dispute modal */}
      {disputeOrderId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1A1A24] p-5 space-y-4">
            <h3 className="text-[15px] font-bold text-text">Raise a Dispute</h3>
            <p className="text-[12px] text-light-text leading-[18px]">
              Describe the issue with your order. An admin will review and may issue a refund.
            </p>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="What went wrong? (e.g. item not received, wrong item, damaged)"
              className="w-full min-h-[90px] rounded-xl bg-[#0E0E16] border border-white/10 px-3 py-2.5 text-[12px] text-text placeholder:text-white/30 resize-none outline-none focus:border-primary/40"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setDisputeOrderId(null); setDisputeReason(""); }}
                className="flex-1 rounded-xl py-2.5 text-[12px] font-semibold text-light-text bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!disputeReason.trim()}
                onClick={submitDispute}
                className="flex-1 rounded-xl py-2.5 text-[12px] font-semibold text-white bg-red-500/70 hover:bg-red-500 disabled:opacity-40 transition-colors"
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:h-[calc(100vh-3.5rem)] sm:overflow-hidden">
        {/* Mobile header */}
        <div className="sm:hidden flex items-center gap-3 border-b border-border px-4 py-3">
          <button onClick={() => router.push("/wallet")} className="text-light-text hover:text-text">
            <IoArrowBack size={20} />
          </button>
          <h1 className="text-[15px] font-bold text-text">Orders</h1>
          <div className="ml-auto flex gap-1">
            {(["buying", "selling"] as OrderTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-colors ${tab === t ? "bg-primary/15 text-primary" : "text-light-text hover:bg-feed-bg"}`}
              >
                {t === "buying" ? "Buying" : "Selling"}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden sm:flex w-[330px] flex-shrink-0 flex-col border-r border-border">
          <div className="border-b border-border px-5 py-4 flex items-center gap-3">
            <button onClick={() => router.push("/wallet")} className="text-light-text hover:text-text">
              <IoArrowBack size={18} />
            </button>
            <h1 className="text-[18px] font-bold text-text">Orders</h1>
          </div>
          <div className="px-4 pt-3 flex flex-col gap-0.5">
            <button
              onClick={() => setTab("buying")}
              className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-semibold transition-colors ${tab === "buying" ? "bg-feed-bg text-primary" : "text-light-text hover:bg-feed-bg/60"}`}
            >
              <IoBagHandleOutline size={16} /> My Purchases
            </button>
            <button
              onClick={() => setTab("selling")}
              className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-semibold transition-colors ${tab === "selling" ? "bg-feed-bg text-primary" : "text-light-text hover:bg-feed-bg/60"}`}
            >
              <IoStorefrontOutline size={16} /> My Sales
            </button>
          </div>
        </div>

        {/* Content panel */}
        <div className="flex flex-1 flex-col sm:overflow-hidden">
          <div className="hidden sm:block border-b border-border px-5 py-4">
            <h2 className="text-[13px] font-bold text-text">
              {tab === "buying" ? "My Purchases" : "My Sales"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-[14px] bg-feed-bg p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-xl bg-white/10 flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3.5 w-36 rounded bg-white/10" />
                      <div className="h-3 w-20 rounded bg-white/10" />
                      <div className="h-3 w-14 rounded bg-white/10" />
                    </div>
                  </div>
                </div>
              ))
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                {tab === "buying"
                  ? <IoBagHandleOutline size={36} className="text-white/20" />
                  : <IoStorefrontOutline size={36} className="text-white/20" />}
                <p className="text-[13px] text-light-text">
                  {tab === "buying"
                    ? "You haven't made any purchases yet."
                    : "You haven't made any sales yet."}
                </p>
              </div>
            ) : (
              orders.map((order) => {
                const isActing = actionLoading?.startsWith(order.id);
                const canMarkShipped = tab === "selling" && order.status === "escrow_held";
                const canMarkDelivered = tab === "selling" && order.status === "shipped";
                const canConfirm = tab === "buying" && order.escrow_status === "held";
                const canDispute = tab === "buying" && order.escrow_status === "held" && order.status !== "disputed";
                const releaseDate = order.escrow_release_at
                  ? new Date(order.escrow_release_at).toLocaleDateString()
                  : null;

                return (
                  <div key={order.id} className="rounded-[14px] bg-feed-bg p-4 space-y-3">
                    <div className="flex gap-3 items-start">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-xl bg-[#0E0E16] flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {order.product?.image?.startsWith("http") ? (
                          <>
                            <img
                              src={order.product.image}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const el = e.target as HTMLImageElement;
                                el.style.display = "none";
                                const fb = el.nextElementSibling as HTMLElement | null;
                                if (fb) fb.style.display = "flex";
                              }}
                            />
                            <div style={{ display: "none" }} className="w-full h-full items-center justify-center">
                              <IoImageOutline size={22} className="text-white/20" />
                            </div>
                          </>
                        ) : (
                          <IoImageOutline size={22} className="text-white/20" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-text truncate">
                          {order.product?.name ?? "Product"}
                        </p>
                        <p className="text-[12px] font-bold text-text mt-0.5">
                          ₦{Number(order.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-light-text mt-0.5">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <span className={`text-[11px] font-bold flex-shrink-0 mt-0.5 ${STATUS_COLOR[order.status] ?? "text-white/50"}`}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>

                    {/* Escrow auto-release note */}
                    {order.escrow_status === "held" && releaseDate && (
                      <p className="text-[10px] text-white/30 border-t border-white/5 pt-2">
                        Escrow auto-releases {releaseDate} if no action is taken
                      </p>
                    )}

                    {/* Action buttons */}
                    {(canMarkShipped || canMarkDelivered || canConfirm || canDispute) && (
                      <div className="flex gap-2 pt-0.5">
                        {canMarkShipped && (
                          <button
                            disabled={!!isActing}
                            onClick={() => doAction(order.id + ":shipped", () =>
                              apiPatch(`/commerce/orders/${order.id}/status`, { status: "shipped" })
                            )}
                            className="flex-1 rounded-xl py-2 text-[11px] font-bold text-white bg-blue-600/60 hover:bg-blue-600/80 disabled:opacity-40 transition-colors"
                          >
                            {actionLoading === order.id + ":shipped" ? "Updating..." : "Mark as Shipped"}
                          </button>
                        )}
                        {canMarkDelivered && (
                          <button
                            disabled={!!isActing}
                            onClick={() => doAction(order.id + ":delivered", () =>
                              apiPatch(`/commerce/orders/${order.id}/status`, { status: "delivered" })
                            )}
                            className="flex-1 rounded-xl py-2 text-[11px] font-bold text-white bg-green-600/60 hover:bg-green-600/80 disabled:opacity-40 transition-colors"
                          >
                            {actionLoading === order.id + ":delivered" ? "Updating..." : "Mark as Delivered"}
                          </button>
                        )}
                        {canConfirm && (
                          <button
                            disabled={!!isActing}
                            onClick={() => doAction(order.id + ":confirm", () =>
                              apiPost(`/commerce/orders/${order.id}/confirm-delivery`, {})
                            )}
                            className="flex-1 rounded-xl py-2 text-[11px] font-bold text-white bg-green-600/60 hover:bg-green-600/80 disabled:opacity-40 transition-colors flex items-center justify-center gap-1"
                          >
                            <IoCheckmarkCircleOutline size={14} />
                            {actionLoading === order.id + ":confirm" ? "Confirming..." : "Confirm Delivery"}
                          </button>
                        )}
                        {canDispute && (
                          <button
                            disabled={!!isActing}
                            onClick={() => setDisputeOrderId(order.id)}
                            className="flex-1 rounded-xl py-2 text-[11px] font-bold text-white bg-red-500/30 hover:bg-red-500/50 disabled:opacity-40 transition-colors flex items-center justify-center gap-1"
                          >
                            <IoAlertCircleOutline size={14} />
                            Dispute
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

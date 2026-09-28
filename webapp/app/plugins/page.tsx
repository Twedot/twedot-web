"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IoCartOutline,
  IoBriefcaseOutline,
  IoHardwareChipOutline,
  IoCheckmarkCircle,
  IoClose,
  IoTrashOutline,
  IoCreateOutline,
  IoChevronBack,
} from "react-icons/io5";
import { useAuth } from "@/lib/AuthContext";
import { useUi } from "@/lib/UiContext";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

type PluginType = "ecommerce" | "service" | "ai_agent";

interface PluginTypeDef {
  type: PluginType;
  label: string;
  description: string;
  icon: string;
}

interface Plugin {
  id: string;
  user_id: string;
  type: PluginType;
  name: string;
  description: string | null;
  config: Record<string, string> | null;
  is_active: boolean;
  created_at: string;
}

const TYPE_META: Record<PluginType, { icon: React.ElementType; color: string; bg: string }> = {
  ecommerce: { icon: IoCartOutline, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  service: { icon: IoBriefcaseOutline, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
  ai_agent: { icon: IoHardwareChipOutline, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
};

const CONFIG_FIELDS: Record<PluginType, { key: string; label: string; placeholder: string }[]> = {
  ecommerce: [
    { key: "store_url", label: "Store URL", placeholder: "https://mystore.com" },
    { key: "store_name", label: "Store Name", placeholder: "My Online Store" },
    { key: "api_key", label: "API Key (optional)", placeholder: "sk_live_..." },
  ],
  service: [
    { key: "service_url", label: "Service Page URL", placeholder: "https://myservices.com" },
    { key: "contact_url", label: "Booking/Contact URL", placeholder: "https://cal.com/..." },
    { key: "categories", label: "Service Categories", placeholder: "e.g. Cleaning, Plumbing" },
  ],
  ai_agent: [
    { key: "agent_endpoint", label: "Agent Endpoint URL", placeholder: "https://api.myagent.com/chat" },
    { key: "agent_name", label: "Agent Name", placeholder: "My AI Assistant" },
    { key: "auth_token", label: "Auth Token (optional)", placeholder: "Bearer ..." },
  ],
};

export default function PluginsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { notify } = useUi();

  const [pluginTypes, setPluginTypes] = useState<PluginTypeDef[]>([]);
  const [userPlugins, setUserPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);

  // Connect modal state
  const [connectType, setConnectType] = useState<PluginType | null>(null);
  const [form, setForm] = useState({ name: "", description: "", config: {} as Record<string, string> });
  const [saving, setSaving] = useState(false);

  // Edit modal state
  const [editPlugin, setEditPlugin] = useState<Plugin | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", config: {} as Record<string, string> });
  const [editSaving, setEditSaving] = useState(false);

  const [disconnectId, setDisconnectId] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const loadData = useCallback(async () => {
    try {
      const [types, plugins] = await Promise.all([
        apiGet<PluginTypeDef[]>("/plugins/types"),
        apiGet<Plugin[]>("/plugins"),
      ]);
      setPluginTypes(types);
      setUserPlugins(Array.isArray(plugins) ? plugins : []);
    } catch {
      notify("Failed to load plugins.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, loadData]);

  // Auto-open connect modal if ?type= is in URL
  useEffect(() => {
    const t = searchParams.get("type") as PluginType | null;
    if (t && ["ecommerce", "service", "ai_agent"].includes(t)) {
      setConnectType(t);
      setForm({ name: "", description: "", config: {} });
    }
  }, [searchParams]);

  const connectedTypes = new Set(userPlugins.map((p) => p.type));

  async function handleConnect() {
    if (!connectType || !form.name.trim()) return;
    setSaving(true);
    try {
      await apiPost("/plugins", { type: connectType, name: form.name.trim(), description: form.description.trim() || null, config: Object.keys(form.config).length ? form.config : null });
      notify("Plugin connected!");
      setConnectType(null);
      loadData();
    } catch (err: any) {
      notify(err?.message || "Failed to connect plugin.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!editPlugin || !editForm.name.trim()) return;
    setEditSaving(true);
    try {
      await apiPatch(`/plugins/${editPlugin.id}`, { name: editForm.name.trim(), description: editForm.description.trim() || null, config: Object.keys(editForm.config).length ? editForm.config : null });
      notify("Plugin updated.");
      setEditPlugin(null);
      loadData();
    } catch {
      notify("Failed to update plugin.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!disconnectId) return;
    setDisconnecting(true);
    try {
      await apiDelete(`/plugins/${disconnectId}`);
      notify("Plugin disconnected.");
      setDisconnectId(null);
      loadData();
    } catch {
      notify("Failed to disconnect plugin.");
    } finally {
      setDisconnecting(false);
    }
  }

  function openEdit(p: Plugin) {
    setEditPlugin(p);
    setEditForm({ name: p.name, description: p.description ?? "", config: p.config ?? {} });
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <button onClick={() => router.back()} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg">
          <IoChevronBack size={20} className="text-text" />
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-text">Twedot Plugins</h1>
          <p className="text-[12px] text-light-text">Connect your business tools to your Twedot profile</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 pt-6">
        {/* Plugin type cards */}
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-light-text">Available Plugins</h2>
        <div className="flex flex-col gap-3">
          {loading
            ? [1, 2, 3].map((n) => (
                <div key={n} className="h-24 animate-pulse rounded-2xl bg-feed-bg" />
              ))
            : pluginTypes.map((pt) => {
                const meta = TYPE_META[pt.type];
                const Icon = meta.icon;
                const isConnected = connectedTypes.has(pt.type);
                return (
                  <div key={pt.type} className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4">
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
                      <Icon size={22} className={meta.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-text">{pt.label}</span>
                        {isConnected && (
                          <span className="flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <IoCheckmarkCircle size={11} />
                            Connected
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] text-light-text">{pt.description}</p>
                    </div>
                    {!isConnected && (
                      <button
                        onClick={() => { setConnectType(pt.type); setForm({ name: "", description: "", config: {} }); }}
                        className="flex-shrink-0 rounded-full bg-primary px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-primary/90"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
        </div>

        {/* Connected plugins */}
        {userPlugins.length > 0 && (
          <>
            <h2 className="mb-3 mt-8 text-[13px] font-semibold uppercase tracking-wide text-light-text">Your Connected Plugins</h2>
            <div className="flex flex-col gap-3">
              {userPlugins.map((p) => {
                const meta = TYPE_META[p.type];
                const Icon = meta.icon;
                const typeDef = pluginTypes.find((t) => t.type === p.type);
                return (
                  <div key={p.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
                        <Icon size={18} className={meta.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-text">{p.name}</span>
                          <span className={`text-[10px] font-medium ${meta.color}`}>{typeDef?.label ?? p.type}</span>
                        </div>
                        {p.description && (
                          <p className="mt-0.5 text-[11px] text-light-text">{p.description}</p>
                        )}
                        {p.config && Object.keys(p.config).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                            {Object.entries(p.config).filter(([, v]) => v).map(([k, v]) => (
                              <span key={k} className="text-[10px] text-light-text">
                                <span className="font-medium capitalize">{k.replace(/_/g, " ")}:</span>{" "}
                                <span className="font-mono">{String(v).length > 30 ? String(v).slice(0, 30) + "…" : String(v)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-light-text hover:bg-feed-bg"
                          title="Edit"
                        >
                          <IoCreateOutline size={16} />
                        </button>
                        <button
                          onClick={() => setDisconnectId(p.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-light-text hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                          title="Disconnect"
                        >
                          <IoTrashOutline size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Connect modal */}
      {connectType && (
        <PluginModal
          title={`Connect ${pluginTypes.find((t) => t.type === connectType)?.label ?? "Plugin"}`}
          type={connectType}
          form={form}
          saving={saving}
          onClose={() => setConnectType(null)}
          onChange={(key, val) => setForm((f) => ({ ...f, [key]: val }))}
          onConfigChange={(key, val) => setForm((f) => ({ ...f, config: { ...f.config, [key]: val } }))}
          onSubmit={handleConnect}
          submitLabel="Connect"
        />
      )}

      {/* Edit modal */}
      {editPlugin && (
        <PluginModal
          title={`Edit ${pluginTypes.find((t) => t.type === editPlugin.type)?.label ?? "Plugin"}`}
          type={editPlugin.type}
          form={editForm}
          saving={editSaving}
          onClose={() => setEditPlugin(null)}
          onChange={(key, val) => setEditForm((f) => ({ ...f, [key]: val }))}
          onConfigChange={(key, val) => setEditForm((f) => ({ ...f, config: { ...f.config, [key]: val } }))}
          onSubmit={handleEdit}
          submitLabel="Save"
        />
      )}

      {/* Disconnect confirm */}
      {disconnectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6">
            <h3 className="text-[16px] font-bold text-text">Disconnect plugin?</h3>
            <p className="mt-1 text-[13px] text-light-text">This will remove the plugin connection from your profile. You can reconnect it later.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setDisconnectId(null)} className="flex-1 rounded-full border border-border py-2 text-[13px] font-semibold text-text hover:bg-feed-bg">
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex-1 rounded-full bg-red-500 py-2 text-[13px] font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PluginModal({
  title,
  type,
  form,
  saving,
  onClose,
  onChange,
  onConfigChange,
  onSubmit,
  submitLabel,
}: {
  title: string;
  type: PluginType;
  form: { name: string; description: string; config: Record<string, string> };
  saving: boolean;
  onClose: () => void;
  onChange: (key: string, val: string) => void;
  onConfigChange: (key: string, val: string) => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  const fields = CONFIG_FIELDS[type];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:px-4">
      <div className="w-full max-w-lg rounded-t-3xl bg-background p-6 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-text">{title}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-feed-bg">
            <IoClose size={20} className="text-light-text" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-text">Plugin Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="e.g. My Store"
              className="w-full rounded-xl border border-border bg-feed-bg px-3 py-2 text-[13px] text-text placeholder:text-light-text focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold text-text">Description (optional)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="Brief description of this plugin"
              className="w-full rounded-xl border border-border bg-feed-bg px-3 py-2 text-[13px] text-text placeholder:text-light-text focus:border-primary focus:outline-none"
            />
          </div>

          <div className="border-t border-border pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-light-text">Connection Details</p>
            {fields.map((f) => (
              <div key={f.key} className="mb-2">
                <label className="mb-1 block text-[12px] font-medium text-text">{f.label}</label>
                <input
                  type="text"
                  value={form.config[f.key] ?? ""}
                  onChange={(e) => onConfigChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full rounded-xl border border-border bg-feed-bg px-3 py-2 text-[13px] text-text placeholder:text-light-text focus:border-primary focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={saving || !form.name.trim()}
          className="mt-4 w-full rounded-full bg-primary py-3 text-[14px] font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </div>
  );
}

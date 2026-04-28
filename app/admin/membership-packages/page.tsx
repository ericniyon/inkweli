"use client";

import { useEffect, useMemo, useState } from "react";
import { SUBSCRIPTION_PLANS } from "@/constants";

interface SubscriptionPlanRow {
  id: string;
  tier: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  color?: string;
}

const DEFAULT_NEW_PLAN: SubscriptionPlanRow = {
  id: "",
  tier: "NONE",
  name: "",
  price: 0,
  interval: "year",
  features: [],
  color: "",
};

function parseFeatures(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function AdminMembershipPackagesPage() {
  const [plans, setPlans] = useState<SubscriptionPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newPlan, setNewPlan] = useState<SubscriptionPlanRow>(DEFAULT_NEW_PLAN);

  const requiredPlanIds = useMemo(
    () => new Set(SUBSCRIPTION_PLANS.map((plan) => plan.id)),
    []
  );

  const loadPlans = () => {
    setLoading(true);
    fetch("/api/subscription-plans")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!Array.isArray(data)) {
          setPlans([]);
          return;
        }
        setPlans(
          data.map((item) => ({
            id: String(item.id ?? ""),
            tier: String(item.tier ?? "NONE"),
            name: String(item.name ?? ""),
            price: Number(item.price ?? 0),
            interval: String(item.interval ?? "year"),
            features: Array.isArray(item.features)
              ? item.features.filter((f: unknown) => typeof f === "string")
              : [],
            color:
              typeof item.color === "string" && item.color.trim()
                ? item.color.trim()
                : "",
          }))
        );
      })
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const updatePlanField = (
    id: string,
    field: keyof SubscriptionPlanRow,
    value: string | number | string[]
  ) => {
    setPlans((prev) =>
      prev.map((plan) => (plan.id === id ? { ...plan, [field]: value } : plan))
    );
  };

  const savePlan = async (plan: SubscriptionPlanRow) => {
    setSavingId(plan.id);
    try {
      const res = await fetch(
        `/api/subscription-plans/${encodeURIComponent(plan.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tier: plan.tier,
            name: plan.name,
            price: Number.isFinite(plan.price) ? plan.price : 0,
            interval: plan.interval,
            features: plan.features,
            color: plan.color || null,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to save membership package");
        return;
      }
      loadPlans();
    } finally {
      setSavingId(null);
    }
  };

  const deletePlan = async (id: string) => {
    if (requiredPlanIds.has(id)) {
      alert("Default packages used on /membership cannot be deleted.");
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(
        `/api/subscription-plans/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete package");
        return;
      }
      setPlans((prev) => prev.filter((plan) => plan.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const addPlan = async (event: React.FormEvent) => {
    event.preventDefault();
    const id = newPlan.id.trim();
    const name = newPlan.name.trim();
    if (!id || !name) return;
    setAdding(true);
    try {
      const res = await fetch("/api/subscription-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          tier: newPlan.tier.trim(),
          name,
          price: Math.max(0, Number(newPlan.price) || 0),
          interval: newPlan.interval.trim() || "year",
          features: newPlan.features,
          color: newPlan.color?.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to create package");
        return;
      }
      setNewPlan(DEFAULT_NEW_PLAN);
      loadPlans();
    } finally {
      setAdding(false);
    }
  };

  return (
    <main className="flex-grow overflow-y-auto">
      <header className="bg-white border-b border-slate-100 px-12 py-6 sticky top-0 z-40">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Membership
        </h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
          Manage membership packages from database
        </p>
      </header>

      <div className="p-12 space-y-8">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          <p className="text-slate-500 font-medium">
            These packages power the `/membership` page. Keeping the same IDs for
            default plans preserves the current page design and behavior.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center text-slate-500 font-medium">
            Loading packages...
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center text-slate-500 font-medium">
            No membership packages in database.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-4"
              >
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                    ID
                  </label>
                  <input
                    value={plan.id}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Name
                    </label>
                    <input
                      value={plan.name}
                      onChange={(e) =>
                        updatePlanField(plan.id, "name", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Tier
                    </label>
                    <input
                      value={plan.tier}
                      onChange={(e) =>
                        updatePlanField(plan.id, "tier", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Price (RWF)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={plan.price}
                      onChange={(e) =>
                        updatePlanField(
                          plan.id,
                          "price",
                          Number.parseInt(e.target.value || "0", 10)
                        )
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Interval
                    </label>
                    <input
                      value={plan.interval}
                      onChange={(e) =>
                        updatePlanField(plan.id, "interval", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                      Color
                    </label>
                    <input
                      value={plan.color ?? ""}
                      onChange={(e) =>
                        updatePlanField(plan.id, "color", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Features (one per line)
                  </label>
                  <textarea
                    rows={4}
                    value={plan.features.join("\n")}
                    onChange={(e) =>
                      updatePlanField(
                        plan.id,
                        "features",
                        parseFeatures(e.target.value)
                      )
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => savePlan(plan)}
                    disabled={savingId === plan.id}
                    className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition disabled:opacity-50"
                  >
                    {savingId === plan.id ? "Saving..." : "Save package"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePlan(plan.id)}
                    disabled={deletingId === plan.id || requiredPlanIds.has(plan.id)}
                    className="px-6 py-3 rounded-2xl border border-red-100 text-red-600 text-xs font-black uppercase tracking-widest hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {deletingId === plan.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <form
          onSubmit={addPlan}
          className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-4"
        >
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Add package
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              placeholder="Plan ID (e.g. plan_monthly)"
              value={newPlan.id}
              onChange={(e) =>
                setNewPlan((prev) => ({ ...prev, id: e.target.value }))
              }
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Name"
              value={newPlan.name}
              onChange={(e) =>
                setNewPlan((prev) => ({ ...prev, name: e.target.value }))
              }
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Tier (e.g. UNLIMITED)"
              value={newPlan.tier}
              onChange={(e) =>
                setNewPlan((prev) => ({ ...prev, tier: e.target.value }))
              }
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              min={0}
              placeholder="Price"
              value={newPlan.price}
              onChange={(e) =>
                setNewPlan((prev) => ({
                  ...prev,
                  price: Number.parseInt(e.target.value || "0", 10),
                }))
              }
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Interval (year/article)"
              value={newPlan.interval}
              onChange={(e) =>
                setNewPlan((prev) => ({ ...prev, interval: e.target.value }))
              }
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder="Color (optional)"
              value={newPlan.color}
              onChange={(e) =>
                setNewPlan((prev) => ({ ...prev, color: e.target.value }))
              }
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <textarea
            rows={4}
            placeholder="Features, one per line"
            value={newPlan.features.join("\n")}
            onChange={(e) =>
              setNewPlan((prev) => ({
                ...prev,
                features: parseFeatures(e.target.value),
              }))
            }
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
          <button
            type="submit"
            disabled={adding || !newPlan.id.trim() || !newPlan.name.trim()}
            className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition disabled:opacity-50"
          >
            {adding ? "Adding..." : "Add package"}
          </button>
        </form>
      </div>
    </main>
  );
}

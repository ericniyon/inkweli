import React from "react";
import { SUBSCRIPTION_PLANS } from "@/constants";

interface MembershipViewProps {
  onGetStarted: (planId?: string) => void;
}

const MembershipView: React.FC<MembershipViewProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-[calc(100vh-140px)] animate-fade-in bg-white">
      <section className="py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <header className="text-center mb-14 md:mb-20">
            <h1 className="font-charter text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Benefits Per Package
            </h1>
            <p className="font-charter text-slate-600 text-base md:text-lg font-medium">
              Prices in Rwandan Francs (RWF)
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isAnnual = plan.id === "plan_annual";
              return (
                <article
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl overflow-hidden ${
                    isAnnual
                      ? "bg-slate-900 text-white ring-2 ring-slate-900 shadow-xl"
                      : "bg-white border border-slate-200 shadow-sm"
                  }`}
                >
                  {isAnnual && (
                    <div className="absolute top-0 right-0 bg-amber-400 text-slate-900 font-charter text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
                      Full access
                    </div>
                  )}
                  <div className="p-8 md:p-10 flex flex-col flex-grow">
                    <h2 className="font-charter text-xl md:text-2xl font-black mb-1">
                      {plan.name}
                    </h2>
                    <div className="font-charter mt-4 mb-8">
                      <span className="text-3xl md:text-4xl font-black">
                        {new Intl.NumberFormat("en-RW").format(plan.price)}
                      </span>
                      <span
                        className={
                          isAnnual
                            ? "text-slate-300 font-bold text-base ml-1"
                            : "text-slate-400 font-bold text-base ml-1"
                        }
                      >
                        RWF{plan.interval === "year" ? "/year" : "/article"}
                      </span>
                    </div>
                    <ul className="space-y-4 flex-grow">
                      {plan.features.map((item, i) => (
                        <li
                          key={i}
                          className={`flex items-start gap-3 font-charter font-medium ${
                            isAnnual ? "text-slate-200" : "text-slate-700"
                          }`}
                        >
                          <span
                            className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                              isAnnual ? "bg-amber-400/20" : "bg-slate-900/10"
                            }`}
                          >
                            <svg
                              className={`w-3 h-3 ${isAnnual ? "text-amber-400" : "text-slate-900"}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => onGetStarted(plan.id)}
                      className={`mt-10 w-full py-4 rounded-xl font-charter text-base font-bold transition ${
                        isAnnual
                          ? "bg-amber-400 text-slate-900 hover:bg-amber-300"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      Get started
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MembershipView;

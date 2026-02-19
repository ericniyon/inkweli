import React from 'react';
import { SUBSCRIPTION_PLANS } from '@/constants';

interface MembershipViewProps {
  /** Called when user clicks Get started; planId is the selected package (e.g. plan_annual). */
  onGetStarted: (planId?: string) => void;
}

const MembershipView: React.FC<MembershipViewProps> = ({ onGetStarted }) => {
  return (
    <div className="animate-fade-in bg-white text-slate-900">
      {/* Hero Section */}
      <section className="bg-indigo-600 py-32 px-6 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter Charter leading-tight">
            Fuel great writing.
          </h1>
          <p className="text-xl md:text-2xl text-indigo-100 leading-relaxed mb-12 max-w-2xl mx-auto Charter">
            Become a member to support the voices you love and get unlimited access to the best stories on usethinkup.
          </p>
          <button 
            onClick={onGetStarted}
            className="bg-white text-indigo-600 px-10 py-4 rounded-full text-lg font-bold hover:bg-indigo-50 transition shadow-2xl active:scale-95"
          >
            Get unlimited access
          </button>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-32 px-6 max-w-7xl mx-auto border-b border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tight">Read as much as you want.</h2>
              <p className="text-lg text-slate-600 leading-relaxed font-medium Charter">
                Unlock every story, across all your devices. Enjoy an ad-free experience that keeps you focused on the insights that matter.
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tight">Support the writers you love.</h2>
              <p className="text-lg text-slate-600 leading-relaxed font-medium Charter">
                A portion of your membership fee goes directly to the writers you read most, helping them continue their independent work.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="bg-indigo-50 rounded-[3rem] p-12 shadow-inner">
              <div className="bg-white p-8 rounded-3xl shadow-xl space-y-6 transform rotate-2">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100" />
                  <div className="space-y-2 flex-grow">
                    <div className="h-2 w-24 bg-slate-100 rounded" />
                    <div className="h-2 w-16 bg-slate-50 rounded" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-5/6 bg-slate-100 rounded" />
                  <div className="h-3 w-4/6 bg-slate-100 rounded" />
                </div>
                <div className="pt-4 flex justify-between items-center text-indigo-600 font-bold text-xs uppercase tracking-widest">
                  <span>Full Access Unlocked</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Per Package — RWF pricing */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Benefits Per Package</h2>
            <p className="text-slate-600 font-medium">Prices in Rwandan Francs (RWF)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isAnnual = plan.id === 'plan_annual';
              const isPro = isAnnual; // alias for any legacy/cached reference
              return (
                <div
                  key={plan.id}
                  className={`bg-white p-12 rounded-[2.5rem] flex flex-col relative overflow-hidden ${
                    isAnnual ? 'border-2 border-indigo-600 shadow-xl' : 'border border-slate-200 shadow-sm'
                  }`}
                >
                  {isAnnual && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl">
                      Full access
                    </div>
                  )}
                  <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                  <div className="text-4xl font-black mb-8">
                    {new Intl.NumberFormat('en-RW').format(plan.price)}
                    <span className="text-lg text-slate-400 font-bold"> RWF{plan.interval === 'year' ? '/year' : '/article'}</span>
                  </div>
                  <ul className="space-y-4 mb-12 flex-grow">
                    {plan.features.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                        <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => onGetStarted(plan.id)}
                    className={`w-full py-4 rounded-full font-bold transition ${
                      isAnnual ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    Get started
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-black mb-12 text-center">Frequently asked questions</h2>
        <div className="space-y-12">
          {[
            { q: "How much of my membership goes to writers?", a: "usethinkup distributes a portion of your membership fee to writers based on how much time you spend reading their stories." },
            { q: "Can I cancel my membership at any time?", a: "Yes. You can cancel your membership at any time from your account settings. You will continue to have access until the end of your billing period." },
            { q: "Do writers get paid for free stories?", a: "No, writers are only compensated for stories read by members. This ensures that the platform remains sustainable and rewards quality content." },
            { q: "Can I give a membership as a gift?", a: "We are currently working on a gift feature. Stay tuned for updates!" }
          ].map((faq, i) => (
            <div key={i} className="space-y-4">
              <h4 className="text-xl font-black text-slate-900">{faq.q}</h4>
              <p className="text-slate-600 leading-relaxed Charter font-medium">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 px-6 text-center border-t border-slate-100">
        <div className="max-w-xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-tight">Ready to dive in?</h2>
          <button 
            onClick={onGetStarted}
            className="bg-slate-900 text-white px-12 py-5 rounded-full text-xl font-bold hover:bg-slate-800 transition shadow-2xl active:scale-95"
          >
            Get started
          </button>
        </div>
      </section>
    </div>
  );
};

export default MembershipView;

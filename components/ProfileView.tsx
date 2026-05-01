'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, Article, SubscriptionTier } from '../types';
import { PLACEHOLDER_IMAGE } from '../constants';

interface ProfileViewProps {
  user: User;
  articles: Article[];
  onArticleClick: (article: Article) => void;
  onLogout: () => void;
}

type MeSubscriptionRow = {
  id: string;
  planId: string;
  articleId?: string | null;
  status: 'PENDING' | 'ACTIVE' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  plan: {
    id: string;
    name: string;
    tier: string;
    interval: string;
    price: number;
    features: string[];
    color: string | null;
  } | null;
};

type PerArticleUnlock = { id: string; title: string; slug: string };

function tierLabel(tier: SubscriptionTier | string): string {
  switch (tier) {
    case SubscriptionTier.UNLIMITED:
    case 'UNLIMITED':
      return 'Unlimited';
    case SubscriptionTier.TWO_ARTICLES:
    case 'TWO_ARTICLES':
      return 'Standard';
    case SubscriptionTier.ONE_ARTICLE:
    case 'ONE_ARTICLE':
      return 'Per article';
    default:
      return 'Free';
  }
}

function statusLabel(status: MeSubscriptionRow['status']): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'PENDING':
      return 'Processing payment';
    case 'FAILED':
      return 'Failed';
    default:
      return status;
  }
}

function formatInterval(interval: string): string {
  const i = interval.trim().toLowerCase();
  if (i === 'month') return 'month';
  if (i === 'year') return 'year';
  if (i === 'article') return 'article';
  return interval;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, articles, onArticleClick, onLogout }) => {
  const isGuest = user.id === 'guest';
  const [membership, setMembership] = useState<{
    subscriptions: MeSubscriptionRow[];
    perArticleUnlocks: PerArticleUnlock[];
  } | null>(null);

  useEffect(() => {
    if (isGuest) {
      setMembership(null);
      return;
    }
    let cancelled = false;
    fetch('/api/subscriptions/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok)
          return {
            subscriptions: [] as MeSubscriptionRow[],
            perArticleUnlocks: [] as PerArticleUnlock[],
          };
        const data = await res.json().catch(() => ({}));
        return {
          subscriptions: Array.isArray(data?.subscriptions)
            ? (data.subscriptions as MeSubscriptionRow[])
            : ([] as MeSubscriptionRow[]),
          perArticleUnlocks: Array.isArray(data?.per_article_unlocks)
            ? (data.per_article_unlocks as PerArticleUnlock[])
            : ([] as PerArticleUnlock[]),
        };
      })
      .then((parsed) => {
        if (!cancelled) setMembership(parsed);
      })
      .catch(() => {
        if (!cancelled)
          setMembership({ subscriptions: [], perArticleUnlocks: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [isGuest, user.id]);

  const subs = membership?.subscriptions ?? [];
  const perArticleUnlocks = membership?.perArticleUnlocks ?? [];
  const unlockById = new Map(perArticleUnlocks.map((a) => [a.id, a]));

  const activeSubs = subs.filter((s) => s.status === 'ACTIVE');
  const pendingSubs = subs.filter((s) => s.status === 'PENDING');

  return (
    <div className="animate-fade-in">
      <div className="mb-16">
        <div className="flex flex-col sm:flex-row items-center gap-8 mb-12">
           <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center">
              {isGuest ? (
                <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2" /></svg>
              ) : (
                <img src={user.avatar || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt="" />
              )}
           </div>
           <div className="text-center sm:text-left flex-1">
              <h1 className="text-4xl font-black text-slate-900 mb-1">{user.name}</h1>
              {!isGuest && (
                <>
                  <p className="text-sm text-slate-500 font-medium mb-4">{user.followersCount} Followers · {user.following.length} Following</p>
                  <p className="text-slate-600 Charter leading-relaxed max-w-xl italic">"{user.bio || 'Sharing thoughts and insights from usethinkup.'}"</p>
                </>
              )}
           </div>
           <div className="flex gap-3">
              {!isGuest ? (
                <>
                  <button className="bg-emerald-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-emerald-700 transition">Edit profile</button>
                  <button onClick={onLogout} className="px-6 py-2 border border-red-100 text-red-500 rounded-full text-sm font-bold hover:bg-red-50 transition">Sign out</button>
                </>
              ) : (
                <button className="bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-slate-800 transition">Sign in to edit</button>
              )}
           </div>
        </div>

        {!isGuest && (
          <section
            className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm mb-12"
            aria-labelledby="profile-membership-heading"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <h2 id="profile-membership-heading" className="text-lg font-black text-slate-900">
                  Membership
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Current access:{' '}
                  <span className="font-semibold text-slate-800">{tierLabel(user.tier)}</span>
                </p>
              </div>
              <Link
                href="/membership"
                className="inline-flex justify-center shrink-0 rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800 transition"
              >
                Manage plan
              </Link>
            </div>

            {membership === null ? (
              <p className="text-sm text-slate-400">Loading subscription details…</p>
            ) : (
              <>
                {subs.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    No subscription purchases on file yet.{user.tier === SubscriptionTier.NONE ? ' Upgrade to unlock more stories.' : ''}
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {activeSubs.length > 0 && (
                      <>
                        <li className="text-xs font-bold uppercase tracking-widest text-emerald-700">Active plans</li>
                        {activeSubs.map((row) => {
                          const story = row.articleId ? unlockById.get(row.articleId) : undefined;
                          return (
                            <li
                              key={row.id}
                              className="rounded-xl bg-emerald-50/80 border border-emerald-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{row.plan?.name ?? row.planId}</p>
                                <p className="text-xs text-slate-600 mt-0.5">
                                  {row.plan
                                    ? `${new Intl.NumberFormat('en-RW').format(row.plan.price)} RWF / ${formatInterval(row.plan.interval)} · ${tierLabel(row.plan.tier)}`
                                    : `Plan ${row.planId}`}
                                </p>
                                {story && (
                                  <p className="text-xs text-slate-700 mt-2">
                                    Includes:{' '}
                                    <Link
                                      href={`/detail/${story.id}`}
                                      className="font-semibold text-emerald-800 hover:underline"
                                    >
                                      {story.title}
                                    </Link>
                                  </p>
                                )}
                              </div>
                              <span className="text-xs font-bold uppercase tracking-wide text-emerald-800 shrink-0">
                                {statusLabel(row.status)}
                              </span>
                            </li>
                          );
                        })}
                      </>
                    )}
                    {pendingSubs.length > 0 && (
                      <>
                        <li className="text-xs font-bold uppercase tracking-widest text-amber-700 pt-2">Pending</li>
                        {pendingSubs.map((row) => {
                          const story = row.articleId ? unlockById.get(row.articleId) : undefined;
                          return (
                            <li
                              key={row.id}
                              className="rounded-xl bg-amber-50/80 border border-amber-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{row.plan?.name ?? row.planId}</p>
                                <p className="text-xs text-slate-600">{statusLabel(row.status)}</p>
                                {story && (
                                  <p className="text-xs text-slate-700 mt-2">
                                    For:{' '}
                                    <Link
                                      href={`/detail/${story.id}`}
                                      className="font-semibold text-amber-900 hover:underline"
                                    >
                                      {story.title}
                                    </Link>
                                  </p>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </>
                    )}
                    {subs.some((s) => s.status === 'FAILED') && (
                      <>
                        <li className="text-xs font-bold uppercase tracking-widest text-slate-400 pt-2">
                          Past attempts
                        </li>
                        {subs
                          .filter((s) => s.status === 'FAILED')
                          .map((row) => (
                            <li
                              key={row.id}
                              className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm text-slate-600"
                            >
                              {row.plan?.name ?? row.planId}{' '}
                              <span className="text-slate-400">· {statusLabel(row.status)}</span>
                            </li>
                          ))}
                      </>
                    )}
                  </ul>
                )}

                {user.tier === SubscriptionTier.ONE_ARTICLE && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Story access
                    </p>
                    {perArticleUnlocks.length === 0 ? (
                      <p className="text-sm text-slate-600">
                        No story is linked to your account yet. Per-article payments started from an article page are listed here.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {perArticleUnlocks.map((a) => (
                          <li key={a.id}>
                            <Link
                              href={`/detail/${a.id}`}
                              className="text-sm font-semibold text-emerald-800 hover:underline"
                            >
                              {a.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        <div className="flex items-center gap-8 border-b border-slate-100 mb-12">
          <button className="text-sm font-bold text-slate-900 pb-4 border-b-2 border-slate-900 -mb-[17px]">Home</button>
          <button className="text-sm font-medium text-slate-400 pb-4 hover:text-slate-900 transition">About</button>
        </div>

        <div className="space-y-16">
          {articles.length > 0 ? articles.map(article => (
            <div key={article.id} className="group cursor-pointer" onClick={() => onArticleClick(article)}>
              <div className="flex items-center gap-2 mb-3">
                  <img src={article.authorAvatar || PLACEHOLDER_IMAGE} className="w-5 h-5 rounded-full" alt="" />
                  <span className="text-[10px] font-bold text-slate-900">{article.authorName}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[10px] text-slate-400 uppercase">{article.publishDate}</span>
              </div>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-grow">
                  <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2 group-hover:text-slate-600 transition-colors">{article.title}</h2>
                  <p className="text-slate-600 line-clamp-2 mb-4 Charter leading-relaxed text-sm">{article.excerpt}</p>
                  <div className="flex items-center gap-4">
                     <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{article.category}</span>
                     <span className="text-xs text-slate-400 font-medium">{article.readingTime} min read</span>
                  </div>
                </div>
                {article.featuredImage && (
                  <div className="w-full md:w-32 h-24 rounded overflow-hidden bg-slate-100 flex-shrink-0">
                    <img src={article.featuredImage || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt="" />
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
               <p className="text-slate-400 font-medium">{isGuest ? 'Sign in to see your stories.' : "You haven't published any stories yet."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;

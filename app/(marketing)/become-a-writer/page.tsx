"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function BecomeAWriterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [motivation, setMotivation] = useState("");
  const [topics, setTopics] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/writer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          bio: bio.trim() || undefined,
          motivation: motivation.trim() || undefined,
          topics: topics.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-charter text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-4">
          Request received
        </h1>
        <p className="font-charter text-slate-600 text-base sm:text-lg leading-relaxed mb-8">
          Thank you for your interest in writing for ThinkUp. We&apos;ll review your request and get back to you at <strong className="text-slate-800">{email}</strong>.
        </p>
        <Link
          href="/"
          className="font-charter inline-flex items-center justify-center px-6 py-3 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="text-center mb-10">
        <h1 className="font-charter text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
          Become a Writer
        </h1>
        <p className="font-charter text-slate-600 text-base sm:text-lg">
          Share your expertise and stories with the ThinkUp community. Request to join our writers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-800 text-sm font-medium">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block font-charter text-sm font-bold text-slate-700 mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="font-charter w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
          />
        </div>

        <div>
          <label htmlFor="email" className="block font-charter text-sm font-bold text-slate-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="font-charter w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block font-charter text-sm font-bold text-slate-700 mb-2">
            Short bio
          </label>
          <textarea
            id="bio"
            rows={3}
            placeholder="A brief intro about you and your background"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="font-charter w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow resize-none"
          />
        </div>

        <div>
          <label htmlFor="motivation" className="block font-charter text-sm font-bold text-slate-700 mb-2">
            Why do you want to write for ThinkUp?
          </label>
          <textarea
            id="motivation"
            rows={4}
            placeholder="Tell us what drives you and what you hope to share with readers"
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            className="font-charter w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow resize-none"
          />
        </div>

        <div>
          <label htmlFor="topics" className="block font-charter text-sm font-bold text-slate-700 mb-2">
            Topics you&apos;d like to write about
          </label>
          <input
            id="topics"
            type="text"
            placeholder="e.g. Technology, Politics, Culture, Business"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            className="font-charter w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="font-charter w-full py-3.5 px-6 rounded-full bg-slate-900 text-white text-base font-bold hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting…" : "Submit request"}
        </button>
      </form>

      <p className="font-charter text-sm text-slate-500 text-center mt-8">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-slate-700 hover:text-slate-900 underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

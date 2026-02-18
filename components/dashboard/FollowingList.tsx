"use client";

import React from "react";
import { PLACEHOLDER_IMAGE } from "@/constants";

export interface FollowedUser {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface FollowingListProps {
  users: FollowedUser[];
  onUnfollow: (id: string) => void;
}

export default function FollowingList({ users, onUnfollow }: FollowingListProps) {
  if (users.length === 0) {
    return (
      <div className="max-w-screen-md mx-auto py-8 px-4">
        <div className="py-16 text-center">
          <p className="text-zinc-500 text-sm mb-2">You aren’t following anyone yet.</p>
          <p className="text-zinc-400 text-sm">
            Follow writers from the right panel or from article pages to see them here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-md mx-auto py-8 px-4">
      <div className="space-y-2">
        {users.map((person) => (
          <div
            key={person.id}
            className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 hover:bg-zinc-50/50 transition-colors"
          >
            <img
              src={person.avatar || PLACEHOLDER_IMAGE}
              alt=""
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-900 truncate">{person.name}</p>
              {person.role && (
                <p className="text-xs text-zinc-500 truncate">{person.role}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onUnfollow(person.id)}
              className="shrink-0 px-4 py-2 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-full hover:border-zinc-400 hover:text-zinc-900 transition-colors"
            >
              Following
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

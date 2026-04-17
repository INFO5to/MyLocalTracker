"use client";

import { startTransition, useEffect, useEffectEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type RealtimeTarget = {
  table: string;
  filter?: string;
};

type RealtimeRefreshProps = {
  channelName: string;
  targets: RealtimeTarget[];
};

export function RealtimeRefresh({
  channelName,
  targets,
}: RealtimeRefreshProps) {
  const router = useRouter();

  const refreshView = useEffectEvent(() => {
    startTransition(() => {
      router.refresh();
    });
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const channel = supabase.channel(channelName);

    for (const target of targets) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: target.table,
          filter: target.filter,
        },
        () => {
          refreshView();
        },
      );
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelName, targets]);

  return null;
}

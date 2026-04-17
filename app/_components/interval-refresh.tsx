"use client";

import { startTransition, useEffect, useEffectEvent } from "react";
import { useRouter } from "next/navigation";

type IntervalRefreshProps = {
  intervalMs?: number;
};

export function IntervalRefresh({ intervalMs = 5000 }: IntervalRefreshProps) {
  const router = useRouter();

  const refreshView = useEffectEvent(() => {
    startTransition(() => {
      router.refresh();
    });
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      refreshView();
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [intervalMs]);

  return null;
}

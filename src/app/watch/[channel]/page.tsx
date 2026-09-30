import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getChannel } from "@/lib/channels";
import { WatchFallback, WatchScreen } from "@/components/watch-screen";

export async function generateMetadata({ params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  const found = getChannel(channel);
  return { title: found?.name ?? "Channel" };
}

export default async function WatchPage({ params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  if (!getChannel(channel)) notFound();
  return (
    <Suspense fallback={<WatchFallback />}>
      <WatchScreen slug={channel} />
    </Suspense>
  );
}

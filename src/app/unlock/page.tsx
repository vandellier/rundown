import { UnlockForm } from "@/components/unlock-form";

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith("/") ? params.next : "/watch/mine";
  return <UnlockForm nextPath={nextPath} />;
}

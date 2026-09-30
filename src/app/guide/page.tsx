import type { Metadata } from "next";
import { GuideBoard } from "@/components/guide-board";

export const metadata: Metadata = { title: "Channel guide" };

export default function GuidePage() {
  return <GuideBoard />;
}

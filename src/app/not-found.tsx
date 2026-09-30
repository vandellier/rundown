import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-full place-items-center p-8 text-center">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.18em] text-gold uppercase">404</p>
        <h1 className="mt-2 font-serif text-4xl">That channel isn&apos;t on the guide.</h1>
        <Link href="/guide" className="mt-5 inline-flex rounded-full bg-gold px-4 py-2 text-sm font-semibold text-[#1a1206]">
          Back to the guide
        </Link>
      </div>
    </div>
  );
}

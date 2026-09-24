import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-black">

      {/* ================= HEADER ================= */}

      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">

          <Link
            href="/"
            className="text-xl font-semibold tracking-[0.3em] sm:text-2xl"
          >
            ORENTEMIST
          </Link>

          <Link
            href="/cart"
            className="text-sm transition hover:opacity-50"
          >
            Cart
          </Link>

        </div>
      </header>


      {/* ================= MAIN ================= */}

      <section className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden px-5 py-20">

        {/* Background decoration */}

        <div className="pointer-events-none absolute left-[-120px] top-[15%] h-72 w-72 rounded-full border border-black/5" />

        <div className="pointer-events-none absolute bottom-[-180px] right-[-100px] h-[420px] w-[420px] rounded-full border border-black/5" />

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-3xl" />


        <div className="relative z-10 w-full max-w-4xl text-center">

          {/* Small label */}

          <p className="text-[10px] uppercase tracking-[0.45em] text-black/40">
            ORENTEMIST
          </p>


          {/* 404 */}

          <div className="mt-8">

            <h1 className="text-[clamp(8rem,25vw,20rem)] font-light leading-[0.75] tracking-[-0.08em] text-black/[0.06]">
              404
            </h1>

            <div className="relative -mt-16 sm:-mt-24 md:-mt-32">

              <p className="text-xs uppercase tracking-[0.4em] text-black/40">
                Fragrance not found
              </p>

              <h2 className="mx-auto mt-5 max-w-2xl text-4xl font-light leading-tight tracking-[-0.04em] sm:text-5xl md:text-6xl">
                This scent has
                <br />
                <span className="italic">
                  disappeared.
                </span>
              </h2>

              <p className="mx-auto mt-7 max-w-md text-sm leading-7 text-black/50">
                The page you&apos;re looking for may have moved,
                expired, or never existed. But there are plenty
                of fragrances waiting to be discovered.
              </p>

            </div>

          </div>


          {/* Buttons */}

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">

            <Link
              href="/"
              className="bg-black px-8 py-4 text-sm font-medium text-white transition hover:bg-black/80"
            >
              Return Home
            </Link>

            <Link
              href="/products"
              className="border border-black/15 bg-white px-8 py-4 text-sm font-medium transition hover:bg-black hover:text-white"
            >
              Explore Fragrances
            </Link>

          </div>


          {/* Bottom links */}

          <div className="mt-16 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-black/40">

            <Link
              href="/collection"
              className="transition hover:text-black"
            >
              Collection
            </Link>

            <Link
              href="/about"
              className="transition hover:text-black"
            >
              About
            </Link>

            <Link
              href="/contact"
              className="transition hover:text-black"
            >
              Contact
            </Link>

            <Link
              href="/account"
              className="transition hover:text-black"
            >
              Account
            </Link>

          </div>

        </div>

      </section>


      {/* ================= FOOTER ================= */}

      <footer className="border-t border-black/10 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-7 text-xs text-black/40 sm:flex-row sm:px-8 lg:px-10">

          <p>
            © {new Date().getFullYear()} ORENTEMIST. All rights reserved.
          </p>

          <p>
            Find your signature scent.
          </p>

        </div>

      </footer>

    </main>
  );
}
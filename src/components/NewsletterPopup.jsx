"use client";

import { useEffect, useState } from "react";

function NewsletterArtwork() {
  return (
    <svg
      className="newsletter-artwork-svg"
      viewBox="0 0 720 820"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Luxury perfume bottle"
    >
      <defs>
        <linearGradient id="newsletterBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eee0ca" />
          <stop offset="48%" stopColor="#d8c0a0" />
          <stop offset="100%" stopColor="#b99970" />
        </linearGradient>

        <linearGradient id="newsletterFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cdb18d" stopOpacity="0" />
          <stop offset="100%" stopColor="#8e6e4b" stopOpacity="0.38" />
        </linearGradient>

        <linearGradient id="newsletterGlass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff5df" stopOpacity="0.78" />
          <stop offset="20%" stopColor="#dcae6d" stopOpacity="0.42" />
          <stop offset="52%" stopColor="#fff3d6" stopOpacity="0.72" />
          <stop offset="78%" stopColor="#b97832" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fff5df" stopOpacity="0.76" />
        </linearGradient>

        <linearGradient id="newsletterLiquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9b566" stopOpacity="0.68" />
          <stop offset="100%" stopColor="#9a571f" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id="newsletterCap" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#19130f" />
          <stop offset="50%" stopColor="#4b3828" />
          <stop offset="100%" stopColor="#120e0b" />
        </linearGradient>

        <linearGradient id="newsletterStone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d5c2a7" />
          <stop offset="100%" stopColor="#9b8062" />
        </linearGradient>

        <linearGradient id="newsletterFabric" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff9eb" stopOpacity="0.94" />
          <stop offset="45%" stopColor="#e8d7bc" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#bfa27d" stopOpacity="0.78" />
        </linearGradient>

        <radialGradient id="newsletterGlow" cx="35%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#fff8e8" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#fff8e8" stopOpacity="0" />
        </radialGradient>

        <filter
          id="newsletterShadow"
          x="-40%"
          y="-40%"
          width="180%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="18" />
        </filter>

        <filter
          id="newsletterBottleShadow"
          x="-50%"
          y="-50%"
          width="200%"
          height="220%"
        >
          <feGaussianBlur stdDeviation="10" />
        </filter>

        <filter
          id="newsletterSoft"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Background */}
      <rect width="720" height="820" fill="url(#newsletterBg)" />

      <rect width="720" height="820" fill="url(#newsletterGlow)" />

      {/* Soft architectural light */}
      <path
        d="M0 130 C145 45 258 74 360 150 C470 232 565 198 720 78 L720 0 L0 0Z"
        fill="#fff7e8"
        opacity="0.2"
      />

      <path
        d="M0 250 C155 170 230 210 325 285 C410 352 540 314 720 205"
        fill="none"
        stroke="#fff8e8"
        strokeWidth="74"
        opacity="0.11"
        filter="url(#newsletterSoft)"
      />

      {/* Ground */}
      <path
        d="M0 570 C155 535 248 585 342 655 C470 750 572 704 720 590 L720 820 L0 820Z"
        fill="url(#newsletterFloor)"
      />

      {/* Bottle shadow */}
      <ellipse
        cx="500"
        cy="732"
        rx="178"
        ry="30"
        fill="#4e3824"
        opacity="0.3"
        filter="url(#newsletterShadow)"
      />

      {/* Luxury fabric */}
      <path
        d="M0 655 C100 635 165 646 238 687 C307 725 352 742 428 731 C493 722 556 678 610 643 C651 617 688 606 720 610 L720 820 L0 820Z"
        fill="url(#newsletterFabric)"
        opacity="0.92"
      />

      <path
        d="M0 694 C96 672 151 692 226 733 C294 770 349 780 412 763 C484 744 536 686 596 661 C644 641 687 645 720 662"
        fill="none"
        stroke="#fffaf0"
        strokeWidth="14"
        opacity="0.42"
      />

      {/* Stone pedestal */}
      <g transform="translate(390 626)">
        <path
          d="M-30 4 L150 4 L180 105 L-58 105 Z"
          fill="#624a31"
          opacity="0.25"
          filter="url(#newsletterShadow)"
        />

        <path
          d="M-32 0 L145 0 L171 91 L-56 91 Z"
          fill="url(#newsletterStone)"
        />

        <path
          d="M-24 7 L137 7 L158 79 L-45 79 Z"
          fill="#d9c6aa"
          opacity="0.35"
        />

        <path
          d="M8 18 L58 9 M76 17 L126 11 M2 45 L42 35 M82 51 L136 39"
          stroke="#8c7357"
          strokeWidth="3"
          opacity="0.2"
        />
      </g>

      {/* Perfume bottle shadow */}
      <ellipse
        cx="516"
        cy="655"
        rx="93"
        ry="20"
        fill="#402a19"
        opacity="0.42"
        filter="url(#newsletterBottleShadow)"
      />

      {/* Perfume bottle */}
      <g transform="translate(448 235)">
        {/* Cap */}
        <rect
          x="18"
          y="0"
          width="118"
          height="78"
          rx="13"
          fill="url(#newsletterCap)"
        />

        <rect
          x="25"
          y="7"
          width="104"
          height="64"
          rx="9"
          fill="#17110d"
          opacity="0.72"
        />

        <path
          d="M30 12 L30 67"
          stroke="#9c7651"
          strokeWidth="3"
          opacity="0.24"
        />

        <path
          d="M121 13 L121 66"
          stroke="#e1bd8e"
          strokeWidth="2"
          opacity="0.12"
        />

        {/* Neck */}
        <rect
          x="55"
          y="73"
          width="44"
          height="46"
          rx="6"
          fill="#3e2c1c"
        />

        <rect
          x="61"
          y="76"
          width="32"
          height="42"
          rx="4"
          fill="#1c140f"
          opacity="0.72"
        />

        {/* Glass */}
        <rect
          x="0"
          y="105"
          width="154"
          height="278"
          rx="25"
          fill="url(#newsletterGlass)"
          stroke="#fff7e4"
          strokeWidth="5"
          opacity="0.96"
        />

        {/* Perfume liquid */}
        <rect
          x="9"
          y="184"
          width="136"
          height="190"
          rx="18"
          fill="url(#newsletterLiquid)"
          opacity="0.83"
        />

        <path
          d="M18 184 C54 171 100 178 136 184 L136 204 C100 193 53 192 18 204Z"
          fill="#ffe1a9"
          opacity="0.38"
        />

        {/* Glass highlights */}
        <path
          d="M23 122 C16 205 18 288 29 354"
          stroke="#fffdf4"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.48"
        />

        <path
          d="M122 125 C137 204 135 285 122 351"
          stroke="#fff4d9"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.25"
        />

        {/* Label */}
        <rect
          x="29"
          y="247"
          width="96"
          height="70"
          rx="2"
          fill="#efe2ca"
          opacity="0.92"
        />

        <text
          x="77"
          y="274"
          textAnchor="middle"
          fill="#2a2119"
          fontFamily="Georgia, Times New Roman, serif"
          fontSize="12"
          letterSpacing="3"
        >
          ORENTEMIST
        </text>

        <text
          x="77"
          y="294"
          textAnchor="middle"
          fill="#6f5b45"
          fontFamily="Arial, sans-serif"
          fontSize="6"
          letterSpacing="2"
        >
          PARFUM
        </text>
      </g>

      {/* Abstract curved decoration */}
      <path
        d="M604 0 C583 145 633 217 708 260 C746 281 758 317 720 352"
        fill="none"
        stroke="#7c5d3f"
        strokeWidth="9"
        opacity="0.13"
      />

      <path
        d="M680 0 C657 132 690 183 720 201"
        fill="none"
        stroke="#fff5df"
        strokeWidth="3"
        opacity="0.28"
      />

      {/* Tiny light details */}
      <circle
        cx="90"
        cy="90"
        r="2"
        fill="#fff8e9"
        opacity="0.55"
      />

      <circle
        cx="140"
        cy="160"
        r="1.5"
        fill="#fff8e9"
        opacity="0.45"
      />

      <circle
        cx="205"
        cy="105"
        r="2"
        fill="#fff8e9"
        opacity="0.35"
      />
    </svg>
  );
}

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (
      localStorage.getItem(
        "orentemist_newsletter_subscribed"
      ) === "true"
    ) {
      return;
    }

    const dismissedUntil = localStorage.getItem(
      "orentemist_newsletter_dismissed_until"
    );

    if (
      dismissedUntil &&
      Date.now() < Number(dismissedUntil)
    ) {
      return;
    }

    let opened = false;
    let timer;

    const openPopup = () => {
      if (opened) return;

      opened = true;
      setIsOpen(true);

      window.removeEventListener(
        "scroll",
        handleScroll
      );

      clearTimeout(timer);
    };

    const handleScroll = () => {
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop;

      const documentHeight =
        document.documentElement.scrollHeight -
        window.innerHeight;

      if (documentHeight <= 0) return;

      const percentage =
        scrollTop / documentHeight;

      if (percentage >= 0.5) {
        openPopup();
      }
    };

    /*
      Popup appears after 15 seconds.
    */
    timer = setTimeout(openPopup, 15000);

    /*
      Or when the visitor reaches 50% of the page.
    */
    window.addEventListener(
      "scroll",
      handleScroll,
      { passive: true }
    );

    return () => {
      clearTimeout(timer);

      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  const closePopup = () => {
    setIsOpen(false);

    /*
      Don't show the popup again for 7 days
      after the visitor closes it.
    */
    const sevenDays =
      7 * 24 * 60 * 60 * 1000;

    localStorage.setItem(
      "orentemist_newsletter_dismissed_until",
      String(Date.now() + sevenDays)
    );
  };
  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (
      !trimmedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        trimmedEmail
      )
    ) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://perfume-backend-sbvd.onrender.com/api";

      const response = await fetch(
        `${API_URL}/newsletter/subscribe/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: trimmedEmail,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            data?.error ||
            "Unable to subscribe right now."
        );
      }

      localStorage.setItem(
        "orentemist_newsletter_subscribed",
        "true"
      );

      localStorage.removeItem(
        "orentemist_newsletter_dismissed_until"
      );

      setEmail("");
      setStatus("success");
    } catch (error) {
      console.error(
        "Newsletter subscription error:",
        error
      );

      setStatus("error");
    }
  };

  const handleBackdropClick = (event) => {
    if (
      event.target === event.currentTarget
    ) {
      closePopup();
    }
  };

  if (!mounted || !isOpen) {
    return null;
  }

  return (
    <div
      className="newsletter-overlay"
      onMouseDown={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-title"
    >
      <div className="newsletter-modal">

        {/* Close button */}
        <button
          type="button"
          className="newsletter-close"
          onClick={closePopup}
          aria-label="Close newsletter popup"
        >
          <span />
          <span />
        </button>

        {/* SVG artwork */}
        <div className="newsletter-artwork">
          <NewsletterArtwork />

          <div className="newsletter-artwork-label">
            ORENTEMIST
          </div>
        </div>

        {/* Newsletter content */}
        <div className="newsletter-content">

          {status === "success" ? (
            <div className="newsletter-success">

              <div className="success-mark">
                ✓
              </div>

              <p className="newsletter-eyebrow">
                WELCOME TO ORENTEMIST
              </p>

              <h2>
                You&apos;re on
                <br />
                the list.
              </h2>

              <p className="newsletter-description">
                Your inbox just got a little more
                interesting. We&apos;ll keep you
                updated on new arrivals, exclusive
                offers and fragrance drops.
              </p>

              <button
                type="button"
                className="newsletter-continue"
                onClick={() => setIsOpen(false)}
              >
                CONTINUE SHOPPING
              </button>

            </div>
          ) : (
            <>
              <p className="newsletter-eyebrow">
                A LITTLE SOMETHING FOR YOUR INBOX
              </p>

              <h2 id="newsletter-title">
                Stay close
                <br />
                to the scent.
              </h2>

              <p className="newsletter-description">
                Discover new arrivals, exclusive
                offers, fragrance drops and private
                access before everyone else.
              </p>

              <form
                className="newsletter-form"
                onSubmit={handleSubmit}
              >
                <div className="newsletter-input-wrap">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(
                        event.target.value
                      );

                      if (
                        status === "error"
                      ) {
                        setStatus("idle");
                      }
                    }}
                    placeholder="Your email address"
                    autoComplete="email"
                    aria-label="Email address"
                    disabled={
                      status === "loading"
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    status === "loading"
                  }
                >
                  {status === "loading"
                    ? "JOINING..."
                    : "JOIN THE LIST"}
                </button>
              </form>

              {status === "error" && (
                <p className="newsletter-error">
                  Please enter a valid email
                  address.
                </p>
              )}

              <p className="newsletter-note">
                No spam. Just good fragrance.
              </p>
            </>
          )}

        </div>
      </div>

      <style jsx>{`

        /* =========================================
           OVERLAY
        ========================================= */

        .newsletter-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 24px;

          background:
            rgba(15, 12, 9, 0.58);

          backdrop-filter: blur(9px);
          -webkit-backdrop-filter: blur(9px);

          animation:
            newsletterFade
            0.35s
            ease
            forwards;
        }

        /* =========================================
           MODAL
        ========================================= */

        .newsletter-modal {
          position: relative;

          display: grid;

          grid-template-columns:
            1.05fr
            0.95fr;

          width: min(
            940px,
            100%
          );

          max-height:
            min(
              680px,
              calc(100vh - 48px)
            );

          overflow: hidden;

          background: #f5f0e8;

          box-shadow:
            0 35px 90px
              rgba(0, 0, 0, 0.28),
            0 10px 35px
              rgba(0, 0, 0, 0.14);

          animation:
            newsletterEnter
            0.45s
            cubic-bezier(
              0.16,
              1,
              0.3,
              1
            )
            forwards;
        }

        /* =========================================
           SVG ARTWORK
        ========================================= */

        .newsletter-artwork {
          position: relative;

          min-height: 590px;

          overflow: hidden;

          background: #d7bea0;
        }

        .newsletter-artwork-svg {
          display: block;

          width: 100%;
          height: 100%;

          min-height: 590px;
        }

        .newsletter-artwork-label {
          position: absolute;

          left: 28px;
          bottom: 25px;

          color:
            rgba(
              255,
              255,
              255,
              0.9
            );

          font-size: 10px;

          letter-spacing: 0.3em;

          font-weight: 500;
        }

        /* =========================================
           CONTENT
        ========================================= */

        .newsletter-content {
          position: relative;

          display: flex;

          flex-direction: column;

          justify-content: center;

          padding:
            72px
            58px
            58px;

          background: #f5f0e8;
        }

        .newsletter-eyebrow {
          margin:
            0
            0
            22px;

          color: #756d62;

          font-size: 10px;

          line-height: 1.4;

          letter-spacing: 0.22em;

          font-weight: 600;
        }

        .newsletter-content h2 {
          margin: 0;

          color: #161411;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size:
            clamp(
              40px,
              4.2vw,
              58px
            );

          line-height: 0.98;

          letter-spacing:
            -0.045em;

          font-weight: 400;
        }

        .newsletter-description {
          max-width: 390px;

          margin:
            25px
            0
            30px;

          color: #5e5952;

          font-size: 14px;

          line-height: 1.75;
        }

        /* =========================================
           FORM
        ========================================= */

        .newsletter-form {
          display: flex;

          flex-direction: column;

          gap: 10px;

          width: 100%;
        }

        .newsletter-input-wrap input {
          width: 100%;

          height: 54px;

          box-sizing: border-box;

          border:
            1px solid
            #d1c8bb;

          border-radius: 0;

          outline: none;

          padding:
            0
            16px;

          background:
            rgba(
              255,
              255,
              255,
              0.45
            );

          color: #161411;

          font-size: 13px;

          transition:
            border-color
            0.2s
            ease,
            background
            0.2s
            ease;
        }

        .newsletter-input-wrap input::placeholder {
          color: #8b847b;
        }

        .newsletter-input-wrap input:focus {
          border-color: #777066;

          background:
            rgba(
              255,
              255,
              255,
              0.75
            );
        }

        .newsletter-form button,
        .newsletter-continue {
          width: 100%;

          height: 54px;

          border: 0;

          border-radius: 0;

          background: #171512;

          color: #fff;

          cursor: pointer;

          font-size: 10px;

          font-weight: 600;

          letter-spacing: 0.2em;

          transition:
            transform
            0.2s
            ease,
            background
            0.2s
            ease;
        }

        .newsletter-form button:hover,
        .newsletter-continue:hover {
          background: #2c2924;

          transform:
            translateY(-1px);
        }

        .newsletter-form button:disabled {
          cursor: wait;

          opacity: 0.7;

          transform: none;
        }

        .newsletter-note {
          margin:
            15px
            0
            0;

          color: #928a80;

          font-size: 10px;

          line-height: 1.5;
        }

        .newsletter-error {
          margin:
            10px
            0
            0;

          color: #8b3939;

          font-size: 11px;
        }

        /* =========================================
           CLOSE BUTTON
        ========================================= */

        .newsletter-close {
          position: absolute;

          top: 17px;
          right: 17px;

          z-index: 10;

          width: 36px;
          height: 36px;

          display: flex;

          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(
              30,
              27,
              23,
              0.14
            );

          border-radius: 50%;

          background:
            rgba(
              245,
              240,
              232,
              0.82
            );

          cursor: pointer;

          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
        }

        .newsletter-close span {
          position: absolute;

          width: 14px;

          height: 1px;

          background: #211f1b;
        }

        .newsletter-close span:first-child {
          transform: rotate(45deg);
        }

        .newsletter-close span:last-child {
          transform: rotate(-45deg);
        }

        /* =========================================
           SUCCESS
        ========================================= */

        .newsletter-success {
          display: flex;

          flex-direction: column;

          align-items: flex-start;
        }

        .success-mark {
          width: 44px;
          height: 44px;

          display: flex;

          align-items: center;
          justify-content: center;

          margin-bottom: 25px;

          border:
            1px solid
            #bdb4a7;

          border-radius: 50%;

          color: #29251f;

          font-size: 18px;
        }

        .newsletter-success
        .newsletter-description {
          margin-bottom: 30px;
        }

        .newsletter-continue {
          max-width: 240px;
        }

        /* =========================================
           ANIMATIONS
        ========================================= */

        @keyframes newsletterFade {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes newsletterEnter {
          from {
            opacity: 0;

            transform:
              translateY(20px)
              scale(0.97);
          }

          to {
            opacity: 1;

            transform:
              translateY(0)
              scale(1);
          }
        }

        /* =========================================
           MOBILE
        ========================================= */

        @media (max-width: 700px) {

          .newsletter-overlay {
            padding: 14px;

            align-items: center;
          }

          .newsletter-modal {
            display: flex;

            flex-direction: column;

            width: 100%;

            max-height:
              calc(
                100vh - 28px
              );

            overflow-y: auto;
          }

          .newsletter-artwork {
            min-height: 220px;

            height: 36vh;

            max-height: 300px;
          }

          .newsletter-artwork-svg {
            min-height: 220px;

            height: 100%;
          }

          .newsletter-artwork-label {
            left: 20px;

            bottom: 18px;

            font-size: 9px;
          }

          .newsletter-content {
            padding:
              38px
              24px
              30px;
          }

          .newsletter-eyebrow {
            margin-bottom: 16px;

            font-size: 9px;
          }

          .newsletter-content h2 {
            font-size: 42px;
          }

          .newsletter-description {
            margin:
              20px
              0
              24px;

            font-size: 13px;

            line-height: 1.7;
          }

          .newsletter-input-wrap input,
          .newsletter-form button {
            height: 52px;
          }

          .newsletter-close {
            top: 12px;

            right: 12px;

            width: 34px;

            height: 34px;

            background:
              rgba(
                245,
                240,
                232,
                0.9
              );
          }
        }

        /* =========================================
           SMALL PHONES
        ========================================= */

        @media (max-width: 380px) {

          .newsletter-artwork {
            min-height: 180px;

            height: 28vh;
          }

          .newsletter-artwork-svg {
            min-height: 180px;
          }

          .newsletter-content {
            padding:
              32px
              20px
              25px;
          }

          .newsletter-content h2 {
            font-size: 37px;
          }
        }

        /* =========================================
           REDUCED MOTION
        ========================================= */

        @media (prefers-reduced-motion: reduce) {

          .newsletter-overlay,
          .newsletter-modal {
            animation: none;
          }

          .newsletter-form button,
          .newsletter-continue {
            transition: none;
          }
        }

      `}</style>
    </div>
  );
}
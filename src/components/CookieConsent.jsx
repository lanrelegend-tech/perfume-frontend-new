"use client";

import { useEffect, useState } from "react";

const COOKIE_CONSENT_KEY =
  "orentemist_cookie_consent";

const DEFAULT_PREFERENCES = {
  necessary: true,
  analytics: false,
  preferences: false,
};

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [preferences, setPreferences] = useState(
    DEFAULT_PREFERENCES
  );

  useEffect(() => {
    setMounted(true);

    const savedConsent = localStorage.getItem(
      COOKIE_CONSENT_KEY
    );

    if (!savedConsent) {
      setShowBanner(true);
      return;
    }

    try {
      const parsedConsent =
        JSON.parse(savedConsent);

      if (parsedConsent?.preferences) {
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...parsedConsent.preferences,
        });
      }
    } catch {
      localStorage.removeItem(
        COOKIE_CONSENT_KEY
      );

      setShowBanner(true);
    }
  }, []);

  const saveConsent = (selectedPreferences) => {
    const consentData = {
      version: 1,
      preferences: selectedPreferences,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify(consentData)
    );

    setPreferences(selectedPreferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      preferences: true,
    });
  };

  const rejectNonEssential = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      preferences: false,
    });
  };

  const saveSelected = () => {
    saveConsent({
      necessary: true,
      analytics: preferences.analytics,
      preferences: preferences.preferences,
    });
  };

  const togglePreference = (type) => {
    setPreferences((current) => ({
      ...current,
      [type]: !current[type],
    }));
  };

  if (!mounted || !showBanner) {
    return null;
  }

  return (
    <>
      <div
        className="cookie-overlay"
        aria-hidden={!showSettings}
      />

      <section
        className="cookie-banner"
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookie-title"
      >
        {!showSettings ? (
          <div className="cookie-main">

            <div className="cookie-copy">
              <p className="cookie-eyebrow">
                YOUR PRIVACY MATTERS
              </p>

              <h2 id="cookie-title">
                A better experience,
                <br />
                with your permission.
              </h2>

              <p className="cookie-description">
                We use essential cookies to keep
                ORENTEMIST working properly. With
                your permission, we may also use
                optional cookies to remember your
                preferences and understand how our
                website is used.
              </p>

              <a
                href="/privacy-policy"
                className="cookie-policy-link"
              >
                Read our Privacy Policy
                <span>↗</span>
              </a>
            </div>

            <div className="cookie-actions">
              <button
                type="button"
                className="cookie-button cookie-button-primary"
                onClick={acceptAll}
              >
                ACCEPT ALL
              </button>

              <button
                type="button"
                className="cookie-button cookie-button-secondary"
                onClick={rejectNonEssential}
              >
                REJECT OPTIONAL
              </button>

              <button
                type="button"
                className="cookie-settings-button"
                onClick={() =>
                  setShowSettings(true)
                }
              >
                COOKIE SETTINGS
              </button>
            </div>
          </div>
        ) : (
          <div className="cookie-settings">

            <div className="cookie-settings-header">
              <div>
                <p className="cookie-eyebrow">
                  COOKIE SETTINGS
                </p>

                <h2>
                  Choose what
                  <br />
                  you&apos;re comfortable with.
                </h2>
              </div>

              <button
                type="button"
                className="cookie-close"
                onClick={() =>
                  setShowSettings(false)
                }
                aria-label="Close cookie settings"
              >
                <span />
                <span />
              </button>
            </div>

            <div className="cookie-options">

              {/* Necessary */}
              <div className="cookie-option">
                <div className="cookie-option-copy">
                  <h3>
                    Essential
                  </h3>

                  <p>
                    Required for the website to
                    function properly, including
                    security, checkout and your
                    cookie preferences.
                  </p>
                </div>

                <div
                  className="cookie-toggle cookie-toggle-locked"
                  aria-label="Essential cookies are always enabled"
                  aria-disabled="true"
                >
                  <span />
                </div>
              </div>

              {/* Analytics */}
              <div className="cookie-option">
                <div className="cookie-option-copy">
                  <h3>
                    Analytics
                  </h3>

                  <p>
                    Helps us understand how visitors
                    use ORENTEMIST so we can improve
                    the shopping experience.
                  </p>
                </div>

                <button
                  type="button"
                  className={`cookie-toggle ${
                    preferences.analytics
                      ? "cookie-toggle-active"
                      : ""
                  }`}
                  onClick={() =>
                    togglePreference(
                      "analytics"
                    )
                  }
                  aria-label={`${
                    preferences.analytics
                      ? "Disable"
                      : "Enable"
                  } analytics cookies`}
                  aria-pressed={
                    preferences.analytics
                  }
                >
                  <span />
                </button>
              </div>

              {/* Preferences */}
              <div className="cookie-option">
                <div className="cookie-option-copy">
                  <h3>
                    Preferences
                  </h3>

                  <p>
                    Allows us to remember choices
                    such as preferences that make
                    your next visit more convenient.
                  </p>
                </div>

                <button
                  type="button"
                  className={`cookie-toggle ${
                    preferences.preferences
                      ? "cookie-toggle-active"
                      : ""
                  }`}
                  onClick={() =>
                    togglePreference(
                      "preferences"
                    )
                  }
                  aria-label={`${
                    preferences.preferences
                      ? "Disable"
                      : "Enable"
                  } preference cookies`}
                  aria-pressed={
                    preferences.preferences
                  }
                >
                  <span />
                </button>
              </div>

            </div>

            <div className="cookie-settings-footer">
              <button
                type="button"
                className="cookie-back-button"
                onClick={() =>
                  setShowSettings(false)
                }
              >
                ← BACK
              </button>

              <button
                type="button"
                className="cookie-save-button"
                onClick={saveSelected}
              >
                SAVE MY CHOICES
              </button>
            </div>
          </div>
        )}
      </section>

      <style jsx>{`
        /* =========================================
           OVERLAY
        ========================================= */

        .cookie-overlay {
          position: fixed;
          inset: 0;
          z-index: 99990;

          pointer-events: none;

          background:
            rgba(20, 17, 13, 0.08);
        }

        /* =========================================
           MAIN BANNER
        ========================================= */

        .cookie-banner {
          position: fixed;

          left: 24px;
          right: 24px;
          bottom: 24px;

          z-index: 99991;

          width: min(
            1120px,
            calc(100% - 48px)
          );

          margin: 0 auto;

          background: #f5f0e8;

          border:
            1px solid
            rgba(43, 37, 30, 0.12);

          box-shadow:
            0 25px 70px
              rgba(0, 0, 0, 0.18),
            0 8px 25px
              rgba(0, 0, 0, 0.08);

          color: #171512;

          animation:
            cookieEnter
            0.45s
            cubic-bezier(
              0.16,
              1,
              0.3,
              1
            )
            forwards;
        }

        .cookie-main {
          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            280px;

          gap: 60px;

          padding:
            34px
            38px;
        }

        /* =========================================
           TEXT
        ========================================= */

        .cookie-copy {
          min-width: 0;
        }

        .cookie-eyebrow {
          margin:
            0
            0
            12px;

          color: #766e64;

          font-size: 9px;

          line-height: 1.4;

          letter-spacing:
            0.22em;

          font-weight: 600;
        }

        .cookie-copy h2,
        .cookie-settings h2 {
          margin: 0;

          color: #161411;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size: 31px;

          line-height: 1.04;

          letter-spacing:
            -0.035em;

          font-weight: 400;
        }

        .cookie-description {
          max-width: 650px;

          margin:
            15px
            0
            13px;

          color: #625c54;

          font-size: 12px;

          line-height: 1.7;
        }

        .cookie-policy-link {
          display: inline-flex;

          align-items: center;

          gap: 7px;

          color: #25221e;

          font-size: 10px;

          letter-spacing:
            0.06em;

          text-decoration:
            underline;

          text-underline-offset:
            3px;
        }

        .cookie-policy-link span {
          font-size: 12px;

          text-decoration: none;
        }

        /* =========================================
           ACTIONS
        ========================================= */

        .cookie-actions {
          display: flex;

          flex-direction: column;

          justify-content: center;

          gap: 9px;
        }

        .cookie-button {
          width: 100%;

          min-height: 45px;

          border: 0;

          border-radius: 0;

          cursor: pointer;

          font-size: 9px;

          font-weight: 600;

          letter-spacing:
            0.17em;

          transition:
            background
            0.2s
            ease,
            transform
            0.2s
            ease;
        }

        .cookie-button:hover,
        .cookie-save-button:hover {
          transform:
            translateY(-1px);
        }

        .cookie-button-primary {
          background: #171512;

          color: #fff;
        }

        .cookie-button-primary:hover {
          background: #302c27;
        }

        .cookie-button-secondary {
          border:
            1px solid
            #c9c0b4;

          background: transparent;

          color: #27231f;
        }

        .cookie-button-secondary:hover {
          background: #ebe5dc;
        }

        .cookie-settings-button {
          padding:
            8px
            0;

          border: 0;

          background: transparent;

          color: #706960;

          cursor: pointer;

          font-size: 9px;

          font-weight: 600;

          letter-spacing:
            0.15em;

          text-decoration:
            underline;

          text-underline-offset:
            3px;
        }

        /* =========================================
           SETTINGS
        ========================================= */

        .cookie-settings {
          padding:
            30px
            38px
            25px;
        }

        .cookie-settings-header {
          display: flex;

          align-items: flex-start;

          justify-content:
            space-between;

          gap: 30px;

          margin-bottom: 24px;
        }

        .cookie-close {
          flex-shrink: 0;

          width: 34px;
          height: 34px;

          display: flex;

          align-items: center;
          justify-content: center;

          border:
            1px solid
            #d1c8bb;

          border-radius: 50%;

          background: transparent;

          cursor: pointer;
        }

        .cookie-close span {
          position: absolute;

          width: 12px;

          height: 1px;

          background: #29251f;
        }

        .cookie-close span:first-child {
          transform:
            rotate(45deg);
        }

        .cookie-close span:last-child {
          transform:
            rotate(-45deg);
        }

        .cookie-options {
          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          border-top:
            1px solid
            #d9d0c4;

          border-bottom:
            1px solid
            #d9d0c4;
        }

        .cookie-option {
          display: flex;

          justify-content:
            space-between;

          gap: 20px;

          min-height: 130px;

          padding:
            22px
            20px;
        }

        .cookie-option + .cookie-option {
          border-left:
            1px solid
            #d9d0c4;
        }

        .cookie-option-copy h3 {
          margin:
            0
            0
            7px;

          color: #211e1a;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size: 17px;

          font-weight: 400;
        }

        .cookie-option-copy p {
          margin: 0;

          max-width: 230px;

          color: #716a62;

          font-size: 10px;

          line-height: 1.65;
        }

        /* =========================================
           TOGGLE
        ========================================= */

        .cookie-toggle {
          position: relative;

          flex-shrink: 0;

          width: 42px;
          height: 23px;

          padding: 0;

          border: 0;

          border-radius: 50px;

          background: #c8c0b5;

          cursor: pointer;

          transition:
            background
            0.2s
            ease;
        }

        .cookie-toggle span {
          position: absolute;

          top: 3px;
          left: 3px;

          width: 17px;
          height: 17px;

          border-radius: 50%;

          background: #fff;

          box-shadow:
            0 1px 3px
              rgba(0, 0, 0, 0.18);

          transition:
            transform
            0.2s
            ease;
        }

        .cookie-toggle-active {
          background: #171512;
        }

        .cookie-toggle-active span {
          transform:
            translateX(19px);
        }

        .cookie-toggle-locked {
          background: #171512;

          cursor: default;
        }

        .cookie-toggle-locked span {
          transform:
            translateX(19px);
        }

        /* =========================================
           SETTINGS FOOTER
        ========================================= */

        .cookie-settings-footer {
          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 20px;

          padding-top: 20px;
        }

        .cookie-back-button {
          border: 0;

          background: transparent;

          color: #6e675f;

          cursor: pointer;

          font-size: 9px;

          font-weight: 600;

          letter-spacing:
            0.15em;
        }

        .cookie-save-button {
          min-width: 190px;

          min-height: 45px;

          border: 0;

          background: #171512;

          color: #fff;

          cursor: pointer;

          font-size: 9px;

          font-weight: 600;

          letter-spacing:
            0.17em;

          transition:
            transform
            0.2s
            ease,
            background
            0.2s
            ease;
        }

        .cookie-save-button:hover {
          background: #302c27;
        }

        /* =========================================
           ANIMATION
        ========================================= */

        @keyframes cookieEnter {
          from {
            opacity: 0;

            transform:
              translateY(25px);
          }

          to {
            opacity: 1;

            transform:
              translateY(0);
          }
        }

        /* =========================================
           MOBILE
        ========================================= */

        @media (max-width: 760px) {
          .cookie-banner {
            left: 12px;
            right: 12px;
            bottom: 12px;

            width:
              calc(
                100% - 24px
              );

            max-height:
              calc(
                100vh - 24px
              );

            overflow-y: auto;
          }

          .cookie-main {
            display: flex;

            flex-direction: column;

            gap: 22px;

            padding:
              25px
              22px
              22px;
          }

          .cookie-copy h2,
          .cookie-settings h2 {
            font-size: 27px;
          }

          .cookie-description {
            font-size: 11px;

            line-height: 1.65;
          }

          .cookie-actions {
            gap: 8px;
          }

          .cookie-button {
            min-height: 46px;
          }

          .cookie-settings {
            padding:
              24px
              20px
              20px;
          }

          .cookie-options {
            display: flex;

            flex-direction: column;
          }

          .cookie-option {
            min-height: auto;

            padding:
              19px
              0;
          }

          .cookie-option
          + .cookie-option {
            border-left: 0;

            border-top:
              1px solid
              #d9d0c4;
          }

          .cookie-option-copy p {
            max-width:
              calc(
                100vw - 125px
              );
          }

          .cookie-settings-footer {
            align-items:
              stretch;

            flex-direction: column-reverse;

            gap: 12px;
          }

          .cookie-save-button {
            width: 100%;
          }

          .cookie-back-button {
            padding: 8px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cookie-banner,
          .cookie-toggle,
          .cookie-toggle span,
          .cookie-button,
          .cookie-save-button {
            animation: none;

            transition: none;
          }
        }
      `}</style>
    </>
  );
}
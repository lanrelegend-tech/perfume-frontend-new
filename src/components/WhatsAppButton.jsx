"use client";

import { useState } from "react";

const WHATSAPP_NUMBER = "2347045895896";

const DEFAULT_MESSAGE =
  "Hi ORENTEMIST, I’d like some help with my order.";

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    DEFAULT_MESSAGE
  )}`;

  return (
    <div className="whatsapp-wrapper">
      {open && (
        <div className="whatsapp-card">
          <div className="whatsapp-card-header">
            <div>
              <p className="whatsapp-eyebrow">
                ORENTEMIST
              </p>

              <h3>
                How can we
                <br />
                help you?
              </h3>
            </div>

            <button
              type="button"
              className="whatsapp-close"
              onClick={() => setOpen(false)}
              aria-label="Close WhatsApp chat"
            >
              ×
            </button>
          </div>

          <p className="whatsapp-description">
            Have a question about a fragrance,
            your order, delivery, or anything
            else? Chat with us on WhatsApp.
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-start"
          >
            <span>CHAT WITH US</span>
            <span className="whatsapp-arrow">↗</span>
          </a>

          <p className="whatsapp-response">
            We&apos;ll get back to you as soon as
            possible.
          </p>
        </div>
      )}

      <button
        type="button"
        className={`whatsapp-button ${
          open ? "whatsapp-button-open" : ""
        }`}
        onClick={() => setOpen((current) => !current)}
        aria-label={
          open
            ? "Close WhatsApp chat"
            : "Open WhatsApp chat"
        }
        aria-expanded={open}
      >
        <span className="whatsapp-icon">
          <svg
            viewBox="0 0 32 32"
            aria-hidden="true"
          >
            <path
              d="M16 3.5C9.1 3.5 3.5 9 3.5 15.8c0 2.2.6 4.3 1.7 6.1L3.4 28.5l6.8-1.8c1.8 1 3.8 1.5 5.8 1.5 6.9 0 12.5-5.5 12.5-12.4S22.9 3.5 16 3.5Zm0 22.4c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-4 .1 1.1-3.8-.3-.4c-1-1.6-1.5-3.3-1.5-5.2C5.8 9.5 10.4 5 16 5s10.2 4.5 10.2 10.1S21.6 25.9 16 25.9Zm5.6-7.6c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.5-.7-2.5-1.3-3.5-2.9-.3-.5.3-.5.8-1.7.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.3 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.8.6.8.3 1.5.2 2.1.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.1-1.4-.1-.2-.3-.3-.6-.4Z"
              fill="currentColor"
            />
          </svg>
        </span>

        <span className="whatsapp-label">
          WHATSAPP
        </span>
      </button>

      <style jsx>{`
        .whatsapp-wrapper {
          position: fixed;

          right: 24px;
          bottom: 24px;

          z-index: 99980;

          display: flex;
          flex-direction: column;
          align-items: flex-end;

          gap: 12px;

          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        /* ================================
           CHAT CARD
        ================================= */

        .whatsapp-card {
          width: 320px;

          padding: 24px;

          background: #f5f0e8;

          border:
            1px solid
            rgba(43, 37, 30, 0.12);

          box-shadow:
            0 24px 60px
              rgba(0, 0, 0, 0.18),
            0 5px 20px
              rgba(0, 0, 0, 0.08);

          color: #171512;

          animation:
            whatsappCardEnter
            0.3s
            cubic-bezier(
              0.16,
              1,
              0.3,
              1
            );
        }

        .whatsapp-card-header {
          display: flex;

          align-items: flex-start;
          justify-content: space-between;

          gap: 20px;
        }

        .whatsapp-eyebrow {
          margin: 0 0 8px;

          color: #766e64;

          font-size: 8px;

          font-weight: 600;

          letter-spacing:
            0.22em;
        }

        .whatsapp-card h3 {
          margin: 0;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size: 26px;

          line-height: 1.05;

          font-weight: 400;

          letter-spacing:
            -0.03em;
        }

        .whatsapp-close {
          width: 30px;
          height: 30px;

          flex-shrink: 0;

          border:
            1px solid
            #d2c8bb;

          border-radius: 50%;

          background: transparent;

          color: #4e4841;

          cursor: pointer;

          font-size: 19px;

          line-height: 1;

          display: flex;

          align-items: center;
          justify-content: center;

          transition:
            background 0.2s ease,
            color 0.2s ease;
        }

        .whatsapp-close:hover {
          background: #171512;

          color: #fff;
        }

        .whatsapp-description {
          margin:
            18px
            0
            20px;

          color: #6b645c;

          font-size: 11px;

          line-height: 1.7;
        }

        .whatsapp-start {
          display: flex;

          align-items: center;
          justify-content: space-between;

          min-height: 48px;

          padding:
            0
            16px;

          background: #171512;

          color: #fff;

          text-decoration: none;

          font-size: 9px;

          font-weight: 600;

          letter-spacing:
            0.17em;

          transition:
            background 0.2s ease,
            transform 0.2s ease;
        }

        .whatsapp-start:hover {
          background: #302c27;

          transform:
            translateY(-1px);
        }

        .whatsapp-arrow {
          font-size: 15px;

          font-weight: 400;
        }

        .whatsapp-response {
          margin:
            12px
            0
            0;

          color: #938a80;

          font-size: 9px;

          line-height: 1.5;

          text-align: center;
        }

        /* ================================
           FLOATING BUTTON
        ================================= */

        .whatsapp-button {
          display: flex;

          align-items: center;

          gap: 10px;

          height: 52px;

          padding:
            0
            17px;

          border: 1px solid
            rgba(255, 255, 255, 0.14);

          border-radius: 999px;

          background: #171512;

          color: #fff;

          cursor: pointer;

          box-shadow:
            0 12px 35px
              rgba(0, 0, 0, 0.2);

          transition:
            transform 0.25s ease,
            background 0.25s ease,
            box-shadow 0.25s ease;
        }

        .whatsapp-button:hover {
          transform:
            translateY(-3px);

          background: #27231f;

          box-shadow:
            0 16px 42px
              rgba(0, 0, 0, 0.25);
        }

        .whatsapp-button-open {
          background: #27231f;
        }

        .whatsapp-icon {
          width: 23px;
          height: 23px;

          display: flex;

          align-items: center;
          justify-content: center;
        }

        .whatsapp-icon svg {
          width: 100%;
          height: 100%;
        }

        .whatsapp-label {
          font-size: 9px;

          font-weight: 600;

          letter-spacing:
            0.15em;
        }

        /* ================================
           ANIMATION
        ================================= */

        @keyframes whatsappCardEnter {
          from {
            opacity: 0;

            transform:
              translateY(12px)
              scale(0.98);
          }

          to {
            opacity: 1;

            transform:
              translateY(0)
              scale(1);
          }
        }

        /* ================================
           MOBILE
        ================================= */

        @media (max-width: 600px) {
          .whatsapp-wrapper {
            right: 14px;
            bottom: 14px;

            gap: 10px;
          }

          .whatsapp-card {
            width:
              calc(
                100vw - 28px
              );

            max-width: 340px;

            padding: 22px;
          }

          .whatsapp-card h3 {
            font-size: 24px;
          }

          .whatsapp-button {
            width: 52px;
            height: 52px;

            padding: 0;

            justify-content: center;
          }

          .whatsapp-label {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .whatsapp-card,
          .whatsapp-button,
          .whatsapp-start {
            animation: none;

            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
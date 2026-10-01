"use client";

const WHATSAPP_NUMBER = "2347045895896";

const DEFAULT_MESSAGE =
  "Hi ORENTEMIST, I’d like some help with my order.";

export default function WhatsAppButton() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    DEFAULT_MESSAGE
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-button"
      aria-label="Chat with ORENTEMIST on WhatsApp"
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <path
          d="M16 3.5C9.1 3.5 3.5 9 3.5 15.8c0 2.2.6 4.3 1.7 6.1L3.4 28.5l6.8-1.8c1.8 1 3.8 1.5 5.8 1.5 6.9 0 12.5-5.5 12.5-12.4S22.9 3.5 16 3.5Zm0 22.4c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-4 .1 1.1-3.8-.3-.4c-1-1.6-1.5-3.3-1.5-5.2C5.8 9.5 10.4 5 16 5s10.2 4.5 10.2 10.1S21.6 25.9 16 25.9Zm5.6-7.6c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.5-.7-2.5-1.3-3.5-2.9-.3-.5.3-.5.8-1.7.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.3 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.8.6.8.3 1.5.2 2.1.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.1-1.4-.1-.2-.3-.3-.6-.4Z"
          fill="currentColor"
        />
      </svg>

      <span className="whatsapp-tooltip">
        Chat with us
      </span>

      <style jsx>{`
        .whatsapp-button {
          position: fixed;

          right: 24px;
          bottom: 24px;

          z-index: 99980;

          width: 58px;
          height: 58px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #171512;

          color: #ffffff;

          text-decoration: none;

          box-shadow:
            0 12px 35px
              rgba(0, 0, 0, 0.22);

          transition:
            transform 0.25s ease,
            background 0.25s ease,
            box-shadow 0.25s ease;
        }

        .whatsapp-button svg {
          width: 29px;
          height: 29px;
        }

        .whatsapp-button:hover {
          transform: translateY(-4px);

          background: #27231f;

          box-shadow:
            0 17px 42px
              rgba(0, 0, 0, 0.28);
        }

        .whatsapp-tooltip {
          position: absolute;

          right: 70px;

          top: 50%;

          transform:
            translateY(-50%)
            translateX(5px);

          padding:
            9px
            13px;

          white-space: nowrap;

          background: #171512;

          color: #ffffff;

          font-size: 9px;

          font-weight: 600;

          letter-spacing:
            0.12em;

          text-transform: uppercase;

          opacity: 0;

          pointer-events: none;

          transition:
            opacity 0.2s ease,
            transform 0.2s ease;
        }

        .whatsapp-button:hover
          .whatsapp-tooltip {
          opacity: 1;

          transform:
            translateY(-50%)
            translateX(0);
        }

        @media (max-width: 600px) {
          .whatsapp-button {
            right: 15px;
            bottom: 15px;

            width: 54px;
            height: 54px;
          }

          .whatsapp-button svg {
            width: 27px;
            height: 27px;
          }

          .whatsapp-tooltip {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .whatsapp-button,
          .whatsapp-tooltip {
            transition: none;
          }
        }
      `}</style>
    </a>
  );
}
"use client";

import { useFormStatus } from "react-dom";

export default function ConfirmButton({
  children,
  message,
  className,
}: {
  children: React.ReactNode;
  message?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (message && !window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? "Bitte warten …" : children}
    </button>
  );
}

import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";
import { useEffect } from "react";

export function AuthLayout() {
  useEffect(() => {
    // Debug any invisible overlays
    const debugOverlays = () => {
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'absolute') {
          console.log('Found positioned element:', {
            element: el,
            zIndex: style.zIndex,
            position: style.position,
            className: el.className
          });
        }
      });
    };

    // Run debug on mount
    debugOverlays();

    // Remove any click blockers
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        pointer-events: auto !important;
      }
      [role="combobox"],
      [role="listbox"],
      [role="option"],
      button,
      a,
      select,
      input {
        pointer-events: auto !important;
        cursor: pointer !important;
      }
      .pointer-events-none {
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="relative">
        <Outlet />
      </main>
    </div>
  );
} 
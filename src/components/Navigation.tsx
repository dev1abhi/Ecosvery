import { useState } from "react";
import { Menu, X } from "lucide-react";

interface NavigationProps {
  isMobile?: boolean;
  onItemClick: (label: string, bgColor: string) => void;
}

export default function Navigation({
  isMobile = false,
  onItemClick,
}: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navItems = [
    {
      label: "CONSERVATION",
      buttonText: "CONSERVATION EFFORTS",
      bgColor: "bg-[#66CC66]",
      size: "small",
      position: "top-0 left-28",
    },
    {
      label: "IUCN STATUS",
      buttonText: "IUCN STATUS",
      bgColor: "bg-[#66CC66]",
      size: "small",
      position: "top-8 left-8",
    },
    {
      label: "STREAM",
      buttonText: "VIDEOS",
      bgColor: "bg-[#66CC66]",
      size: "small",
      position: "top-28 left-4",
    },
    {
      label: "ABOUT",
      buttonText: "ABOUT THE SPECIE",
      bgColor: "bg-[#66CC66]",
      size: "small",
      position: "top-48 left-16",
    },
    {
      label: "IUCN BOOK",
      buttonText: "IUCN BOOK",
      bgColor: "bg-[#66CC66]",
      size: "large",
      position: "top-20 left-24",
    },
  ];

  if (isMobile) {
    return (
      <>
        {/* Floating Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="fixed bottom-8 right-8 z-30 bg-[#66CC66] border-4 border-black rounded-full w-12 h-12 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
          aria-label="Menu"
        >
          {isMenuOpen ? (
            <X className="w-8 h-8 text-black" />
          ) : (
            <Menu className="w-8 h-8 text-black" />
          )}
        </button>

        {/* Expandable Menu */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-20"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Items in a radial layout */}
            <div className="fixed bottom-6 right-6 z-40">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onItemClick(item.label, item.bgColor);
                    setIsMenuOpen(false);
                  }}
                  className={`${item.bgColor} absolute border-3 border-black px-4 py-2 text-xs font-bold text-black hover:scale-105 transition-all shadow-xl rounded-full whitespace-nowrap`}
                  style={{
                    bottom: `${80 + index * 60}px`,
                    right: "0px",
                    animation: `slideIn 0.3s ease-out ${index * 0.05}s both`,
                  }}
                >
                  {item.buttonText}
                </button>
              ))}
            </div>
          </>
        )}

        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <nav className="fixed right-8 top-1/2 -translate-y-1/2 z-20">
      <div className="relative w-64 h-72">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => onItemClick(item.label, item.bgColor)}
            className={`${item.bgColor} ${
              item.position
            } absolute border-2 border-black font-bold text-black hover:scale-110 transition-transform shadow-lg rounded-full flex items-center justify-center text-center leading-tight
              ${
                item.size === "large"
                  ? "w-32 h-32 text-xs p-4"
                  : "w-20 h-20 text-[10px] p-2"
              }`}
          >
            <span className="break-words">{item.buttonText}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

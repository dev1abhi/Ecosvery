import { Species } from "../services/iucnApi";

interface HeaderProps {
  className?: string;
  selectedSpecies?: Species | null;
}

export default function Header({
  className = "",
  selectedSpecies,
}: HeaderProps) {
  return (
    <div className={`absolute top-4 left-4 z-10 ${className}`}>
      <div className="bg-[#90EE90] px-4 py-2 border-4 border-black rounded-xl">
        {selectedSpecies ? (
          <div>
            <h1 className="text-lg md:text-3xl font-bold text-black tracking-tight">
              {selectedSpecies.main_common_name ||
                selectedSpecies.scientific_name}
            </h1>
            {selectedSpecies.main_common_name && (
              <p className="text-xs md:text-sm italic text-gray-700">
                {selectedSpecies.scientific_name}
              </p>
            )}
          </div>
        ) : (
          <h1 className="text-lg md:text-3xl font-bold text-black tracking-tight">
            Welcome to Ecosvery!
          </h1>
        )}
      </div>
    </div>
  );
}

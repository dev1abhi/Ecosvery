import { useState } from "react";
import { X } from "lucide-react";
import SpeciesList from "./SpeciesList";
import SpeciesDetailView from "./SpeciesDetailView";
import { Species } from "../services/iucnApi";

interface CollapsibleBoxProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  bgColor: string;
  content?: React.ReactNode;
  onVideoSelect?: (videoId: string) => void;
  onSpeciesSelect?: (species: Species) => void;
}

export default function CollapsibleBox({
  isOpen,
  onClose,
  title,
  bgColor,
  content,
  onVideoSelect,
  onSpeciesSelect,
}: CollapsibleBoxProps) {
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);

  const handleSelectSpecies = (species: Species) => {
    setSelectedSpecies(species);
    if (onSpeciesSelect) {
      onSpeciesSelect(species);
    }
    onClose(); // Close the box after selecting species
  };

  const handleClose = () => {
    // Don't clear selected species when closing
    onClose();
  };

  const contentByTitle: Record<string, React.ReactNode> = {
    ABOUT: (
      <div className="space-y-4">
        <p className="text-base leading-relaxed">
          This website is designed to educate users about the vast diversity of
          species listed in the IUCN Red List, providing accessible information
          on their characteristics, habitats, and conservation status.
        </p>
        <p className="text-base leading-relaxed">
          It serves as an interactive gallery where users can explore detailed
          species data, watch educational videos, and understand the global
          efforts dedicated to protecting endangered wildlife.
        </p>
        <p className="text-sm italic">
          Click a species in the IUCN Book to fill this information box.
        </p>
      </div>
    ),
    "IUCN STATUS": (
      <div className="space-y-4">
        <p className="text-base leading-relaxed">
          The IUCN Red List classifies species based on their risk of
          extinction, serving as a critical indicator of global biodiversity
          health.
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-red-600 border border-black rounded"></div>
            <span className="font-semibold">Critically Endangered</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-orange-500 border border-black rounded"></div>
            <span className="font-semibold">Endangered</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-yellow-500 border border-black rounded"></div>
            <span className="font-semibold">Vulnerable</span>
          </div>
        </div>
        <p className="text-sm italic">
          Click a species in the IUCN Book to fill this information box.
        </p>
      </div>
    ),
    STREAM: (
      <div className="space-y-4">
        <p className="text-base leading-relaxed">
          This section displays YouTube videos related to the selected species,
          providing educational and visual insights about its habitat, behavior,
          and conservation status.
        </p>
        <p className="text-base leading-relaxed">
          Videos may include documentaries, awareness campaigns, and field
          recordings that help understand the species’ ecological significance
          and the threats it faces.
        </p>
        <p className="text-sm italic">
          Click a species in the IUCN Book to fill this information box.
        </p>
      </div>
    ),
    CONSERVATION: (
      <div className="space-y-4">
        <p className="text-base leading-relaxed">
          IUCN leads global conservation initiatives focused on protecting
          ecosystems, restoring habitats, and supporting sustainable practices.
        </p>
        <ul className="list-disc list-inside space-y-2 text-base">
          <li>Species protection and recovery projects</li>
          <li>Habitat and ecosystem restoration</li>
          <li>Community-led conservation efforts</li>
          <li>Policy research and environmental advocacy</li>
        </ul>
        <p className="text-sm italic">
          Click a species in the IUCN Book to fill this information box.
        </p>
      </div>
    ),
    "IUCN BOOK": selectedSpecies ? (
      <SpeciesDetailView species={selectedSpecies} activeTab="about" />
    ) : (
      <SpeciesList onSelectSpecies={handleSelectSpecies} />
    ),
  };

  // Determine which tab is active based on title when species is selected
  const getActiveTab = (): "about" | "status" | "conservation" | "stream" => {
    if (title === "ABOUT") return "about";
    if (title === "IUCN STATUS") return "status";
    if (title === "CONSERVATION") return "conservation";
    if (title === "STREAM") return "stream";
    return "about";
  };

  // Generate dynamic content for species-aware tabs
  const getDynamicContent = () => {
    
    // If IUCN BOOK is clicked, ALWAYS show the list (regardless of selected species)
    if (title === "IUCN BOOK") {
      return <SpeciesList onSelectSpecies={handleSelectSpecies} />;
    }

    // If any other button is clicked and a species is selected, show species details
    if (
      selectedSpecies &&
      (title === "ABOUT" ||
        title === "IUCN STATUS" ||
        title === "CONSERVATION" ||
        title === "STREAM")
    ) {
      return (
        <SpeciesDetailView
          species={selectedSpecies}
          activeTab={getActiveTab()}
          onVideoSelect={onVideoSelect}
        />
      );
    }

    // Otherwise show default content
    return content || contentByTitle[title];
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-30 ${
          isOpen ? "opacity-50" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[500px] ${bgColor} border-l-8 border-black shadow-2xl transform transition-transform duration-300 ease-in-out z-40 md:rounded-l-3xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col p-6 md:p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="pr-4">
              <h2 className="text-2xl md:text-3xl font-bold text-black">
                {title}
              </h2>
              {selectedSpecies && title !== "IUCN BOOK" && (
                <p className="text-sm italic text-gray-700 mt-1">
                  {selectedSpecies.scientific_name}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="bg-white border-2 border-black p-2 hover:scale-110 transition-transform flex-shrink-0 rounded-lg"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-black" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="text-black h-full">
              {getDynamicContent() || (
                <p className="text-base leading-relaxed">
                  Information about {title}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

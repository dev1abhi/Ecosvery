import { useState, useEffect } from "react";
import { Search, Loader2, ChevronRight, AlertCircle } from "lucide-react";
import { getSpeciesByPage, Species } from "../services/iucnApi";
import { ApiError } from "../utils/apiHelpers";

interface SpeciesListProps {
  onSelectSpecies: (species: Species) => void;
}

export default function SpeciesList({ onSelectSpecies }: SpeciesListProps) {
  // Initialize state from sessionStorage if available
  const [species, setSpecies] = useState<Species[]>(() => {
    const saved = sessionStorage.getItem("iucn_species_list");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(() => {
    const saved = sessionStorage.getItem("iucn_species_list");
    return !saved; // Only show loading if no cached data
  });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem("iucn_current_page");
    return saved ? parseInt(saved, 10) : 1;
  });

  useEffect(() => {
    const loadSpecies = async () => {
      // Always update the current page in sessionStorage
      sessionStorage.setItem("iucn_current_page", currentPage.toString());

      // Check if we already have this page cached
      const cacheKey = `iucn_page_${currentPage}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        // Use cached data
        const cachedData = JSON.parse(cached);
        setSpecies(cachedData);
        sessionStorage.setItem("iucn_species_list", JSON.stringify(cachedData));
        setLoading(false);
        setError(null);
        return;
      }

      // Fetch from API if not cached
      setLoading(true);
      setError(null);

      try {
        const data = await getSpeciesByPage(currentPage);

        // Remove duplicates based on taxonid
        const uniqueSpecies = data.filter(
          (species, index, self) =>
            index === self.findIndex((s) => s.taxonid === species.taxonid)
        );

        setSpecies(uniqueSpecies);

        // Cache the data
        sessionStorage.setItem(cacheKey, JSON.stringify(uniqueSpecies));
        sessionStorage.setItem(
          "iucn_species_list",
          JSON.stringify(uniqueSpecies)
        );
      } catch (err) {
        console.error("Failed to load species:", err);

        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load species. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadSpecies();
  }, [currentPage]);

  const filteredSpecies = species.filter(
    (s) =>
      s.main_common_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.scientific_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-4 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search species..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#66CC66]"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1">
          <Loader2 className="w-16 h-16 animate-spin text-black mb-4" />
          <p className="text-base font-semibold text-black">
            Loading species...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center flex-1 px-4">
          <AlertCircle className="w-16 h-16 text-red-600 mb-4" />
          <p className="text-base font-semibold text-black mb-2">
            Failed to load species
          </p>
          <p className="text-sm text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-black text-white border-2 border-black rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Reload Page
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2 overflow-y-auto flex-1">
            {filteredSpecies.length > 0 ? (
              filteredSpecies.map((s, index) => (
                <button
                  key={`${s.taxonid}-${s.scientific_name}-${index}`}
                  onClick={() => onSelectSpecies(s)}
                  className="w-full text-left p-3 border-2 border-black rounded-lg hover:bg-[#E8F5E8] transition-colors flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <div className="font-bold text-base italic">
                      {s.scientific_name}
                    </div>
                    {s.main_common_name && (
                      <div className="text-sm text-gray-700 mt-0.5">
                        {s.main_common_name}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          s.category === "CR"
                            ? "bg-red-600 text-white"
                            : s.category === "EN"
                            ? "bg-orange-500 text-white"
                            : s.category === "VU"
                            ? "bg-yellow-500 text-black"
                            : s.category === "NT"
                            ? "bg-green-400 text-black"
                            : s.category === "LC"
                            ? "bg-green-600 text-white"
                            : s.category === "DD"
                            ? "bg-gray-500 text-white"
                            : "bg-gray-400 text-white"
                        }`}
                      >
                        {s.category}
                      </span>
                      <span className="text-xs text-gray-600">
                        {s.genus_name && `Genus: ${s.genus_name}`}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors flex-shrink-0" />
                </button>
              ))
            ) : (
              <p className="text-center py-8 text-gray-500">No species found</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-3 border-t-2 border-black flex-shrink-0">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-6 py-2 border-2 border-black rounded-lg bg-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E8F5E8] transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 font-bold text-lg">
              Page {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-6 py-2 border-2 border-black rounded-lg bg-white font-semibold hover:bg-[#E8F5E8] transition-colors"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

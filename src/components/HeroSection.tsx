import { useState, useEffect } from "react";
import { Play, Loader2 } from "lucide-react";
import Header from "./Header";
import Navigation from "./Navigation";
import CollapsibleBox from "./CollapsibleBox";
import { Species } from "../services/iucnApi";

export default function HeroSection() {
  const [activeBox, setActiveBox] = useState<{
    label: string;
    bgColor: string;
  } | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [speciesImageUrl, setSpeciesImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  const handleNavClick = (label: string, bgColor: string) => {
    setActiveBox({ label, bgColor });
  };

  const handleCloseBox = () => {
    setActiveBox(null);
  };

  const handlePlayClick = () => {
    setIsVideoPlaying(true);
  };

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideoId(videoId);
    setIsVideoPlaying(true);
    setActiveBox(null); // Close the collapsible box
  };

  const handleSpeciesSelect = (species: Species) => {
    setSelectedSpecies(species);
    setIsVideoPlaying(false); // Reset video playing state
    setSelectedVideoId(null); // Reset video selection
  };

  // Fetch species image when a species is selected
  useEffect(() => {
    if (!selectedSpecies) {
      setSpeciesImageUrl(null);
      return;
    }

    const fetchSpeciesImage = async () => {
      setLoadingImage(true);
      try {
        const encodedName = encodeURIComponent(selectedSpecies.scientific_name);
        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_BASE_URL
          }/api/animal-image/${encodedName}`
        );

        if (response.ok) {
          const result = await response.json();
          const imageUrl = result.data?.image?.url || null;
          console.log("Fetched species image:", imageUrl);
          setSpeciesImageUrl(imageUrl);
        } else {
          console.error("Failed to fetch species image:", response.status);
          setSpeciesImageUrl(null);
        }
      } catch (error) {
        console.error("Error fetching species image:", error);
        setSpeciesImageUrl(null);
      } finally {
        setLoadingImage(false);
      }
    };

    fetchSpeciesImage();
  }, [selectedSpecies]);

  const videoUrl = selectedVideoId
    ? `${
        import.meta.env.VITE_YOUTUBE_EMBED_BASE_URL
      }/${selectedVideoId}?autoplay=1&rel=0`
    : `${import.meta.env.VITE_YOUTUBE_EMBED_BASE_URL}/${
        import.meta.env.VITE_DEFAULT_VIDEO_ID
      }?si=vax-Ogcs5PjpQRZa&autoplay=1&rel=0`;

  // Determine which image to display
  const displayImageUrl =
    speciesImageUrl || import.meta.env.VITE_DEFAULT_IMAGE_URL;

  return (
    <div className="relative w-full h-screen bg-[#90EE90] border-8 border-black overflow-hidden rounded-3xl">
      <Header className="md:block hidden" selectedSpecies={selectedSpecies} />

      <div className="absolute inset-0 md:m-8 m-4 border-4 border-black overflow-hidden rounded-2xl">
        {!isVideoPlaying ? (
          <>
            {loadingImage ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <Loader2 className="w-16 h-16 animate-spin text-black" />
              </div>
            ) : (
              <img
                src={displayImageUrl}
                alt={
                  selectedSpecies
                    ? selectedSpecies.scientific_name
                    : "Ecosvery default image"
                }
                className="w-full h-full object-cover"
              />
            )}

            {(!selectedSpecies || selectedVideoId) && (
              <button
                onClick={handlePlayClick}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#90EE90] border-4 border-black p-3 sm:p-4 hover:scale-110 transition-transform group rounded-2xl z-10"
                aria-label="Play video"
              >
                <Play className="w-6 h-6 sm:w-10 sm:h-10 text-black fill-black" />
              </button>
            )}
          </>
        ) : (
          <iframe
            className="w-full h-full"
            src={videoUrl}
            title="IUCN Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
      </div>

      <div className="hidden md:block">
        <Navigation onItemClick={handleNavClick} />
      </div>

      <div className="md:hidden">
        <Header selectedSpecies={selectedSpecies} />
        <Navigation isMobile onItemClick={handleNavClick} />
      </div>

      <CollapsibleBox
        isOpen={activeBox !== null}
        onClose={handleCloseBox}
        title={activeBox?.label || ""}
        bgColor={activeBox?.bgColor || "bg-[#90EE90]"}
        onVideoSelect={handleVideoSelect}
        onSpeciesSelect={handleSpeciesSelect}
      />
    </div>
  );
}

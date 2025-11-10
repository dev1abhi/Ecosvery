import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Species,
  AssessmentDetail,
  getAssessmentById,
  getCategoryColor,
  getCategoryName,
} from "../services/iucnApi";

interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: {
    thumbnails: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  };
}

interface SpeciesDetailViewProps {
  species: Species;
  activeTab: "about" | "status" | "conservation" | "stream";
  onVideoSelect?: (videoId: string) => void;
}

export default function SpeciesDetailView({
  species,
  activeTab,
  onVideoSelect,
}: SpeciesDetailViewProps) {
  const [assessmentData, setAssessmentData] = useState<AssessmentDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<YouTubeVideo[]>(() => {
    // Load cached videos for this species
    const cacheKey = `iucn_videos_${species.assessment_id}`;
    const cached = sessionStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : [];
  });
  const [searchingVideos, setSearchingVideos] = useState(false);

  const YT_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  useEffect(() => {
    const loadSpeciesData = async () => {
      // Check if data is already cached
      const cacheKey = `iucn_assessment_${species.assessment_id}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        // Use cached data
        const cachedData = JSON.parse(cached);
        setAssessmentData(cachedData);
        setLoading(false);
        return;
      }

      // Fetch from API if not cached
      setLoading(true);
      const data = await getAssessmentById(species.assessment_id);
      setAssessmentData(data);

      // Cache the data
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
      setLoading(false);
    };

    loadSpeciesData();
  }, [species.assessment_id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <Loader2 className="w-16 h-16 animate-spin text-black mb-4" />
        <p className="text-base font-semibold text-black">
          Loading species information...
        </p>
      </div>
    );
  }

  const renderAboutContent = () => {
    const commonName =
      assessmentData?.taxon?.common_names?.find((cn) => cn.main)?.name ||
      species.main_common_name;

    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-bold italic">
              {species.scientific_name}
            </h3>
            {commonName && (
              <p className="text-sm text-gray-600">Common name: {commonName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-semibold">Kingdom:</span>{" "}
              {assessmentData?.taxon?.kingdom_name || "N/A"}
            </div>
            <div>
              <span className="font-semibold">Class:</span>{" "}
              {assessmentData?.taxon?.class_name || "N/A"}
            </div>
            <div>
              <span className="font-semibold">Order:</span>{" "}
              {assessmentData?.taxon?.order_name || "N/A"}
            </div>
            <div>
              <span className="font-semibold">Family:</span>{" "}
              {assessmentData?.taxon?.family_name || "N/A"}
            </div>
          </div>

          {assessmentData?.documentation?.rationale && (
            <div>
              <h4 className="font-bold mb-2">Assessment Rationale</h4>
              <div
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: assessmentData.documentation.rationale,
                }}
              />
            </div>
          )}

          {assessmentData?.documentation?.range && (
            <div>
              <h4 className="font-bold mb-2">Geographic Range</h4>
              <div
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: assessmentData.documentation.range,
                }}
              />
            </div>
          )}

          {assessmentData?.documentation?.population && (
            <div>
              <h4 className="font-bold mb-2">Population</h4>
              <div
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: assessmentData.documentation.population,
                }}
              />
            </div>
          )}

          {assessmentData?.documentation?.habitats && (
            <div>
              <h4 className="font-bold mb-2">Habitat and Ecology</h4>
              <div
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: assessmentData.documentation.habitats,
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStatusContent = () => {
    const commonName =
      assessmentData?.taxon?.common_names?.find((cn) => cn.main)?.name ||
      species.main_common_name;
    const populationTrend =
      assessmentData?.population_trend?.description?.en || "Unknown";

    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-bold italic">
              {species.scientific_name}
            </h3>
            {commonName && (
              <p className="text-sm text-gray-600">Common name: {commonName}</p>
            )}
          </div>

          <div className="p-4 border-2 border-black rounded-lg bg-white">
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`px-4 py-2 rounded-lg font-bold ${getCategoryColor(
                  species.category
                )}`}
              >
                {getCategoryName(species.category)}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Status Code:</span>{" "}
                {String(species.category || "")}
              </div>
              {assessmentData?.criteria && (
                <div>
                  <span className="font-semibold">Criteria:</span>{" "}
                  {assessmentData.criteria}
                </div>
              )}
              <div>
                <span className="font-semibold">Population Trend:</span>{" "}
                <span
                  className={`font-semibold ${
                    populationTrend === "Decreasing"
                      ? "text-red-600"
                      : populationTrend === "Increasing"
                      ? "text-green-600"
                      : "text-gray-600"
                  }`}
                >
                  {populationTrend}
                </span>
              </div>
              <div>
                <span className="font-semibold">Assessment Date:</span>{" "}
                {String(
                  assessmentData?.assessment_date ||
                    species.assessment_date ||
                    ""
                )}
              </div>
            </div>
          </div>

          {assessmentData?.documentation?.threats && (
            <div>
              <h4 className="font-bold mb-2">Major Threats</h4>
              <div
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: assessmentData.documentation.threats,
                }}
              />
            </div>
          )}

          {assessmentData?.threats && assessmentData.threats.length > 0 && (
            <div>
              <h4 className="font-bold mb-2">Threat Details</h4>
              <div className="space-y-2">
                {assessmentData.threats.map((threat, index) => (
                  <div
                    key={index}
                    className="p-3 border-2 border-black rounded-lg bg-[#E8F5E8]"
                  >
                    <div className="font-semibold text-sm">
                      {threat.description.en}
                    </div>
                    {threat.timing && (
                      <div className="text-xs text-gray-600">
                        Timing: {threat.timing}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderConservationContent = () => {
    const commonName =
      assessmentData?.taxon?.common_names?.find((cn) => cn.main)?.name ||
      species.main_common_name;

    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-bold italic">
              {species.scientific_name}
            </h3>
            {commonName && (
              <p className="text-sm text-gray-600">Common name: {commonName}</p>
            )}
          </div>

          {assessmentData?.documentation?.measures && (
            <div>
              <h4 className="font-bold mb-2">Conservation Actions</h4>
              <div
                className="text-sm leading-relaxed mb-4"
                dangerouslySetInnerHTML={{
                  __html: assessmentData.documentation.measures,
                }}
              />
            </div>
          )}

          {assessmentData?.conservation_actions &&
            assessmentData.conservation_actions.length > 0 && (
              <div>
                <h4 className="font-bold mb-2">Conservation Measures</h4>
                <div className="space-y-2">
                  {assessmentData.conservation_actions.map((measure, index) => (
                    <div
                      key={index}
                      className="p-3 border-2 border-black rounded-lg bg-[#E8F5E8]"
                    >
                      <div className="font-semibold text-sm">
                        {measure.description?.en || "Conservation action"}
                      </div>
                      {measure.code && (
                        <div className="text-xs text-gray-600">
                          Code: {measure.code}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {!assessmentData?.documentation?.measures &&
            (!assessmentData?.conservation_actions ||
              assessmentData.conservation_actions.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">
                No conservation measures data available
              </p>
            )}
        </div>
      </div>
    );
  };

  const renderStreamContent = () => {
    const commonName =
      assessmentData?.taxon?.common_names?.find((cn) => cn.main)?.name ||
      species.main_common_name;

    const searchQuery = `${
      commonName || species.scientific_name
    } wildlife documentary`;

    const handleSearchVideos = async () => {
      // Check if videos are already cached for this species
      const cacheKey = `iucn_videos_${species.assessment_id}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        // Use cached videos
        const cachedVideos = JSON.parse(cached);
        console.log("Using cached videos:", cachedVideos);
        setVideos(cachedVideos);
        return;
      }

      // Fetch from API if not cached
      setSearchingVideos(true);
      try {
        const response = await fetch(`${YT_BASE_URL}/api/youtube/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: searchQuery, maxResults: 9 }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch videos");
        }

        const result = await response.json();
        // Handle nested response structure: result.data.videos
        const videosList = result.data?.videos || result.videos || [];
        console.log("Fetched videos:", videosList);
        setVideos(videosList);

        // Cache the videos
        sessionStorage.setItem(cacheKey, JSON.stringify(videosList));
      } catch (error) {
        console.error("Error searching YouTube:", error);
        setVideos([]);
      } finally {
        setSearchingVideos(false);
      }
    };

    const handleVideoClick = (videoId: string) => {
      if (onVideoSelect) {
        onVideoSelect(videoId);
      }
    };

    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-bold italic">
              {species.scientific_name}
            </h3>
            {commonName && (
              <p className="text-sm text-gray-600">Common name: {commonName}</p>
            )}
          </div>

          <p className="text-sm">
            Watch documentaries and videos about this species:
          </p>

          <button
            onClick={handleSearchVideos}
            disabled={searchingVideos}
            className="w-full p-4 border-2 border-black rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {searchingVideos ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              "Search on YouTube"
            )}
          </button>

          {videos.length > 0 && (
            <div className="space-y-3 mt-4">
              <h4 className="font-bold text-sm">Search Results:</h4>
              <div className="grid grid-cols-1 gap-3">
                {videos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => handleVideoClick(video.id)}
                    className="w-full border-2 border-black rounded-lg overflow-hidden bg-white hover:bg-[#E8F5E8] transition-colors text-left"
                  >
                    <div className="flex gap-3 p-2">
                      <div className="flex-shrink-0 w-32 h-20 bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={video.thumbnail.thumbnails[0]?.url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-semibold line-clamp-2 mb-1">
                          {video.title}
                        </h5>
                        <p className="text-xs text-gray-600">
                          {video.channelTitle}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {videos.length === 0 && !searchingVideos && (
            <div className="text-xs text-gray-600 text-center py-4">
              Click "Search on YouTube" to find videos about this species
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      {activeTab === "about" && renderAboutContent()}
      {activeTab === "status" && renderStatusContent()}
      {activeTab === "conservation" && renderConservationContent()}
      {activeTab === "stream" && renderStreamContent()}
    </div>
  );
}

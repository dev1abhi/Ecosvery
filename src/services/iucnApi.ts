import { getCommonNames } from './uniprotSpecies';
import { fetchWithRetry, ApiError, getCachedData, setCachedData } from '../utils/apiHelpers';

// Cache TTL
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Use local proxy server to handle CORS and authentication
const PROXY_BASE = `${import.meta.env.VITE_BACKEND_BASE_URL}/proxy-api`;

// Helper to construct API URL through local proxy
const getApiUrl = (endpoint: string): string => {
  return `${PROXY_BASE}${endpoint}`;
};

export interface Assessment {
  assessment_id: number;
  sis_taxon_id: number;
  taxon_scientific_name: string;
  red_list_category_code: string;
  year_published: string;
  url: string;
  latest: boolean;
  possibly_extinct: boolean;
  possibly_extinct_in_the_wild: boolean;
  scopes?: Array<{
    code: string;
    description: {
      en: string;
    };
  }>;
}

export interface Species {
  assessment_id: number; // Store assessment_id for fetching full details
  taxonid: number;
  scientific_name: string;
  kingdom_name: string;
  phylum_name: string;
  class_name: string;
  order_name: string;
  family_name: string;
  genus_name: string;
  main_common_name: string;
  authority: string;
  published_year: number;
  assessment_date: string;
  category: string;
  criteria: string;
  population_trend: string;
  marine_system: boolean;
  freshwater_system: boolean;
  terrestrial_system: boolean;
}

// Full assessment response from API
export interface AssessmentDetail {
  assessment_id: number;
  assessment_date: string;
  year_published: string;
  latest: boolean;
  possibly_extinct: boolean;
  possibly_extinct_in_the_wild: boolean;
  sis_taxon_id: number;
  criteria: string;
  url: string;
  citation: string;
  taxon: {
    sis_id: number;
    scientific_name: string;
    kingdom_name: string;
    phylum_name: string;
    class_name: string;
    order_name: string;
    family_name: string;
    genus_name: string;
    species_name: string;
    authority: string;
    common_names?: Array<{
      main: boolean;
      name: string;
      language: string;
    }>;
  };
  population_trend?: {
    description: {
      en: string;
    };
    code: string;
  };
  red_list_category: {
    version: string;
    description: {
      en: string;
    };
    code: string;
  };
  supplementary_info?: {
    number_of_locations?: string;
    upper_elevation_limit?: number;
    lower_elevation_limit?: number;
    population_size?: string;
    estimated_area_of_occupancy?: string;
    estimated_extent_of_occurence?: string;
  };
  documentation?: {
    range?: string;
    population?: string;
    habitats?: string;
    threats?: string;
    measures?: string;
    use_trade?: string;
    rationale?: string;
  };
  biogeographical_realms?: Array<{
    description: { en: string };
    code: string;
  }>;
  conservation_actions?: Array<{
    code?: string;
    description?: { en: string };
  }>;
  habitats?: Array<{
    description: { en: string };
    code: string;
    suitability?: string;
  }>;
  locations?: Array<{
    description: { en: string };
    code: string;
    origin?: string;
    presence?: string;
  }>;
  threats?: Array<{
    description: { en: string };
    code: string;
    timing?: string;
    score?: string;
  }>;
  systems?: Array<{
    description: { en: string };
    code: string;
  }>;
}

export interface ConservationMeasure {
  code: string;
  title: string;
}

export interface Narrative {
  species_id: number;
  taxonomicnotes: string;
  rationale: string;
  geographicrange: string;
  population: string;
  populationtrend: string;
  habitat: string;
  threats: string;
  conservationmeasures: string;
  usetrade: string;
}

export interface ThreatItem {
  code?: string;
  title: string;
  timing?: string;
  scope?: string;
  severity?: string;
}

export interface ConservationAction {
  code?: string;
  title?: string;
  name?: string;
}

export interface AssessmentData {
  taxonomic_notes?: string;
  rationale?: string;
  geographic_range?: string;
  population?: string;
  population_trend?: string;
  habitat?: string;
  threats?: ThreatItem[];
  conservation_actions?: ConservationAction[];
  use_trade?: string;
}

//TODO: getting categories for different assessment lists

// Get assessments by Red List category (e.g., 'CR', 'EN', 'VU')
export const getSpeciesByCategory = async (category: string, page: number = 1): Promise<Assessment[]> => {
  try {
    const response = await fetchWithRetry(getApiUrl(`/red_list_categories/${category}?page=${page}`));
    
    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch species by category`,
        response.status,
        getApiUrl(`/red_list_categories/${category}`)
      );
    }
    
    const data = await response.json();
    return data.assessments || [];
  } catch (error) {
    console.error('Error fetching species by category:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error while fetching species by category');
  }
};

// Get assessments by kingdom (e.g., 'ANIMALIA', 'PLANTAE')
export const getSpeciesByKingdom = async (kingdom: string, page: number = 1): Promise<Assessment[]> => {
  try {
    const response = await fetchWithRetry(getApiUrl(`/taxa/kingdom/${encodeURIComponent(kingdom)}?page=${page}`));
    
    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch species by kingdom`,
        response.status,
        getApiUrl(`/taxa/kingdom/${kingdom}`)
      );
    }
    
    const data = await response.json();
    return data.assessments || [];
  } catch (error) {
    console.error('Error fetching species by kingdom:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error while fetching species by kingdom');
  }
};

// Get assessments by class (e.g., 'MAMMALIA', 'AVES', 'REPTILIA')
export const getSpeciesByClass = async (className: string, page: number = 1): Promise<Assessment[]> => {
  try {
    const response = await fetchWithRetry(getApiUrl(`/taxa/class/${encodeURIComponent(className)}?page=${page}`));
    
    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch species by class`,
        response.status,
        getApiUrl(`/taxa/class/${className}`)
      );
    }
    
    const data = await response.json();
    return data.assessments || [];
  } catch (error) {
    console.error('Error fetching species by class:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error while fetching species by class');
  }
};

// Get species by page - using MAMMALIA class as default for browsing
export const getSpeciesByPage = async (page: number = 1): Promise<Species[]> => {
  // Check cache first
  const cacheKey = `iucn_page_${page}`;
  const cached = getCachedData<Species[]>(cacheKey);
  
  if (cached) {
    console.log(`✅ Using cached data for page ${page}`);
    return cached;
  }

  try {
    const response = await fetchWithRetry(
      getApiUrl(`/taxa/class/MAMMALIA?page=${page}&latest=true`)
    );
    
    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch species page ${page}`,
        response.status,
        getApiUrl(`/taxa/class/MAMMALIA`)
      );
    }
    
    const data = await response.json();
    
    // Handle API response structure
    if (data.error) {
      console.error('API Error:', data.error);
      throw new ApiError(data.error);
    }
    
    const assessments: Assessment[] = data.assessments || [];
    
    // Extract all scientific names for batch lookup
    const scientificNames = assessments.map(a => a.taxon_scientific_name);
    
    // Get common names from UniProt in one batch
    const commonNamesMap = await getCommonNames(scientificNames);
    
    const species: Species[] = assessments.map(a => {
      // Parse scientific name to extract genus
      const nameParts = a.taxon_scientific_name.split(' ');
      const genus = nameParts[0] || '';
      
      // Get common name from UniProt lookup
      const commonName = commonNamesMap.get(a.taxon_scientific_name) || '';
      
      // Ensure all fields are strings or primitives, not objects
      return {
        assessment_id: a.assessment_id, // Store assessment_id for later use
        taxonid: a.sis_taxon_id,
        scientific_name: a.taxon_scientific_name,
        kingdom_name: 'ANIMALIA',
        phylum_name: 'CHORDATA',
        class_name: 'MAMMALIA',
        order_name: '',
        family_name: '',
        genus_name: genus,
        main_common_name: commonName,
        authority: '',
        published_year: parseInt(a.year_published) || 0,
        assessment_date: String(a.year_published || ''),
        category: String(a.red_list_category_code || ''),
        criteria: '',
        population_trend: '',
        marine_system: false,
        freshwater_system: false,
        terrestrial_system: true,
      };
    });
    
    // Cache the results
    setCachedData(cacheKey, species, { ttl: CACHE_TTL });
    
    return species;
  } catch (error) {
    console.error('Error fetching species:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error while fetching species');
  }
};

// Get full assessment details by assessment_id - SINGLE API CALL
export const getAssessmentById = async (assessmentId: number): Promise<AssessmentDetail | null> => {
  // Check cache first
  const cacheKey = `iucn_assessment_${assessmentId}`;
  const cached = getCachedData<AssessmentDetail>(cacheKey);
  
  if (cached) {
    console.log(`✅ Using cached assessment data for ID ${assessmentId}`);
    return cached;
  }

  try {
    const response = await fetchWithRetry(getApiUrl(`/assessment/${assessmentId}`));
    
    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch assessment ${assessmentId}`,
        response.status,
        getApiUrl(`/assessment/${assessmentId}`)
      );
    }
    
    const data: AssessmentDetail = await response.json();
    
    // Cache the results
    setCachedData(cacheKey, data, { ttl: CACHE_TTL });
    
    return data;
  } catch (error) {
    console.error('Error fetching assessment details:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error while fetching assessment details');
  }
};



export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'EX': 'bg-black text-white', // Extinct
    'EW': 'bg-purple-900 text-white', // Extinct in the Wild
    'CR': 'bg-red-600 text-white', // Critically Endangered
    'EN': 'bg-orange-500 text-white', // Endangered
    'VU': 'bg-yellow-500 text-black', // Vulnerable
    'NT': 'bg-green-400 text-black', // Near Threatened
    'LC': 'bg-green-600 text-white', // Least Concern
    'DD': 'bg-gray-500 text-white', // Data Deficient
    'NE': 'bg-gray-300 text-black', // Not Evaluated
  };
  return colors[category] || 'bg-gray-400 text-black';
};

// Get full category name
export const getCategoryName = (category: string): string => {
  const names: Record<string, string> = {
    'EX': 'Extinct',
    'EW': 'Extinct in the Wild',
    'CR': 'Critically Endangered',
    'EN': 'Endangered',
    'VU': 'Vulnerable',
    'NT': 'Near Threatened',
    'LC': 'Least Concern',
    'DD': 'Data Deficient',
    'NE': 'Not Evaluated',
  };
  return names[category] || category;
};

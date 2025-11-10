// UniProt Species List Parser
// Fetches and caches the complete species list from UniProt FTP server
// Format: https://ftp.uniprot.org/pub/databases/uniprot/knowledgebase/complete/docs/speclist.txt

import { fetchWithTimeout, getCachedData, setCachedData } from '../utils/apiHelpers';

// Cache TTL: 24 hours (UniProt data doesn't change frequently)
const UNIPROT_CACHE_TTL = 500 * 60 * 60 * 1000;

// In-memory cache for parsed species data
let speciesCache: Map<string, string> | null = null;
let cachePromise: Promise<Map<string, string>> | null = null;

// Parse the UniProt speclist.txt format
// Format:
// CODE X NNNNNN: N=Scientific name
//                C=Common name
//                S=Synonym
const parseUniProtSpecList = (text: string): Map<string, string> => {
  const speciesMap = new Map<string, string>();
  const lines = text.split('\n');
  
  let currentScientificName = '';
  let inDataSection = false;
  
  for (const line of lines) {
    // Start parsing when we hit the real organism codes section
    if (line.includes('(1) Real organism codes')) {
      inDataSection = true;
      continue;
    }
    
    // Stop parsing at virtual codes section
    if (line.includes('(2) Virtual codes')) {
      break;
    }
    
    // Skip until we're in the data section
    if (!inDataSection) {
      continue;
    }
    
    // Skip separator lines
    if (line.startsWith('_____') || line.startsWith('===')) {
      continue;
    }
    
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) {
      continue;
    }
    
    // Parse lines with N= (scientific name)
    // Format: CODE X NNNNNN: N=Scientific name
    if (line.match(/^[A-Z0-9]{5}\s+[VEBAO]\s+\d+:/) && line.includes('N=')) {
      const nMatch = line.match(/N=([^()]+?)(?:\s*\([^)]*\))?$/);
      if (nMatch) {
        currentScientificName = nMatch[1].trim();
      }
    }
    
    // Parse lines with C= (common name)
    // These appear indented on lines after N= lines
    if (trimmedLine.startsWith('C=') && currentScientificName) {
      const commonName = trimmedLine.substring(2).trim();
      if (commonName) {
        speciesMap.set(currentScientificName, commonName);
        // Don't reset currentScientificName yet, as there might be synonyms
      }
    }
    
    // Parse lines with S= (synonym) - also check for common names
    // Some species have N= and S= but no C=, so we reset after S=
    if (trimmedLine.startsWith('S=') && currentScientificName) {
      // If we haven't found a common name yet, reset
      if (!speciesMap.has(currentScientificName)) {
        currentScientificName = '';
      }
    }
  }
  
  console.log(`UniProt species list loaded: ${speciesMap.size} entries with common names`);
  return speciesMap;
};

// Fetch and cache the UniProt species list
const loadUniProtSpeciesList = async (): Promise<Map<string, string>> => {
  // Check sessionStorage first
  const cached = getCachedData<Array<[string, string]>>('uniprot_species_list');
  
  if (cached) {
    const map = new Map<string, string>(cached);
    console.log('UniProt species list loaded from cache');
    return map;
  }
  
  // Fetch from UniProt FTP server
  try {
    console.log('Fetching UniProt species list from server...');
    
    // 60 second timeout for large file
    const response = await fetchWithTimeout(
      import.meta.env.VITE_UNIPROT_FTP_URL,
      {},
      60000
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch UniProt species list: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    
    if (!text || text.length < 1000) {
      throw new Error('UniProt species list appears to be empty or corrupt');
    }
    
    const speciesMap = parseUniProtSpecList(text);
    
    if (speciesMap.size === 0) {
      throw new Error('Failed to parse UniProt species list');
    }
    
    // Cache in sessionStorage (convert Map to array for JSON)
    setCachedData('uniprot_species_list', [...speciesMap.entries()], {
      ttl: UNIPROT_CACHE_TTL,
    });
    
    return speciesMap;
  } catch (error) {
    console.error('Error loading UniProt species list:', error);
    // Return empty map instead of throwing to allow app to continue
    return new Map();
  }
};

// Get common name for a scientific name
export const getCommonName = async (scientificName: string): Promise<string> => {
  // Return cached result immediately if available
  if (speciesCache) {
    // Try exact match first, then case-insensitive
    return speciesCache.get(scientificName) || 
           speciesCache.get(scientificName.toLowerCase()) || 
           '';
  }
  
  // If already loading, wait for that promise
  if (cachePromise) {
    speciesCache = await cachePromise;
    return speciesCache.get(scientificName) || 
           speciesCache.get(scientificName.toLowerCase()) || 
           '';
  }
  
  // Start loading
  cachePromise = loadUniProtSpeciesList();
  speciesCache = await cachePromise;
  cachePromise = null;
  
  return speciesCache.get(scientificName) || 
         speciesCache.get(scientificName.toLowerCase()) || 
         '';
};

// Preload the species list in the background (call on app init)
export const preloadUniProtData = async (): Promise<void> => {
  if (!speciesCache && !cachePromise) {
    cachePromise = loadUniProtSpeciesList();
    speciesCache = await cachePromise;
    cachePromise = null;
  }
};

// Get common names for multiple species (batch lookup)
export const getCommonNames = async (scientificNames: string[]): Promise<Map<string, string>> => {
  // Ensure data is loaded
  if (!speciesCache) {
    if (cachePromise) {
      speciesCache = await cachePromise;
    } else {
      cachePromise = loadUniProtSpeciesList();
      speciesCache = await cachePromise;
      cachePromise = null;
    }
  }
  
  const results = new Map<string, string>();
  for (const name of scientificNames) {
    // Try exact match first, then case-insensitive
    const commonName = speciesCache.get(name) || 
                      speciesCache.get(name.toLowerCase()) || 
                      '';
    if (commonName) {
      results.set(name, commonName);
    }
  }
  
  console.log(`🔍 Found ${results.size} common names out of ${scientificNames.length} species`);
  return results;
};

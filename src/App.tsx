import { useEffect, useState } from "react";
import HeroSection from "./components/HeroSection";
import ErrorBoundary from "./components/ErrorBoundary";
import { preloadUniProtData } from "./services/uniprotSpecies";
import { validateEnvironment } from "./utils/apiHelpers";
import { AlertTriangle } from "lucide-react";

function App() {
  const [envValid, setEnvValid] = useState(true);
  const [missingVars, setMissingVars] = useState<string[]>([]);

  // Validate environment variables on mount
  useEffect(() => {
    const { valid, missing } = validateEnvironment();
    setEnvValid(valid);
    setMissingVars(missing);

    if (!valid) {
      console.error("Missing required environment variables:", missing);
    }
  }, []);

  // Preload UniProt species data on app mount
  useEffect(() => {
    if (envValid) {
      preloadUniProtData().catch((err) =>
        console.error("Failed to preload UniProt data:", err)
      );
    }
  }, [envValid]);

  // Show error if environment is not configured
  if (!envValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border-4 border-black rounded-2xl p-8 shadow-lg">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-yellow-100 border-2 border-yellow-600 rounded-full p-3">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">
            Configuration Error
          </h1>

          <p className="text-gray-600 text-center mb-4">
            Missing required environment variables. Please check your{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="font-semibold text-sm text-red-900 mb-2">
              Missing variables:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {missingVars.map((varName) => (
                <li key={varName}>
                  <code>{varName}</code>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Copy <code>.env.example</code> to <code>.env</code> and fill in the
            required values.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full h-screen overflow-hidden bg-black">
        <HeroSection />
      </div>
    </ErrorBoundary>
  );
}

export default App;

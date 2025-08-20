import { useState } from "react";
import axios from "axios";
import { Flame, RefreshCw, Activity } from "lucide-react";

const initialState = {
  "Air Temperature (°C)": "",
  "Relative Humidity (%)": "",
  "Wind Speed (km/h)": "",
  "Rainfall (mm)": "",
  "Fine Fuel Moisture Code (FFMC)": "",
  "Duff Moisture Code (DMC)": "",
  "Drought Code (DC)": "",
  "Initial Spread Index (ISI)": "",
  "Build Up Index (BUI)": ""
};

export default function App() {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Map full names to short codes expected by backend
      const features = {
        Temperature: parseFloat(formData["Air Temperature (°C)"]),
        RH: parseFloat(formData["Relative Humidity (%)"]),
        Ws: parseFloat(formData["Wind Speed (km/h)"]),
        Rain: parseFloat(formData["Rainfall (mm)"]),
        FFMC: parseFloat(formData["Fine Fuel Moisture Code (FFMC)"]),
        DMC: parseFloat(formData["Duff Moisture Code (DMC)"]),
        DC: parseFloat(formData["Drought Code (DC)"]),
        ISI: parseFloat(formData["Initial Spread Index (ISI)"]),
        BUI: parseFloat(formData["Build Up Index (BUI)"])
      };

      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/predict`, { features });
      setResult(data.prediction);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialState);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-200 to-purple-200 flex items-center justify-center p-10">
      <div className="bg-white shadow-2xl rounded-3xl p-6 max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Flame size={48} className="text-red-500" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800">
              Algerian Forest Fire Predictor
            </h1>
          </div>
          <p className="text-gray-700 text-lg">
            Enter meteorological values to estimate the Fire Weather Index 🔥
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(initialState).map((key) => (
            <div key={key} className="flex flex-col">
              <label className="mb-1 font-medium text-gray-700">{key}</label>
              <input
                type="number"
                step="any"
                name={key}
                value={formData[key]}
                onChange={handleChange}
                className="p-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition"
                required
              />
            </div>
          ))}

          {/* Buttons */}
          <div className="col-span-full flex justify-center gap-6">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl shadow hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Activity size={20} />
              {loading ? "Predicting..." : "Predict"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 bg-gray-300 text-gray-800 px-8 py-3 rounded-xl shadow hover:bg-gray-400 transition"
            >
              <RefreshCw size={20} />
              Reset
            </button>
          </div>
        </form>

        {/* Result */}
        {result !== null && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-green-200 border-l-4 border-green-600 rounded-xl shadow">
            <h2 className="text-2xl font-bold text-green-800 mb-2">Prediction Result</h2>
            <p className="text-4xl font-extrabold text-green-700">
              {result.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-2 font-semibold">
              FIRE WEATHER INDEX (FWI) – a numeric value indicating fire danger (higher → higher risk)
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-10 p-6 bg-red-100 border-l-4 border-red-500 rounded-xl shadow text-red-700">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

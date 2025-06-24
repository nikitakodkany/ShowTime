import React from "react";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Show Time
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-blue-200 mb-8">
          Ticket Event App
        </h2>
        <p className="text-lg text-gray-300 max-w-md mx-auto">
          Your ultimate destination for booking tickets to the best events and concerts
        </p>
        <div className="mt-8">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
} 
import React from "react";

const TestStyling: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "black",
        color: "white",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "2rem",
            textAlign: "center",
            color: "red",
          }}
        >
          Basic Styling Test
        </h1>

        {/* Test with inline styles first */}
        <div
          style={{
            marginBottom: "2rem",
            padding: "1.5rem",
            backgroundColor: "red",
            borderRadius: "0.5rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              color: "white",
            }}
          >
            Inline Style Test
          </h2>
          <p style={{ color: "white" }}>
            This uses inline styles - should be red background.
          </p>
        </div>

        {/* Test with basic Tailwind classes */}
        <div className="mb-8 p-6 bg-red-500 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Tailwind Test
          </h2>
          <p className="text-white">
            This uses Tailwind classes - should be red background.
          </p>
        </div>

        {/* Test with more Tailwind */}
        <div className="mb-8 p-6 bg-blue-500 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Blue Tailwind Test
          </h2>
          <p className="text-white">This should be blue background.</p>
        </div>

        {/* Test gradient */}
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Gradient Test
          </h2>
          <p className="text-white">
            This should have a purple to pink gradient.
          </p>
        </div>

        {/* Test buttons */}
        <div className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Button Test</h2>
          <button className="bg-green-500 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
            Green Button
          </button>
          <br />
          <button className="bg-yellow-500 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold">
            Yellow Button
          </button>
        </div>

        {/* Status */}
        <div className="text-center p-4 bg-green-500 rounded-lg">
          <p className="text-white font-semibold">
            ✅ If you see colors, styling is working!
          </p>
        </div>

        {/* Debug info */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-white font-semibold mb-2">Debug Info:</h3>
          <p className="text-white text-sm">
            If you see this text in white on dark background, Tailwind is
            working.
          </p>
          <p className="text-white text-sm">
            If you see this text in black on white background, Tailwind is NOT
            working.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestStyling;

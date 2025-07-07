import React from "react";
import { useNavigate } from "react-router-dom";

const PersonasPage: React.FC = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate("/dashboard/personas", { replace: true });
  }, [navigate]);
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Personas Page Deprecated
        </h2>
        <p className="text-white/70">
          This page is no longer used. Redirecting to your Persona...
        </p>
      </div>
    </div>
  );
};

export default PersonasPage;

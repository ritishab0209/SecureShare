import React from "react";
import { Routes, Route } from "react-router-dom";
import { Shield } from "lucide-react";
import { Home } from "./pages/Home";
import { SharedCode } from "./pages/SharedCode";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">SecureShare</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/share/:shareId" element={<SharedCode />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

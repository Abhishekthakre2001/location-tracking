import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Tracker from "./pages/Tracker";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <BrowserRouter>
      {/* Navbar */}
      <header className="p-4 flex gap-4 items-center bg-gray-100 mb-4">
        <h1 className="text-xl font-semibold">🚀 Real-time Tracker</h1>
        <nav className="space-x-2">
          <Link to="/tracker" className="px-3 py-1 bg-blue-500 text-white rounded">
            Tracker
          </Link>
          <Link to="/admin" className="px-3 py-1 bg-green-500 text-white rounded">
            Admin
          </Link>
        </nav>
      </header>

      {/* All Routes Here */}
      <Routes>
        <Route
          path="/"
          element={
            <div className="p-4">
              <h2 className="text-lg font-medium mb-2">Welcome 👋</h2>
              <p>Select a page:</p>
              <div className="mt-2 space-x-3">
                <Link to="/tracker" className="text-blue-600 underline">
                  Go to Tracker
                </Link>
                <Link to="/admin" className="text-green-600 underline">
                  Go to Admin
                </Link>
              </div>
            </div>
          }
        />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

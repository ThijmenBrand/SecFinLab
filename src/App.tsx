import { NavLink, Route, Routes } from "react-router-dom";
import DuplicateLabeler from "./DuplicateLabeler";
import DeduplicationEvaluator from "./DeduplicationEvaluator";

function App() {
  return (
    <>
      <div>
        <nav className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between h-16 items-center">
              <div className="flex space-x-6">
                <NavLink
                  to="/duplicate"
                  className={({ isActive }) =>
                    isActive ? "text-blue-600 font-semibold" : "text-gray-700"
                  }
                >
                  Duplicate Labeler
                </NavLink>
                <NavLink
                  to="/dedup-evaluate"
                  className={({ isActive }) =>
                    isActive ? "text-blue-600 font-semibold" : "text-gray-700"
                  }
                >
                  Deduplication Evaluator
                </NavLink>
              </div>
            </div>
          </div>
        </nav>

        <main className="p-8 flex flex-col items-center justify-center">
          <Routes>
            <Route path="/duplicate" element={<DuplicateLabeler />} />
            <Route
              path="/dedup-evaluate"
              element={<DeduplicationEvaluator />}
            />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default App;

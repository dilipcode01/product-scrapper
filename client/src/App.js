import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import Dashboard from "./pages/Dashboard"
import Products from "./pages/Products"
import ProductDetail from "./pages/ProductDetail"
import Scraper from "./pages/Scraper"
import Jobs from "./pages/Jobs"
import Settings from "./pages/Settings"
import "./App.css"

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/scraper" element={<Scraper />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App

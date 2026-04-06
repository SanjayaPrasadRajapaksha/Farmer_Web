import { Route, Routes } from "react-router-dom";
import AboutUs from "../pages/AboutUs/AboutUs";
import Contact from "../pages/ContactUs/ContactUs";
import FaqPage from "../pages/FAQ/FaqPage";
import Feedback from "../pages/Feedback/Feedback";
import Home from "../pages/Home/Home";
import MarketPrice from "../pages/MarketPrice/MarketPrice";
import Report from "../pages/Report/Report";
function TPRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/aboutus" element={<AboutUs />} />
      <Route path="/marketprice" element={<MarketPrice />} />
      <Route path="/report" element={<Report />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/faq" element={<FaqPage />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  );
}

export default TPRoutes;

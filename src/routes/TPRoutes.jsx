import { Routes, Route } from "react-router-dom";
import Home from "../pages/HomePage/Home";
import AboutUs from "../pages/AboutusPage/AboutUs";
import Room from "../pages/RoomPage/RoomPage";
import Services from "../pages/ServicePage/ServicePage";
import FAQ from "../pages/FAQ/FaqPage";
import Contact from "../pages/ContactUs/ContactUs";

function TPRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/aboutus" element={<AboutUs />} />
      <Route path="/room" element={<Room />} />
      <Route path="/service" element={<Services />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  );
}

export default TPRoutes;

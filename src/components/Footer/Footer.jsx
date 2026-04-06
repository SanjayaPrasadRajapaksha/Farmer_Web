import React from 'react';
import { Facebook, Instagram, Youtube, Linkedin, Rss } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-gray-200 border-t">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        
        {/* Left side */}
        <p className="text-sm text-gray-700">
          © 2025 Farmer. All rights reserved.
        </p>

        {/* Right side icons */}
        <div className="flex space-x-3">
          <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 transition">
            <Facebook size={16} />
          </a>

          <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 transition">
            <Instagram size={16} />
          </a>

          <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 transition">
            <Youtube size={16} />
          </a>

          <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 transition">
            <Linkedin size={16} />
          </a>

          <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 transition">
            <Rss size={16} />
          </a>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
import React from 'react';
import { Facebook, Instagram, Youtube, Linkedin, Rss } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-gray-900 text-white border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        
        {/* Left side */}
        <p className="text-sm text-gray-400">
          © 2025 Farmer. All rights reserved.
        </p>

        {/* Right side icons */}
        <div className="flex space-x-3">
          {[
            { icon: <Facebook size={16} />, link: '#' },
            { icon: <Instagram size={16} />, link: '#' },
            { icon: <Youtube size={16} />, link: '#' },
            { icon: <Linkedin size={16} />, link: '#' },
            { icon: <Rss size={16} />, link: '#' },
          ].map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-green-600 text-white transition transform hover:scale-110"
            >
              {item.icon}
            </a>
          ))}
        </div>

      </div>
    </footer>
  );
}

export default Footer;
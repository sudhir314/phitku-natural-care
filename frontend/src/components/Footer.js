import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-sky-400 text-white py-6 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-center items-center gap-4">
        <p className="text-sm font-medium tracking-wide">
          © {new Date().getFullYear()},   Natural & Pure.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
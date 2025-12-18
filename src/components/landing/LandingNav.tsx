import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LandingNav() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "HOME", href: "#hero" },
    { label: "SERVICES", href: "#services" },
    { label: "MAGIC AI", href: "#works" },
    { label: "CONTACT", href: "https://wa.me/34625976744", external: true },
  ];

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      {/* Desktop Navigation - Apple Liquid Glass Pill */}
      <motion.div 
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="hidden md:flex items-center gap-1 px-2 py-2 rounded-full"
        style={{
          background: "rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(40px) saturate(1.8)",
          WebkitBackdropFilter: "blur(40px) saturate(1.8)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          boxShadow: `
            0 0 0 0.5px rgba(255, 255, 255, 0.1) inset,
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 2px 8px rgba(0, 0, 0, 0.2)
          `,
        }}
      >
        {navItems.map((item) => (
          item.external ? (
            <motion.a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="relative px-5 py-2.5 text-sm font-medium text-white/80 rounded-full overflow-hidden"
              style={{ fontFamily: "Orbitron, sans-serif" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ opacity: 0 }}
                whileHover={{ 
                  opacity: 1,
                  background: "rgba(255, 255, 255, 0.15)",
                }}
                transition={{ duration: 0.2 }}
              />
              <span className="relative z-10">{item.label}</span>
            </motion.a>
          ) : (
            <motion.a
              key={item.label}
              href={item.href}
              className="relative px-5 py-2.5 text-sm font-medium text-white/80 rounded-full overflow-hidden"
              style={{ fontFamily: "Orbitron, sans-serif" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ opacity: 0 }}
                whileHover={{ 
                  opacity: 1,
                  background: "rgba(255, 255, 255, 0.15)",
                }}
                transition={{ duration: 0.2 }}
              />
              <span className="relative z-10">{item.label}</span>
            </motion.a>
          )
        ))}
        
        {/* Login Button with Glass Morphing Effect */}
        <Link to="/auth">
          <motion.div
            className="relative ml-1 px-6 py-2.5 rounded-full overflow-hidden cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 0 0 0.5px rgba(255, 255, 255, 0.2) inset",
            }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 20px rgba(255, 255, 255, 0.2), 0 0 0 0.5px rgba(255, 255, 255, 0.3) inset",
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <span 
              className="relative z-10 text-sm font-semibold text-white"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              LOGIN
            </span>
          </motion.div>
        </Link>
      </motion.div>

      {/* Mobile Navigation */}
      <div className="md:hidden w-full">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center px-4 py-3 rounded-2xl mx-auto max-w-sm"
          style={{
            background: "rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(40px) saturate(1.8)",
            WebkitBackdropFilter: "blur(40px) saturate(1.8)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          <span className="text-white font-semibold" style={{ fontFamily: "Orbitron, sans-serif" }}>
            UNVRS
          </span>
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-white/80 rounded-full"
            whileHover={{ scale: 1.1, background: "rgba(255, 255, 255, 0.1)" }}
            whileTap={{ scale: 0.9 }}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </motion.div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="mt-2 mx-auto max-w-sm rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(40px) saturate(1.8)",
                WebkitBackdropFilter: "blur(40px) saturate(1.8)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div className="p-2">
                {navItems.map((item, index) => (
                  item.external ? (
                    <motion.a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-3 text-white/80 rounded-xl"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ background: "rgba(255, 255, 255, 0.1)" }}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </motion.a>
                  ) : (
                    <motion.a
                      key={item.label}
                      href={item.href}
                      className="block px-4 py-3 text-white/80 rounded-xl"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ background: "rgba(255, 255, 255, 0.1)" }}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </motion.a>
                  )
                ))}
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <motion.div
                    className="mt-2 px-4 py-3 text-center text-white font-semibold rounded-xl"
                    style={{ 
                      fontFamily: "Orbitron, sans-serif",
                      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navItems.length * 0.05 }}
                    whileHover={{ background: "rgba(255, 255, 255, 0.2)" }}
                  >
                    LOGIN
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

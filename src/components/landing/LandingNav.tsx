import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LandingNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const navItems = [
    { label: "HOME", href: "#hero" },
    { label: "SERVICES", href: "#services" },
    { label: "MAGIC AI", href: "#works" },
    { label: "CONTACT", href: "https://wa.me/34625976744", external: true },
  ];

  // Update indicator position when hoveredIndex changes
  useEffect(() => {
    if (hoveredIndex !== null && itemRefs.current[hoveredIndex] && navRef.current) {
      const item = itemRefs.current[hoveredIndex];
      const nav = navRef.current;
      if (item) {
        const itemRect = item.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        setIndicatorStyle({
          left: itemRect.left - navRect.left,
          width: itemRect.width,
        });
      }
    }
  }, [hoveredIndex]);

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      {/* Desktop Navigation - Apple Liquid Glass Segmented Control */}
      <motion.div 
        ref={navRef}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="hidden md:flex items-center gap-0 px-1.5 py-1.5 rounded-full relative"
        style={{
          background: "rgba(255, 255, 255, 0.06)",
          backdropFilter: "blur(40px) saturate(1.8)",
          WebkitBackdropFilter: "blur(40px) saturate(1.8)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: `
            0 0 0 0.5px rgba(255, 255, 255, 0.05) inset,
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 2px 8px rgba(0, 0, 0, 0.2)
          `,
        }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Sliding Glass Indicator - Apple Segmented Control Style */}
        <motion.div
          className="absolute top-1.5 bottom-1.5 rounded-full pointer-events-none"
          initial={false}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            opacity: hoveredIndex !== null ? 1 : 0,
            scaleX: hoveredIndex !== null ? 1 : 0.8,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 0.8,
            opacity: { duration: 0.15 },
          }}
          style={{
            background: "linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.12) 100%)",
            backdropFilter: "blur(20px) saturate(1.5)",
            boxShadow: `
              0 0 0 0.5px rgba(255, 255, 255, 0.3) inset,
              0 1px 0 0 rgba(255, 255, 255, 0.2) inset,
              0 4px 16px rgba(0, 0, 0, 0.2),
              0 2px 4px rgba(0, 0, 0, 0.1)
            `,
            border: "0.5px solid rgba(255, 255, 255, 0.15)",
          }}
        />

        {navItems.map((item, index) => (
          item.external ? (
            <a
              key={item.label}
              ref={(el) => (itemRefs.current[index] = el)}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="relative px-5 py-2.5 text-sm font-medium rounded-full z-10 transition-colors duration-200"
              style={{ 
                fontFamily: "Orbitron, sans-serif",
                color: hoveredIndex === index ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.7)",
              }}
              onMouseEnter={() => setHoveredIndex(index)}
            >
              {item.label}
            </a>
          ) : (
            <a
              key={item.label}
              ref={(el) => (itemRefs.current[index] = el)}
              href={item.href}
              className="relative px-5 py-2.5 text-sm font-medium rounded-full z-10 transition-colors duration-200"
              style={{ 
                fontFamily: "Orbitron, sans-serif",
                color: hoveredIndex === index ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.7)",
              }}
              onMouseEnter={() => setHoveredIndex(index)}
            >
              {item.label}
            </a>
          )
        ))}
        
        {/* Login Button with Glass Morphing Effect */}
        <Link to="/auth" className="ml-1">
          <motion.div
            className="relative px-6 py-2.5 rounded-full overflow-hidden cursor-pointer"
            style={{
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.08) 100%)",
              border: "0.5px solid rgba(255, 255, 255, 0.2)",
              boxShadow: `
                0 0 0 0.5px rgba(255, 255, 255, 0.15) inset,
                0 1px 0 0 rgba(255, 255, 255, 0.1) inset
              `,
            }}
            whileHover={{ 
              scale: 1.02,
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.12) 100%)",
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
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
            background: "rgba(255, 255, 255, 0.06)",
            backdropFilter: "blur(40px) saturate(1.8)",
            WebkitBackdropFilter: "blur(40px) saturate(1.8)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
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
                background: "rgba(255, 255, 255, 0.06)",
                backdropFilter: "blur(40px) saturate(1.8)",
                WebkitBackdropFilter: "blur(40px) saturate(1.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
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
                      background: "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navItems.length * 0.05 }}
                    whileHover={{ background: "rgba(255, 255, 255, 0.15)" }}
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

import { useEffect } from "react";
import { Link } from "react-router-dom";

const STORAGE_BASE = "https://amvbkkbqkzklrcynpwwm.supabase.co/storage/v1/object/public/uploads/9d8f65ef-58ef-47db-be8f-926f26411b39";

export function WebflowLanding() {
  useEffect(() => {
    // Wait for Webflow script to load
    const initWebflow = () => {
      if (window.Webflow) {
        window.Webflow.destroy();
        window.Webflow.ready();
        window.Webflow.require('ix2').init();
        
        // Trigger any scroll-based animations
        window.dispatchEvent(new Event('scroll'));
      }
    };

    // Try to initialize immediately
    initWebflow();
    
    // Also try after a short delay in case the script hasn't loaded yet
    const timeout = setTimeout(initWebflow, 100);
    
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      {/* Logo fisso in alto */}
      <a href="/" className="logo-link-wrapper hide-on-tab brand-2 w-nav-brand w--current">
        <img 
          width="100" 
          height="Auto" 
          alt="" 
          src={`${STORAGE_BASE}/1764321299606-Unvrs-logo-2.png`}
          loading="eager" 
          className="logo"
        />
      </a>

      {/* Navbar */}
      <div data-animation="default" className="navbar w-nav" data-easing2="ease" data-easing="ease" data-collapse="medium" role="banner" data-no-scroll="1" data-duration="400" data-doc-height="1" style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', top: 'auto', width: 'auto', background: 'transparent' }}>
        <div className="nav-container" style={{ background: 'rgba(20, 20, 20, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '50px', padding: '12px 24px', backdropFilter: 'blur(10px)' }}>
          <nav role="navigation" className="nav-menu w-nav-menu" style={{ position: 'static', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <a href="#" className="nav-link-wrapper first w-inline-block w--current" style={{ background: 'white', borderRadius: '30px', padding: '8px 24px' }}>
              <div className="nav-link-block">
                <p className="nav-link" style={{ color: 'black', margin: 0 }}>HOME</p>
              </div>
            </a>
            <a href="#learn-more" className="nav-link-wrapper w-inline-block" style={{ padding: '8px 24px' }}>
              <div className="nav-link-block">
                <p className="nav-link" style={{ margin: 0 }}>ABOUT</p>
              </div>
            </a>
            <a href="#" className="nav-link-wrapper w-inline-block" style={{ padding: '8px 24px' }}>
              <div className="nav-link-block">
                <p className="nav-link" style={{ margin: 0 }}>CONTACT</p>
              </div>
            </a>
            <div className="nav-link-wrapper w-inline-block" style={{ padding: '8px 24px' }}>
              <Link to="/auth" className="nav-link-block">
                <p className="nav-link" style={{ margin: 0 }}>ACCEDI</p>
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="w-layout-blockcontainer hero-container w-container">
          <div id="w-node-_4bb845f3-8c90-60b3-f0d6-cd46e0539714-e0539704" className="hero-block">
            <div className="hero-text-block">
              <div className="hero-text-wrapper">
                <h1 className="hero-text gsap-stagger-loop">Unvrs</h1>
                <h1 className="hero-text gsap-stagger-loop">Labs</h1>
                <h1 className="hero-text gsap-stagger-loop">UNVRS</h1>
              </div>
              <p className="hero-description gsap-stagger-fast">
                Beyond code, we build universes<br />where businesses and AI<br />evolve together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Learn More Section */}
      <section id="learn-more" className="section">
        <div className="w-layout-blockcontainer container padding-9rem w-container">
          <div className="space-10rem"></div>
          <div className="about-block">
            <h2 id="abc" data-w-id="a02e0656-eda3-0dab-54d6-964524599a6c" style={{opacity: 0}} className="intro-text">
              We Don't Just Design for the Present ❌ <span className="gsap-text-highlight">We Craft Experiences for the Future 🔮</span>
            </h2>
            <div className="space-4rem"></div>
            <p className="about-paragraph gsap-stagger-fast">
              <span className="font-transparent">AAAAAA </span>Specializing in developing enterprise software, custom applications, and AI integrations, delivering innovative and scalable solutions that create real value for businesses across all digital platforms.
            </p>
          </div>
        </div>
      </section>

      {/* Works Section */}
      <section className="works-section">
        <div className="w-layout-blockcontainer title-container w-container">
          <h1 className="large-title gsap-stagger-center-on-scroll">Works</h1>
          <div className="space-4rem"></div>
        </div>
        <div className="w-layout-blockcontainer works-container w-container">
          <div className="work-content">
            <p className="about-paragraph">Our portfolio showcases innovative solutions across various industries.</p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section">
        <div className="services-space-top"></div>
        <div className="w-layout-blockcontainer title-container w-container">
          <h1 className="large-title gsap-stagger-center-on-scroll">Services</h1>
          <div className="space-4rem"></div>
        </div>
        <div className="w-layout-blockcontainer service-container w-container">
          <div className="services-grid">
            {[
              { title: "CLOUD & AUTOMATION", desc: "Secure cloud solutions and advanced automations." },
              { title: "APP & WEB SOLUTIONS", desc: "From mobile apps to web platforms, intuitive digital experiences." },
              { title: "AI INTEGRATIONS", desc: "Connect your systems with AI to automate workflows." },
              { title: "SOFTWARE DEVELOPMENT", desc: "Custom enterprise software to streamline operations." }
            ].map((service, i) => (
              <div key={i} className="services-card-text">
                <h2 className="services-title">{service.title}</h2>
                <p className="services-intro-text">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

declare global {
  interface Window {
    Webflow: any;
  }
}

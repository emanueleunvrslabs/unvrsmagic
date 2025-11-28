import { Link } from "react-router-dom";
import logo from "@/assets/landing/unvrs-logo.png";

export function LandingHeader() {
  return (
    <header className="fixed top-6 left-6 z-50">
      <Link to="/" className="block w-12 h-12">
        <img src={logo} alt="Unvrs Labs" className="w-full h-full object-contain" />
      </Link>
    </header>
  );
}

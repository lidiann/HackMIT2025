import { Link, useLocation } from "react-router-dom";
import { Home, Shield, Leaf } from "lucide-react";

export const Navbar = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, path: "/", title: "Dashboard" },
    { icon: Shield, path: "/security", title: "AI Usage Overview" },
    { icon: Leaf, path: "/eco-garden", title: "Eco Garden" }
  ];

  return (
    <div className="chrome-extension-sidebar">
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link key={index} to={item.path} title={item.title}>
            <div
              className={`chrome-nav-item ${
                isActive ? "chrome-nav-active" : ""
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
          </Link>
        );
      })}
    </div>
  );
};
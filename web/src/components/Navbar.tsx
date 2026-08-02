import {useEffect, useRef, useState} from 'react';
import type {Route} from '../App';

type NavbarProps = {
  activeRoute: Route;
  onNavigate: (route: Route) => void;
};

const navItems: Array<{route: Route; label: string}> = [
  {route: 'home', label: 'Home'},
  {route: 'dashboard', label: 'Dashboard'},
  {route: 'composer', label: 'Composer'},
  {route: 'history', label: 'History'},
];

export default function Navbar({activeRoute, onNavigate}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close the mobile menu when navigating.
  const handleNavigate = (route: Route) => {
    setMenuOpen(false);
    onNavigate(route);
  };

  // Close on Escape; return focus to the toggle.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Primary navigation">
        <button className="brand-mark" type="button" onClick={() => handleNavigate('home')}>
          <span className="brand-icon">V</span>
          <span>
            <strong>Vary.video</strong>
            <small>Batch video variants</small>
          </span>
        </button>

        {/* Desktop navigation */}
        <div className="nav-links nav-links-desktop">
          {navItems.map((item) => (
            <button
              key={item.route}
              className={activeRoute === item.route ? 'nav-link active' : 'nav-link'}
              type="button"
              onClick={() => handleNavigate(item.route)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile menu toggle */}
        <button
          ref={menuButtonRef}
          className="nav-menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="nav-menu-icon" aria-hidden="true">
            {menuOpen ? '✕' : '☰'}
          </span>
        </button>
      </nav>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div id="mobile-nav-menu" className="mobile-nav-panel">
          {navItems.map((item) => (
            <button
              key={item.route}
              className={activeRoute === item.route ? 'mobile-nav-link active' : 'mobile-nav-link'}
              type="button"
              onClick={() => handleNavigate(item.route)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

import type {Route} from '../App';

type NavbarProps = {
  activeRoute: Route;
  onNavigate: (route: Route) => void;
};

const navItems: Array<{route: Route; label: string}> = [
  {route: 'home', label: 'Home'},
  {route: 'dashboard', label: 'Dashboard'},
  {route: 'history', label: 'History'},
];

export default function Navbar({activeRoute, onNavigate}: NavbarProps) {
  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Primary navigation">
        <button className="brand-mark" type="button" onClick={() => onNavigate('home')}>
          <span className="brand-icon">V</span>
          <span>
            <strong>Vary.video</strong>
            <small>Batch video variants</small>
          </span>
        </button>

        <div className="nav-links">
          {navItems.map((item) => (
            <button
              key={item.route}
              className={activeRoute === item.route ? 'nav-link active' : 'nav-link'}
              type="button"
              onClick={() => onNavigate(item.route)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}

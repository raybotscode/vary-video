import type {PropsWithChildren} from 'react';
import type {Route} from '../App';
import Footer from './Footer';
import Navbar from './Navbar';

type LayoutProps = PropsWithChildren<{
  activeRoute: Route;
  onNavigate: (route: Route) => void;
}>;

export default function Layout({activeRoute, onNavigate, children}: LayoutProps) {
  return (
    <div className="app-shell">
      <Navbar activeRoute={activeRoute} onNavigate={onNavigate} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

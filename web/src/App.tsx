import {useMemo, useState} from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import RenderHistory from './pages/RenderHistory';

export type Route = 'home' | 'dashboard' | 'history';

const routeFromPath = (pathname: string): Route => {
  if (pathname.startsWith('/dashboard')) {
    return 'dashboard';
  }

  if (pathname.startsWith('/history')) {
    return 'history';
  }

  return 'home';
};

const pathFromRoute = (route: Route): string => {
  if (route === 'dashboard') {
    return '/dashboard';
  }

  if (route === 'history') {
    return '/history';
  }

  return '/';
};

export default function App() {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname));
  const title = useMemo(() => {
    if (route === 'dashboard') {
      return 'Dashboard';
    }

    if (route === 'history') {
      return 'Render History';
    }

    return 'Home';
  }, [route]);

  const navigate = (nextRoute: Route) => {
    setRoute(nextRoute);
    window.history.pushState(null, '', pathFromRoute(nextRoute));
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  window.onpopstate = () => setRoute(routeFromPath(window.location.pathname));

  return (
    <Layout activeRoute={route} onNavigate={navigate}>
      {route === 'home' && <Home onGetStarted={() => navigate('dashboard')} />}
      {route === 'dashboard' && <Dashboard />}
      {route === 'history' && <RenderHistory />}
      <span className="sr-only">{title}</span>
    </Layout>
  );
}

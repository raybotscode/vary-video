import {useMemo, useState} from 'react';
import Layout from './components/Layout';
import {ToastProvider} from './components/ui/ToastProvider';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import RenderHistory from './pages/RenderHistory';
import SceneComposer from './pages/SceneComposer';
import V2Editor from './pages/V2Editor';

export type Route = 'home' | 'dashboard' | 'composer' | 'history' | 'v2-editor';

const routeFromPath = (pathname: string): Route => {
  if (pathname.startsWith('/dashboard')) {
    return 'dashboard';
  }

  if (pathname.startsWith('/composer')) {
    return 'composer';
  }

  if (pathname.startsWith('/history')) {
    return 'history';
  }

  if (pathname.startsWith('/v2-editor')) {
    return 'v2-editor';
  }

  return 'home';
};

const pathFromRoute = (route: Route): string => {
  if (route === 'dashboard') {
    return '/dashboard';
  }

  if (route === 'composer') {
    return '/composer';
  }

  if (route === 'history') {
    return '/history';
  }

  if (route === 'v2-editor') {
    return '/v2-editor';
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

    if (route === 'composer') {
      return 'Scene Composer';
    }

    if (route === 'v2-editor') {
      return 'v2 Editor';
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
    <ToastProvider>
      <Layout activeRoute={route} onNavigate={navigate}>
        {route === 'home' && (
          <Home
            onGetStarted={() => navigate('dashboard')}
            onOpenComposer={() => navigate('composer')}
          />
        )}
        {route === 'dashboard' && <Dashboard />}
        {route === 'composer' && <SceneComposer />}
        {route === 'history' && <RenderHistory />}
        <span className="sr-only">{title}</span>
      </Layout>
      {route === 'v2-editor' && <V2Editor />}
    </ToastProvider>
  );
}

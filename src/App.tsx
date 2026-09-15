import { BrowserRouter } from 'react-router-dom';
import Providers from '@/app/providers';
import AppRouter from '@/app/router';
import MobileBottomNav from '@/components/MobileBottomNav';

const App = () => (
  <BrowserRouter>
    <Providers>
      <AppRouter />
      <MobileBottomNav />
      <div className="md:hidden h-16" aria-hidden />
    </Providers>
  </BrowserRouter>
);

export default App;

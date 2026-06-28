import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import TwedotLanding from './Twedotlanding ';
import AboutPage from './pages/AboutPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import CareersPage from './pages/CareersPage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import ChildSafetyPage from './pages/ChildSafetyPage';
import UserLinkPage from './pages/UserLinkPage';
import StarField from './components/StarField';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <StarField />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Routes>
            <Route path="/" element={<TwedotLanding />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/delete-account" element={<DeleteAccountPage />} />
            <Route path="/child-safety" element={<ChildSafetyPage />} />
            <Route path="/u/:token" element={<UserLinkPage />} />
          </Routes>
        </div>
      </ThemeProvider>
    </BrowserRouter>
  );
}

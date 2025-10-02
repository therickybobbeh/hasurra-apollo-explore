import { ApolloProvider } from '@apollo/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { apolloClient } from './apollo/client';
import { RoleProvider } from './context/RoleContext';
import { RoleSwitcher } from './components/RoleSwitcher';
import { ClaimsList } from './components/ClaimsList';
import { ClaimDetail } from './components/ClaimDetail';
import { EligibilityPanel } from './components/EligibilityPanel';
import { ProviderRatings } from './components/ProviderRatings';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link to="/" className="flex items-center text-xl font-bold text-blue-600">
                ClaimSight
              </Link>
              <Link to="/" className="flex items-center text-gray-700 hover:text-gray-900">
                Claims
              </Link>
              <Link to="/eligibility" className="flex items-center text-gray-700 hover:text-gray-900">
                Eligibility
              </Link>
              <Link to="/ratings" className="flex items-center text-gray-700 hover:text-gray-900">
                <span className="mr-1">⭐</span> Ratings
              </Link>
            </div>
            <div className="flex items-center">
              <RoleSwitcher />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <RoleProvider>
      <ApolloProvider client={apolloClient}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<ClaimsList />} />
              <Route path="/claims/:id" element={<ClaimDetail />} />
              <Route path="/eligibility" element={<EligibilityPanel />} />
              <Route path="/ratings" element={<ProviderRatings />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ApolloProvider>
    </RoleProvider>
  );
}

export default App;

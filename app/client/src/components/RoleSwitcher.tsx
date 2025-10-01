/**
 * Role Switcher Component
 * Dropdown to switch between test users/roles in dev mode
 */

import { useState } from 'react';
import { useRole } from '../context/RoleContext';

export function RoleSwitcher() {
  const { currentUser, setCurrentUser, testUsers } = useRole();
  const [isOpen, setIsOpen] = useState(false);

  const handleUserChange = (newUser: typeof currentUser) => {
    setCurrentUser(newUser);
    setIsOpen(false);
    // Reload to apply new role (Apollo client needs to reconnect)
    window.location.reload();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'member':
        return 'bg-blue-100 text-blue-800';
      case 'provider':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${getRoleColor(
          currentUser.role
        )} hover:opacity-80`}
      >
        <span>{currentUser.label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-20 border border-gray-200">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Switch User/Role</p>
            </div>
            <div className="py-1">
              {testUsers.map((user, index) => (
                <button
                  key={index}
                  onClick={() => handleUserChange(user)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                    currentUser.label === user.label ? 'bg-gray-50' : ''
                  }`}
                >
                  <span>{user.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(user.role)}`}
                  >
                    {user.role}
                  </span>
                </button>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                💡 Switch roles to test permissions
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

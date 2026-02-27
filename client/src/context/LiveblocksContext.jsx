import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@liveblocks/client';
import { LiveblocksProvider as BaseLiveblocksProvider } from '@liveblocks/react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LiveblocksContext = createContext();

export const useLiveblocks = () => {
  const context = useContext(LiveblocksContext);
  if (!context) {
    throw new Error('useLiveblocks must be used within LiveblocksProvider');
  }
  return context;
};

export const LiveblocksProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initClient = () => {
      try {
        // Create Liveblocks client with auth endpoint
        const liveblocksClient = createClient({
          authEndpoint: async (room) => {
            try {
              // Extract planId from room name (format: plan:planId)
              const planId = room.split(':')[1];

              const response = await axios.post(
                `${API_URL}/collaboration/auth`,
                { planId },
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );

              return response.data.token;
            } catch (err) {
              console.error('Auth endpoint error:', err);
              throw new Error('Failed to get auth token for collaboration');
            }
          }
        });

        setClient(liveblocksClient);
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize Liveblocks client:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initClient();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing collaboration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="font-semibold mb-2">Failed to initialize collaboration</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <BaseLiveblocksProvider client={client}>
      <LiveblocksContext.Provider value={{ client }}>
        {children}
      </LiveblocksContext.Provider>
    </BaseLiveblocksProvider>
  );
};

export default LiveblocksProvider;

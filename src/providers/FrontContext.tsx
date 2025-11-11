import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Front from '@frontapp/plugin-sdk';
import type { ApplicationContext } from '@frontapp/plugin-sdk';

interface FrontContextType {
  context: ApplicationContext | null;
  loading: boolean;
}

const FrontContext = createContext<FrontContextType>({
  context: null,
  loading: true,
});

export function useFrontContext() {
  return useContext(FrontContext);
}

interface FrontContextProviderProps {
  children: ReactNode;
}

export function FrontContextProvider({ children }: FrontContextProviderProps) {
  const [context, setContext] = useState<ApplicationContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscription = Front.contextUpdates.subscribe((frontContext) => {
      setContext(frontContext);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <FrontContext.Provider value={{ context, loading }}>
      {children}
    </FrontContext.Provider>
  );
}

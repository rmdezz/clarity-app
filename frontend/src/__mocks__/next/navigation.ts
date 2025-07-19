// /src/__mocks__/next/navigation.ts
import mockRouter from 'next-router-mock';

// Exportamos los mocks para cada hook que usamos
export const useRouter = () => mockRouter;
export const usePathname = () => mockRouter.pathname;
export const useSearchParams = () => new URLSearchParams(mockRouter.query as Record<string, string>);
export const useParams = () => mockRouter.query; // next-router-mock usa 'query' para los parámetros de ruta
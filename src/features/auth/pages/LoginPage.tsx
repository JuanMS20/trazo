import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onNavigate?: any; // Deprecated, kept for interface compatibility if needed
}

export const LoginPage: React.FC<LoginProps> = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-cream overflow-hidden">
      {/* Decorative Doodles */}
      <div className="absolute top-12 left-12 text-gray-300 animate-pulse">
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M10 10 Q 50 50 90 10" />
          <path d="M10 30 Q 50 70 90 30" />
          <circle cx="20" cy="80" r="5" />
          <circle cx="40" cy="70" r="3" />
        </svg>
      </div>
      
      <div className="absolute bottom-12 right-12 text-gray-300 rotate-180">
         <svg width="150" height="150" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M80 80 C 60 60, 40 90, 20 70" />
          <path d="M85 85 L 95 95" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="bg-white p-10 border-2 border-off-black shadow-offset-hard rounded-[20px_24px_22px_23px/23px_21px_25px_20px]">
          <h1 className="font-caveat text-7xl font-bold text-center text-off-black mb-2">Trazo</h1>
          <p className="font-serif text-lg text-center text-gray-600 mb-10">
            Convierte tus palabras en diagramas al instante.
          </p>

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-white border-2 border-off-black rounded-[10px_12px_11px_13px/11px_10px_13px_12px] hover:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-[1px] transition-all font-bold text-off-black"
          >
             <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.059 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.489 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.989 -25.464 56.619 L -21.484 53.529 Z" />
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.799 L -6.734 42.379 C -8.804 40.439 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
              </g>
            </svg>
            Continuar con Google
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 flex gap-6 text-sm font-bold text-gray-500">
        <button onClick={() => alert('Abriendo Términos de Servicio...')} className="hover:text-off-black transition-colors">Terms of Service</button>
        <button onClick={() => alert('Abriendo Política de Privacidad...')} className="hover:text-off-black transition-colors">Privacy Policy</button>
      </div>
    </div>
  );
};

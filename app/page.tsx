'use client';

import dynamic from 'next/dynamic';

// Importar o componente dinamicamente para evitar erros de SSR
// já que o Web Speech API só funciona no lado do cliente
const Translator = dynamic(() => import('./components/Translator'), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <main className="container mx-auto">
        <Translator />
      </main>
    </div>
  );
}
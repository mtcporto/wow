"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <h1>Não foi possível abrir esta página</h1>
      <p>Tente novamente para continuar explorando Azeroth.</p>
      <button className="back-btn" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}

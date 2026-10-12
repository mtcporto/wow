import { assetPath } from "@/lib/paths";
export default function NotFound() {
  return (
    <main>
      <h1>Página não encontrada</h1>
      <a className="back-btn" href={assetPath("/")}>
        Voltar às classes
      </a>
    </main>
  );
}

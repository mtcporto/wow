import { PetsShell } from "@/features/legacy/pets-shell";
import { CatalogueRuntime } from "@/features/legacy/runtime";
export const metadata = { title: "Battle pets" };
export default function PetsPage() {
  return (
    <>
      <PetsShell />
      <CatalogueRuntime kind="pets" />
    </>
  );
}

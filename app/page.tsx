import { InventoryForm } from "@/components/inventory-form";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20">
      <InventoryForm />
    </main>
  );
}

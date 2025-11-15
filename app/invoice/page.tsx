import { Suspense } from "react";
import Invoice from "../components/Invoice";

export default function InvoicePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Invoice />
    </Suspense>
  );
}


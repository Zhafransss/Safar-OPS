import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getViewer } from "@/server/services/viewer";

export const dynamic = "force-dynamic";

// No mockup screen exists for login (CHANGELOG 16); it reuses the Beranda header and card.
export default async function LoginPage() {
  const viewer = await getViewer();
  if (viewer) redirect("/");

  return (
    <>
      <div className="home-hd">
        <div>
          <div className="h1">SAFAR OPS 2</div>
          <div className="hi">Masuk untuk melanjutkan</div>
        </div>
      </div>
      <div style={{ margin: "-40px 14px 0" }}>
        <LoginForm />
      </div>
    </>
  );
}

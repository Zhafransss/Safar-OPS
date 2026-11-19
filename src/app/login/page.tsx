import { redirect } from "next/navigation";

import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icons";
import { LoginForm } from "@/components/login-form";
import { getViewer } from "@/server/services/viewer";

export const dynamic = "force-dynamic";

// The places on Beranda, shown beside the form on desktop.
const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: "list", title: "Tugas", text: "Program dan to-do tim" },
  { icon: "chat", title: "Laporan", text: "Lapor dan tanggapi" },
  { icon: "users", title: "Tim", text: "Susunan tim" },
];

// No mockup screen exists for login (CHANGELOG 16); on phones it reuses the Beranda header and card.
// From 1024 px the brand panel sits on the left and the form on the right (CHANGELOG 45); below that
// .auth and .auth-main add no box and the desktop-only parts are hidden.
export default async function LoginPage() {
  const viewer = await getViewer();
  if (viewer) redirect("/");

  return (
    <div className="auth">
      <section className="auth-brand">
        <div className="auth-logo">HRIS</div>
        <p className="auth-tag">Laporan dan penugasan tim Saeful Askar</p>
        <ul className="auth-points">
          {FEATURES.map((feature) => (
            <li key={feature.title}>
              <span className="auth-ico">
                <Icon name={feature.icon} size={20} />
              </span>
              <span>
                <b>{feature.title}</b>
                <small>{feature.text}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <div className="auth-main">
        <div className="home-hd auth-phone-hd">
          <div>
            <div className="h1">HRIS</div>
            <div className="hi">Masuk untuk melanjutkan</div>
          </div>
        </div>
        <div className="auth-form">
          <div className="auth-title">
            <b>Masuk</b>
            <span>Masuk untuk melanjutkan</span>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

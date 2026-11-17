import { redirect } from "next/navigation";

// The hub was removed by 02-navigasi-penugasan; old links land on Beranda (CHANGELOG 26).
export default function HubPage() {
  redirect("/");
}

import { redirect } from "next/navigation";

// proxy.ts redirige a /login si no hay sesión
export default function Home() {
  redirect("/causas");
}

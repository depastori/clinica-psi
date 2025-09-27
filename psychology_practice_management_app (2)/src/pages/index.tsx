import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (userId) {
      // Se já está logado → vai para dashboard
      router.replace("/dashboard");
    } else {
      // Se não está logado → vai para login
      router.replace("/login");
    }
  }, [router]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      Redirecionando...
    </div>
  );
}

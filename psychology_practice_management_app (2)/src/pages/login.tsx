import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();
  const login = useMutation(api.auth.login);

  const [identity, setIdentity] = useState(""); // email OU username
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login({ identity, password });
localStorage.setItem("userId", user.userId); // 🔹 
alert(`Bem-vindo, ${user.username || user.email}`);
router.push("/dashboard"); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Login</h1>
        <form onSubmit={handleSubmit} style={formStyle}>
          <input
            style={inputStyle}
            placeholder="Usuário ou Email"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p style={{ color: "red", marginTop: "-5px" }}>{error}</p>}
          <button style={btnStyle} type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p style={footerText}>
          Não tem conta? <a href="/register" style={linkStyle}>Registrar</a>
        </p>
      </div>
    </div>
  );
}

// --- mesmos estilos do register ---
const pageStyle = { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f3f4f6" };
const cardStyle = { background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", width: "350px", textAlign: "center" };
const titleStyle = { marginBottom: "20px", fontSize: "24px", fontWeight: 600, color: "#111827" };
const formStyle = { display: "flex", flexDirection: "column", gap: "12px" };
const inputStyle = { padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px" };
const btnStyle = { padding: "10px", background: "#2563eb", color: "white", fontWeight: 500, border: "none", borderRadius: "6px", cursor: "pointer" };
const footerText = { marginTop: "15px", fontSize: "14px" };
const linkStyle = { color: "#2563eb", textDecoration: "none" };

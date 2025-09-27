import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();
  const login = useMutation(api.auth.login);

  const [identity, setIdentity] = useState(""); // email OU username
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login({ identity, password });
      alert(`Bem-vindo, ${user.username || user.email}!`);
      // Aqui você pode salvar userId no storage ou contexto
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={containerStyle}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit} style={formStyle}>
        <input
          placeholder="Usuário ou Email"
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={btnStyle} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p>
        Não tem conta? <a href="/register">Registrar</a>
      </p>
    </div>
  );
}

const containerStyle = { maxWidth: "400px", margin: "50px auto", textAlign: "center" };
const formStyle = { display: "flex", flexDirection: "column", gap: "12px" };
const inputStyle = { padding: "10px", borderRadius: "6px", border: "1px solid #ccc" };
const btnStyle = {
  padding: "10px 16px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "500",
};

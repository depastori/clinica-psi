import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/router";

export default function RegisterPage() {
  const router = useRouter();
  const register = useMutation(api.auth.register);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({ username: username || undefined, email: email || undefined, password });
      alert("Usuário criado com sucesso!");
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={containerStyle}>
      <h1>Cadastro</h1>
      <form onSubmit={handleSubmit} style={formStyle}>
        <input
          placeholder="Usuário (opcional)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />
        <input
          type="email"
          placeholder="Email (opcional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          {loading ? "Registrando..." : "Registrar"}
        </button>
      </form>
      <p>
        Já tem conta? <a href="/login">Fazer login</a>
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

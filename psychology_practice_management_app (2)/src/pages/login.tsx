import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export default function LoginPage() {
  const login = useMutation(api.auth.login);
  const [form, setForm] = useState({ identity: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(form);
      alert("Bem-vindo " + (user.username || user.email));
      window.location.href = "/dashboard";
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "400px", margin: "0 auto" }}>
      <h1>🔐 Login</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input placeholder="Email ou Usuário" value={form.identity} onChange={(e) => setForm({ ...form, identity: e.target.value })} />
        <input type="password" placeholder="Senha" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button type="submit" style={{ padding: "10px", background: "#059669", color: "white" }}>Entrar</button>
      </form>
    </div>
  );
}

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export default function RegisterPage() {
  const register = useMutation(api.auth.register);
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username && !form.email) {
      alert("Informe ao menos email ou nome de usuário");
      return;
    }
    try {
      await register(form);
      alert("Cadastro realizado! Faça login.");
      window.location.href = "/login";
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "400px", margin: "0 auto" }}>
      <h1>📝 Cadastro</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input placeholder="Nome de usuário (opcional)" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input type="email" placeholder="Email (opcional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Senha" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button type="submit" style={{ padding: "10px", background: "#2563eb", color: "white" }}>Cadastrar</button>
      </form>
    </div>
  );
}

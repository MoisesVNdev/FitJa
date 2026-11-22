import { signIn, updatePassword, requestPasswordReset } from "../../../shared/api/identity";
import { useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { isAdmin } from "../../../shared/api/admin";
import { Notice } from "../../../shared/ui";

export default function Login({
  onSuccess,
  recovering = false,
}: {
  onSuccess: () => void;
  recovering?: boolean;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (recovering) {
        await updatePassword(password);
        location.hash = "";
        setMessage("Senha atualizada.");
        onSuccess();
        return;
      }
      await signIn(email, password);
      if (!(await isAdmin()))
        throw new Error("Esta conta não tem acesso ao painel.");
      onSuccess();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    setError("");
    if (!email) {
      setError("Preencha seu e-mail para recuperar o acesso.");
      return;
    }
    setBusy(true);
    try {
      await requestPasswordReset(email, `${location.origin}/admin`);
      setMessage(
        "Se este e-mail estiver cadastrado, você receberá as instruções.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <a href="/" className="back-link">
        <ArrowLeft size={17} />
        Voltar ao cardápio
      </a>
      <form className="login-card" onSubmit={(e) => void submit(e)}>
        <img src="/media/logo.webp" alt="Fit Já" width="76" height="76" />
        <span className="eyebrow">SUA COZINHA DIGITAL</span>
        <h1>{recovering ? "Uma nova senha" : "Bom ter você aqui."}</h1>
        <p>Entre para cuidar do cardápio e dos pedidos.</p>
        {!recovering && (
          <label className="field">
            E-mail
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        )}
        <label className="field">
          {recovering ? "Nova senha" : "Senha"}
          <input
            type="password"
            minLength={8}
            autoComplete={recovering ? "new-password" : "current-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <Notice error>{error}</Notice>}
        {message && <Notice>{message}</Notice>}
        <button className="button primary full" disabled={busy}>
          {busy
            ? "Aguarde…"
            : recovering
              ? "Atualizar senha"
              : "Entrar no painel"}
        </button>
        {!recovering && (
          <button
            type="button"
            className="text-button full"
            disabled={busy}
            onClick={() => void reset()}
          >
            Esqueci minha senha
          </button>
        )}
      </form>
    </main>
  );
}


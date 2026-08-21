import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { Button, Field, Input } from '@/ui/controls';
import './login.css';

/** Sign-in — uses the existing backend auth (POST /api/auth/login). */
export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="av-login">
      <form className="av-login__card" onSubmit={submit}>
        <div className="av-login__brand">
          <span className="av-brand__mark">AV</span>
          <span className="av-login__name">AV OS</span>
        </div>
        <h1 className="av-login__title">Sign in to your console</h1>
        {error && <p className="av-login__error" role="alert">{error}</p>}
        <Field label="Email">
          <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Button type="submit" loading={busy} style={{ width: '100%' }}>Sign in</Button>
      </form>
    </div>
  );
}

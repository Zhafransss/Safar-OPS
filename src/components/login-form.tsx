"use client";

import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";

import { useTRPC } from "@/lib/trpc-client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const trpc = useTRPC();
  const login = useMutation(
    trpc.auth.login.mutationOptions({
      onSuccess: () => window.location.assign("/"),
    }),
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    login.mutate({ email, password });
  }

  return (
    <form className="card" onSubmit={submit}>
      {login.error && (
        <div className="alert err" role="alert" style={{ marginBottom: 10 }}>
          {login.error.message.startsWith("PNG-")
            ? login.error.message
            : "PNG-AUT-02: Layanan login sedang bermasalah. Coba lagi."}
        </div>
      )}
      <label className="lab" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        className="inp"
        type="email"
        autoComplete="username"
        inputMode="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label className="lab mt" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        className="inp"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="btn block mt2" type="submit" disabled={login.isPending}>
        {login.isPending ? "Memeriksa..." : "Masuk"}
      </button>
      <p className="small muted" style={{ margin: "10px 0 0", textAlign: "center" }}>
        Gunakan akun Jubelio Anda.
      </p>
    </form>
  );
}

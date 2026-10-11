"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "./store-provider";

export default function AuthForm({ mode }) {
  const isLogin = mode === "login";
  const { signIn, register, session, authReady } = useStore();
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authReady && session) router.replace(session.role === "admin" ? "/admin" : "/");
  }, [authReady, session, router]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    if (!isLogin && data.get("password") !== data.get("confirmPassword")) {
      setError("Mật khẩu xác nhận chưa khớp.");
      form.elements.confirmPassword.focus();
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        const user = await signIn(data.get("email"), data.get("password"));
        const next = new URLSearchParams(window.location.search).get("next");
        router.push(user.role === "admin" && next === "admin" ? "/admin" : user.role === "admin" ? "/admin" : "/");
      } else {
        const { session: registeredSession } = await register({
          name: data.get("name"),
          email: data.get("email"),
          password: data.get("password"),
        });
        if (registeredSession) {
          router.push("/");
        } else {
          setSuccess("Đăng ký thành công. Nếu Supabase yêu cầu xác nhận email, hãy mở email để kích hoạt tài khoản trước khi đăng nhập.");
        }
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="container auth-page"><section className="auth-card" aria-labelledby="auth-title"><Link className="auth-logo" href="/">Mini Shop</Link><h1 id="auth-title">{isLogin ? "Chào mừng trở lại" : "Tạo tài khoản"}</h1><p className="auth-intro">{isLogin ? "Đăng nhập để tiếp tục mua sắm cùng Mini Shop." : "Đăng ký để lưu sản phẩm yêu thích và mua sắm dễ dàng hơn."}</p>
    <form onSubmit={submit}>
      {!isLogin && <div className="checkout-field"><label htmlFor="register-name">Họ và tên</label><input id="register-name" name="name" autoComplete="name" placeholder="Nguyễn Văn An" minLength="2" maxLength="100" required /></div>}
      <div className="checkout-field"><label htmlFor="auth-email">Email</label><input id="auth-email" name="email" type="email" autoComplete={isLogin ? "username" : "email"} placeholder="name@example.com" required /></div>
      <div className="checkout-field"><label htmlFor="auth-password">Mật khẩu</label><input id="auth-password" name="password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} placeholder={isLogin ? "Nhập mật khẩu" : "Tối thiểu 6 ký tự"} minLength={isLogin ? undefined : 6} required /></div>
      {!isLogin && <div className="checkout-field"><label htmlFor="confirm-password">Xác nhận mật khẩu</label><input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu" minLength="6" required /></div>}
      <p className="auth-error" role="alert">{error}</p>{success && <p className="auth-success" role="status">{success}</p>}<button className="btn btn-primary-blue auth-submit" type="submit" disabled={submitting}>{submitting ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Tạo tài khoản"}</button>
    </form>
    <p className="auth-switch">{isLogin ? <>Chưa có tài khoản? <Link href="/register">Đăng ký ngay</Link></> : <>Đã có tài khoản? <Link href="/login">Đăng nhập</Link></>}</p>
  </section></main>;
}

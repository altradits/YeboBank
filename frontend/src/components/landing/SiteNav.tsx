"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function SiteNav() {
  const router = useRouter();
  return (
    <nav className="nav">
      <div className="wrap">
        <Link href="/" className="brand">
          <span className="mk">Y</span> YeboBank
        </Link>
        <div className="navlinks">
          <a href="#save">Savings</a>
          <a href="#mpesa">M-Pesa</a>
          <a href="#chama">Chamas</a>
          <a href="#agents">Agents</a>
          <a href="#convert">Convert</a>
        </div>
        <div className="navactions">
          <Link className="login" href="/login">Log in</Link>
          <Button onClick={() => router.push("/register")}>Open account</Button>
        </div>
      </div>
    </nav>
  );
}

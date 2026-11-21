"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/storefront/auth-provider";
import { Link } from "@/i18n/navigation";
import { LoginOtpForm } from "@/components/storefront/login-otp-form";

export default function AccountLoginPage() {
  const t = useTranslations("account");
  const router = useRouter();
  const { customer } = useAuth();

  useEffect(() => {
    if (customer) router.replace("/account");
  }, [customer, router]);

  return (
    <div className="bg-[#f6f7f5]">
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-[1.6rem] bg-white p-6 shadow-[0_10px_36px_rgba(17,17,17,0.04)] ring-1 ring-black/[0.04] md:p-8">
          <LoginOtpForm heading="h1" onSuccess={() => router.push("/account")} />
        </div>
        <p className="mt-6 text-center text-sm text-ink-muted">
          {t("guest")}{" "}
          <Link href="/track-order" className="font-medium text-brand-dark hover:underline">
            {t("trackHint")}
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PAGE_PATHS } from "@/features/bible/routes";
import { Link, useRouter } from "@/i18n/navigation";
import { signIn, signUp, useSession } from "./auth-client";

type Mode = "signIn" | "signUp";

type ErrorKey =
  | "generic"
  | "invalidCredentials"
  | "userExists"
  | "passwordTooShort"
  | "invalidEmail"
  | "tooManyRequests"
  | "googleLinked"
  | "google";

/** Only same-site, locale-relative paths; anything else could send the reader off-site. */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\"))
    return "/";
  return value === PAGE_PATHS.signIn ? "/" : value;
}

function errorKeyFor(error: { code?: string; status?: number }): ErrorKey {
  if (error.status === 429) return "tooManyRequests";
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "invalidCredentials";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "userExists";
    case "PASSWORD_TOO_SHORT":
      return "passwordTooShort";
    case "INVALID_EMAIL":
      return "invalidEmail";
    default:
      return "generic";
  }
}

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function CredentialsForm({ mode, next }: { mode: Mode; next: string }) {
  const t = useTranslations("Account");
  const router = useRouter();
  const id = useId();
  const [error, setError] = useState<ErrorKey | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    setPending(true);
    setError(null);
    const result =
      mode === "signUp"
        ? await signUp.email({ name: String(data.get("name") ?? "").trim(), email, password })
        : await signIn.email({ email, password });
    setPending(false);
    if (result.error) {
      setError(errorKeyFor(result.error));
      return;
    }
    router.replace(next);
  };

  const errorId = `${id}-error`;
  const describedBy = error ? errorId : undefined;

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate={false}>
      {mode === "signUp" && (
        <div className="grid gap-2">
          <Label htmlFor={`${id}-name`}>{t("name")}</Label>
          <Input
            id={`${id}-name`}
            name="name"
            autoComplete="name"
            required
            maxLength={80}
            className="h-11 sm:h-9"
          />
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor={`${id}-email`}>{t("email")}</Label>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          aria-describedby={describedBy}
          aria-invalid={error === "invalidEmail" || error === "invalidCredentials" || undefined}
          className="h-11 sm:h-9"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-password`}>{t("password")}</Label>
        <Input
          id={`${id}-password`}
          name="password"
          type="password"
          autoComplete={mode === "signUp" ? "new-password" : "current-password"}
          required
          minLength={mode === "signUp" ? 8 : undefined}
          maxLength={128}
          aria-describedby={
            [mode === "signUp" ? `${id}-hint` : "", describedBy ?? ""].join(" ").trim() || undefined
          }
          aria-invalid={error === "passwordTooShort" || error === "invalidCredentials" || undefined}
          className="h-11 sm:h-9"
        />
        {mode === "signUp" && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {t("passwordHint")}
          </p>
        )}
      </div>
      {error && (
        <Alert variant="destructive" id={errorId}>
          <AlertDescription>{t(`errors.${error}`)}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="touch" className="sm:h-9" disabled={pending} aria-busy={pending}>
        {pending && <Spinner aria-hidden />}
        {t(mode === "signUp" ? "submitSignUp" : "submitSignIn")}
      </Button>
      {mode === "signIn" && <p className="text-xs text-muted-foreground">{t("forgotPassword")}</p>}
    </form>
  );
}

export function SignInForm() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const { data: session } = useSession();
  const [mode, setMode] = useState<Mode>("signIn");
  const [googlePending, setGooglePending] = useState(false);
  const callbackError = searchParams.get("error");

  if (session) {
    return (
      <div className="grid gap-4">
        <p>{t("signedInAs", { name: session.user.name })}</p>
        <Button asChild size="touch" className="sm:h-9">
          <Link href={next}>{t("backToReading")}</Link>
        </Button>
      </div>
    );
  }

  const onGoogle = async () => {
    setGooglePending(true);
    const callbackURL = `/${locale}${next === "/" ? "" : next}`;
    const { error } = await signIn.social({
      provider: "google",
      callbackURL,
      errorCallbackURL: `/${locale}${PAGE_PATHS.signIn}`,
    });
    if (error) setGooglePending(false);
  };

  return (
    <div className="grid gap-6">
      {callbackError && (
        <Alert variant="destructive">
          <AlertDescription>
            {t(callbackError === "account_not_linked" ? "errors.googleLinked" : "errors.google")}
          </AlertDescription>
        </Alert>
      )}
      <Button
        variant="outline"
        size="touch"
        className="gap-2 sm:h-10"
        onClick={() => void onGoogle()}
        disabled={googlePending}
        aria-busy={googlePending}
      >
        {googlePending ? <Spinner aria-hidden /> : <GoogleIcon />}
        {t("continueWithGoogle")}
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        {t("or")}
        <Separator className="flex-1" />
      </div>

      <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)} className="gap-4">
        <TabsList className="h-11! w-full sm:h-9!">
          <TabsTrigger value="signIn">{t("tabSignIn")}</TabsTrigger>
          <TabsTrigger value="signUp">{t("tabSignUp")}</TabsTrigger>
        </TabsList>
        <TabsContent value="signIn">
          <CredentialsForm mode="signIn" next={next} />
        </TabsContent>
        <TabsContent value="signUp">
          <CredentialsForm mode="signUp" next={next} />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-pretty text-muted-foreground">
        {t.rich("agreement", {
          terms: (chunks) => (
            <Link
              href={PAGE_PATHS.terms}
              className="underline underline-offset-4 hover:text-foreground"
            >
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link
              href={PAGE_PATHS.privacy}
              className="underline underline-offset-4 hover:text-foreground"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}

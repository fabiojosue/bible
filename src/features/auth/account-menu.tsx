"use client";

import { CloudIcon, CloudOffIcon, LogInIcon, RefreshCwIcon } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { PAGE_PATHS } from "@/features/bible/routes";
import { syncNow } from "@/features/sync/engine";
import { useSync } from "@/features/sync/store";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { deleteUser, signOut, useSession } from "./auth-client";

/** Sign-in path that returns to `pathname` afterwards. */
export function signInHref(pathname: string): string {
  return pathname === "/" || pathname === PAGE_PATHS.signIn
    ? PAGE_PATHS.signIn
    : `${PAGE_PATHS.signIn}?next=${encodeURIComponent(pathname)}`;
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

function SyncStatusLine() {
  const t = useTranslations("Account.syncStatus");
  const format = useFormatter();
  const status = useSync((state) => state.status);
  const lastSyncedAt = useSync((state) => state.lastSyncedAt);
  const now = useNow({ updateInterval: 10_000 });

  const offline = status === "offline" || status === "error";
  const Icon = offline ? CloudOffIcon : CloudIcon;
  let label: string;
  if (status === "syncing") label = t("syncing");
  else if (status === "offline") label = t("offline");
  else if (status === "error") label = t("error");
  else if (lastSyncedAt)
    label = t("synced", { time: format.relativeTime(Math.min(lastSyncedAt, now.getTime()), now) });
  else label = t("idle");

  return (
    <p
      role="status"
      className={cn(
        "flex items-start gap-2 px-2 py-1.5 text-xs text-muted-foreground",
        offline && "text-destructive",
      )}
    >
      <Icon aria-hidden className="mt-px size-3.5 shrink-0" />
      {label}
    </p>
  );
}

/** Header entry point: a sign-in link, or the account menu once signed in. */
export function AccountMenu({ className }: { className?: string }) {
  const t = useTranslations("Account");
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (isPending) {
    return <Skeleton aria-hidden className={cn("size-8 rounded-full", className)} />;
  }

  if (!session) {
    return (
      <Button asChild variant="ghost" className={cn("gap-1.5 px-2.5", className)}>
        <Link href={signInHref(pathname)}>
          <LogInIcon aria-hidden />
          <span className="max-lg:sr-only">{t("signIn")}</span>
        </Link>
      </Button>
    );
  }

  const { user } = session;

  const onSignOut = async () => {
    await syncNow();
    await signOut();
    useSync.getState().clear();
    toast.success(t("signedOut"));
  };

  const onDelete = async () => {
    setDeleting(true);
    const { error } = await deleteUser();
    setDeleting(false);
    if (error) {
      // Deleting requires a recent sign-in.
      toast.error(t(error.code === "SESSION_NOT_FRESH" ? "errors.signInAgain" : "errors.generic"));
      return;
    }
    setConfirmDelete(false);
    useSync.getState().clear();
    toast.success(t("deleted"));
  };

  return (
    <>
      {/* Non-modal: a modal menu locks the page, and opening the dialog from it would keep that lock. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-touch"
            className={cn("rounded-full lg:size-9", className)}
            aria-label={t("menuLabel", { name: user.name })}
          >
            <Avatar className="size-7">
              {user.image && <AvatarImage src={user.image} alt="" referrerPolicy="no-referrer" />}
              <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="grid gap-0.5">
            <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
          <SyncStatusLine />
          <DropdownMenuSeparator />
          <DropdownMenuItem className="min-h-10 sm:min-h-8" onSelect={() => void syncNow()}>
            <RefreshCwIcon aria-hidden />
            {t("syncNow")}
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-10 sm:min-h-8" onSelect={() => void onSignOut()}>
            {t("signOut")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="min-h-10 sm:min-h-8"
            onSelect={() => setConfirmDelete(true)}
          >
            {t("deleteAccount")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("deleteCancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(event) => {
                // Keep the dialog open until the request finishes.
                event.preventDefault();
                void onDelete();
              }}
            >
              {t("deleteAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

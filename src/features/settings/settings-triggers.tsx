"use client";

import { Settings2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SettingsPanel } from "./settings-panel";

/** Desktop: compact popover anchored to the header. */
export function SettingsPopover() {
  const t = useTranslations("Settings");
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("title")} data-tour="settings">
              <Settings2Icon />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("title")}</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-4" aria-label={t("title")}>
        <SettingsPanel onAction={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

/** Mobile: bottom sheet within thumb reach. */
export function SettingsDrawer({ label }: { label: string }) {
  const t = useTranslations("Settings");
  const [open, setOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="touch"
          className="flex-col gap-0.5 text-[0.7rem] font-normal text-muted-foreground"
          data-tour="settings"
        >
          <Settings2Icon aria-hidden />
          {label}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("title")}</DrawerTitle>
          <DrawerDescription>{t("description")}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <SettingsPanel onAction={() => setOpen(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

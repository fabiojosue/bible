"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useId } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useOnboarding } from "@/features/onboarding/store";
import { useProgress } from "@/features/progress/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { FONT_SIZE, FONTS, LINE_HEIGHTS, WIDTHS } from "./reader-settings";
import { useSettings } from "./store";

const THEMES = ["dark", "light", "system"] as const;

interface ChoiceProps<T extends string> {
  label: string;
  value: T | undefined;
  options: readonly T[];
  optionLabel: (option: T) => string;
  onChange: (value: T) => void;
}

function Choice<T extends string>({
  label,
  value,
  options,
  optionLabel,
  onChange,
}: ChoiceProps<T>) {
  const labelId = useId();
  return (
    <div className="grid gap-2">
      <span id={labelId} className="text-sm font-medium">
        {label}
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        className="w-full"
        aria-labelledby={labelId}
        value={value ?? ""}
        // Radix emits "" when the active item is clicked again; keep a value selected.
        onValueChange={(next) => next && onChange(next as T)}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option} value={option} className="h-10 flex-1 sm:h-9">
            {optionLabel(option)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

export function SettingsPanel({
  className,
  onAction,
}: {
  className?: string;
  onAction?: () => void;
}) {
  const t = useTranslations("Settings");
  const hydrated = useHydrated();
  const settings = useSettings();
  const { theme, setTheme } = useTheme();
  const startTour = useOnboarding((state) => state.start);
  const resetProgress = useProgress((state) => state.reset);
  const fontSizeId = useId();
  const verseNumbersId = useId();
  const parallelId = useId();
  const parallelHintId = useId();

  return (
    <div className={cn("grid gap-5", className)}>
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <span id={fontSizeId} className="text-sm font-medium">
            {t("fontSize")}
          </span>
          <span className="font-mono text-xs text-muted-foreground tabular-nums" aria-hidden>
            {settings.fontSize}px
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="size-10 sm:size-8"
            aria-label={t("decrease")}
            disabled={settings.fontSize <= FONT_SIZE.min}
            onClick={() => settings.changeFontSize(-FONT_SIZE.step)}
          >
            <MinusIcon />
          </Button>
          <Slider
            // Stops the mobile drawer from treating slider drags as a swipe-to-close.
            data-vaul-no-drag=""
            aria-labelledby={fontSizeId}
            thumbLabel={t("fontSize")}
            min={FONT_SIZE.min}
            max={FONT_SIZE.max}
            step={FONT_SIZE.step}
            value={[settings.fontSize]}
            onValueChange={([value]) => value !== undefined && settings.update({ fontSize: value })}
          />
          <Button
            variant="outline"
            size="icon"
            className="size-10 sm:size-8"
            aria-label={t("increase")}
            disabled={settings.fontSize >= FONT_SIZE.max}
            onClick={() => settings.changeFontSize(FONT_SIZE.step)}
          >
            <PlusIcon />
          </Button>
        </div>
      </div>

      <Choice
        label={t("lineHeight")}
        value={settings.lineHeight}
        options={LINE_HEIGHTS}
        optionLabel={(option) => t(option)}
        onChange={(lineHeight) => settings.update({ lineHeight })}
      />
      <Choice
        label={t("width")}
        value={settings.width}
        options={WIDTHS}
        optionLabel={(option) => t(option)}
        onChange={(width) => settings.update({ width })}
      />
      <Choice
        label={t("font")}
        value={settings.font}
        options={FONTS}
        optionLabel={(option) => t(option)}
        onChange={(font) => settings.update({ font })}
      />
      <Choice
        label={t("theme")}
        value={hydrated ? (theme as (typeof THEMES)[number]) : undefined}
        options={THEMES}
        optionLabel={(option) => t(option)}
        onChange={setTheme}
      />

      <Separator />

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={verseNumbersId}>{t("verseNumbers")}</Label>
        <Switch
          id={verseNumbersId}
          checked={settings.verseNumbers}
          onCheckedChange={(verseNumbers) => settings.update({ verseNumbers })}
        />
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <Label htmlFor={parallelId}>{t("parallel")}</Label>
          <p id={parallelHintId} className="text-xs text-muted-foreground">
            {t("parallelHint")}
          </p>
        </div>
        <Switch
          id={parallelId}
          aria-describedby={parallelHintId}
          checked={settings.parallel}
          onCheckedChange={(parallel) => settings.update({ parallel })}
        />
      </div>

      <Separator />

      <div className="grid gap-2">
        <Button
          variant="ghost"
          className="h-10 justify-start sm:h-8"
          onClick={() => {
            onAction?.();
            startTour();
          }}
        >
          {t("replayTour")}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="h-10 justify-start text-destructive sm:h-8">
              {t("resetProgress")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("resetProgress")}</AlertDialogTitle>
              <AlertDialogDescription>{t("resetConfirm")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("resetCancel")}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  resetProgress();
                  toast.success(t("resetDone"));
                }}
              >
                {t("resetAction")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

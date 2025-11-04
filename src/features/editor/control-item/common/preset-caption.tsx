import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { IText, ITrackItem } from "@designcombo/types";
import { Label } from "@/components/ui/label";
import useLayoutStore from "../../store/use-layout-store";
import { useIsLargeScreen } from "@/hooks/use-media-query";
import {
  applyPreset,
  groupCaptionItems,
  NONE_PRESET,
  STYLE_CAPTION_PRESETS
} from "../floating-controls/caption-preset-picker";
import useStore from "../../store/use-store";
import { PresetPicker } from "./preset-picker";

interface PresetTextProps {
  trackItem: ITrackItem & any;
  properties: any;
}

export const PresetCaption = ({ properties, trackItem }: PresetTextProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Label className="font-sans text-xs font-semibold">CaptionXX</Label>
      <PresetCaptionContent trackItem={trackItem} />
    </div>
  );
};

const PresetCaptionContent = ({
  trackItem
}: {
  trackItem: ITrackItem & IText;
}) => {
  const { setFloatingControl } = useLayoutStore();
  const [captionItemIds, setCaptionItemIds] = useState<string[]>([]);
  const [captionsData, setCaptionsData] = useState<any[]>([]);
  const { trackItemsMap } = useStore();
  const isLargeScreen = useIsLargeScreen();
  const [presetLabel, setPresetLabel] = useState<string>("None");

  useEffect(() => {
    const groupedCaptions = groupCaptionItems(trackItemsMap);

    const currentGroupItems = groupedCaptions[trackItem.metadata.sourceUrl];
    const captionItemIds = currentGroupItems?.map((item) => item.id);
    setCaptionItemIds(captionItemIds);
    setCaptionsData(currentGroupItems);
  }, [trackItemsMap, trackItem]);

  // compute current preset label
  useEffect(() => {
    const first = (captionsData && captionsData[0]) || trackItem;
    const details = first?.details || {};

    const sanitize = (p: Partial<any>) => {
      return {
        appearedColor: p.appearedColor ?? "#000000",
        activeColor: p.activeColor ?? "#000000",
        activeFillColor: p.activeFillColor ?? "transparent",
        color: p.color ?? "#000000",
        backgroundColor: p.backgroundColor ?? "transparent",
        borderColor: p.borderColor ?? "transparent",
        borderWidth: p.borderWidth ?? 0,
        boxShadow: p.boxShadow ?? { color: "transparent", x: 0, y: 0, blur: 0 },
        animation: p.animation ?? "",
        fontFamily: p.fontFamily ?? "Bangers-Regular",
        fontUrl:
          p.fontUrl ??
          "https://fonts.gstatic.com/s/bangers/v13/FeVQS0BTqb0h60ACL5la2bxii28.ttf",
        textTransform: p.textTransform ?? "none",
        textAlign: p.textAlign ?? "center",
        isKeywordColor: p.isKeywordColor ?? "transparent",
        preservedColorKeyWord: p.preservedColorKeyWord ?? false
      };
    };

    const equalBoxShadow = (a?: any, b?: any) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      return (
        a.color === b.color && a.x === b.x && a.y === b.y && a.blur === b.blur
      );
    };

    const matches = (p: any) => {
      const d = details || {};
      return (
        d.appearedColor === p.appearedColor &&
        d.activeColor === p.activeColor &&
        d.activeFillColor === p.activeFillColor &&
        d.color === p.color &&
        d.backgroundColor === p.backgroundColor &&
        d.borderColor === p.borderColor &&
        (Number(d.borderWidth) || 0) === p.borderWidth &&
        equalBoxShadow(d.boxShadow, p.boxShadow) &&
        (d.animation || "") === (p.animation || "") &&
        d.fontFamily === p.fontFamily &&
        d.fontUrl === p.fontUrl &&
        (d.textTransform || "none") === (p.textTransform || "none") &&
        (d.textAlign || "center") === (p.textAlign || "center") &&
        (d.isKeywordColor || "transparent") === (p.isKeywordColor || "transparent") &&
        (d.preservedColorKeyWord || false) === (p.preservedColorKeyWord || false)
      );
    };

    const noneSanitized = sanitize(NONE_PRESET as any);
    if (matches(noneSanitized)) {
      setPresetLabel("None");
      return;
    }

    const foundIndex = STYLE_CAPTION_PRESETS.findIndex((preset) =>
      matches(sanitize(preset as any))
    );
    if (foundIndex >= 0) {
      setPresetLabel(`Preset ${foundIndex + 1}`);
    } else {
      setPresetLabel("Custom");
    }
  }, [captionsData, trackItem]);

  const handlePresetClick = (
    preset: any,
    captionItemIds: string[],
    captionsData: any[]
  ) => {
    applyPreset(preset, captionItemIds, captionsData);
  };

  return (
    <div className="flex gap-2 py-0 flex-col lg:flex-row">
      <div className="flex flex-1 items-center text-sm text-muted-foreground">
        Preset
      </div>
      {isLargeScreen ? (
        <div className="relative w-32">
          <Button
            className="flex h-8 w-full items-center justify-between text-sm"
            variant="secondary"
            onClick={() => setFloatingControl("caption-preset-picker")}
          >
            <div className="w-full text-left">
              <p className="truncate">{presetLabel}</p>
            </div>
            <ChevronDown className="text-muted-foreground" size={14} />
          </Button>
        </div>
      ) : (
        <PresetPicker
          captionItemIds={captionItemIds}
          captionsData={captionsData}
          onPresetClick={handlePresetClick}
        />
      )}
    </div>
  );
};

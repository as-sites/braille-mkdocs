import { ImageIcon } from "lucide-react";
import { useState } from "react";
import type { Editor } from "@tiptap/react";

import type { MediaRecord } from "../../api/media";
import { MediaPicker } from "../media/MediaPicker";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ImageInsertProps = {
  editor: Editor;
};

export function ImageInsert({ editor }: ImageInsertProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function handleSelect(media: MediaRecord) {
    setPickerOpen(false);
    editor
      .chain()
      .focus()
      .setImage({ src: media.id, alt: media.altText ?? media.filename })
      .run();
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPickerOpen(true)}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Image</TooltipContent>
      </Tooltip>

      {pickerOpen && (
        <MediaPicker onSelect={handleSelect} onClose={() => setPickerOpen(false)} />
      )}
    </>
  );
}

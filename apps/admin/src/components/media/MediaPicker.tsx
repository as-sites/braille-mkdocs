import type { MediaRecord } from "../../api/media";
import { MediaLibrary } from "./MediaLibrary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type MediaPickerProps = {
  onSelect: (media: MediaRecord) => void;
  onClose: () => void;
};

export function MediaPicker({ onSelect, onClose }: MediaPickerProps) {
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
        </DialogHeader>
        <MediaLibrary onSelect={onSelect} />
      </DialogContent>
    </Dialog>
  );
}

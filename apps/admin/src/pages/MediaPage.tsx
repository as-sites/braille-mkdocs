import { MediaLibrary } from "../components/media/MediaLibrary";

export function MediaPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Media Library</h1>
      <MediaLibrary />
    </div>
  );
}

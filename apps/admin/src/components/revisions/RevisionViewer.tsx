import type { JSONContent } from "@tiptap/react";

import { Editor } from "../editor/Editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RevisionViewerProps = {
  content: JSONContent;
};

export function RevisionViewer({ content }: RevisionViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Revision content</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Editor initialContent={content} onUpdate={() => {}} editable={false} />
      </CardContent>
    </Card>
  );
}

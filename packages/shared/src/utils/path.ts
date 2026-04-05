function splitPathSegments(path: string): string[] {
  return path
    .trim()
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function joinPathSegments(segments: string[]): string {
  return segments.join("/");
}

export function getParentPath(path: string): string | null {
  const segments = splitPathSegments(path);

  if (segments.length <= 1) {
    return null;
  }

  return joinPathSegments(segments.slice(0, -1));
}

export function getDepth(path: string): number {
  return splitPathSegments(path).length;
}

export function getSlug(path: string): string {
  const segments = splitPathSegments(path);

  return segments.at(-1) ?? "";
}

export function getAncestorPaths(path: string): string[] {
  const segments = splitPathSegments(path);
  const ancestors: string[] = [];

  for (let i = 1; i < segments.length; i += 1) {
    ancestors.push(joinPathSegments(segments.slice(0, i)));
  }

  return ancestors;
}

export function isChildOf(childPath: string, parentPath: string): boolean {
  const childSegments = splitPathSegments(childPath);
  const parentSegments = splitPathSegments(parentPath);

  if (childSegments.length !== parentSegments.length + 1) {
    return false;
  }

  return parentSegments.every((segment, index) => childSegments[index] === segment);
}

export function isDescendantOf(descendantPath: string, ancestorPath: string): boolean {
  const descendantSegments = splitPathSegments(descendantPath);
  const ancestorSegments = splitPathSegments(ancestorPath);

  if (ancestorSegments.length === 0 || descendantSegments.length <= ancestorSegments.length) {
    return false;
  }

  return ancestorSegments.every(
    (segment, index) => descendantSegments[index] === segment,
  );
}

export function buildPath(parentPath: string | null, slug: string): string {
  const normalizedSlug = splitPathSegments(slug).join("/");
  const normalizedParent = parentPath ? splitPathSegments(parentPath).join("/") : "";

  if (!normalizedParent) {
    return normalizedSlug;
  }

  if (!normalizedSlug) {
    return normalizedParent;
  }

  return `${normalizedParent}/${normalizedSlug}`;
}
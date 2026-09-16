// Gameplay units are independent of CSS pixels and device pixel ratio.
export function fitField(viewWidth, viewHeight) {
  const portrait = viewHeight > viewWidth;
  const width = portrait ? 640 : 960;
  const height = portrait ? 960 : 640;
  const scale = Math.min(viewWidth / width, viewHeight / height);
  return { width, height, scale, displayWidth: width * scale, displayHeight: height * scale };
}

export function fieldPoint(clientX, clientY, rect, width, height) {
  return { x: (clientX - rect.left) * width / rect.width,
    y: (clientY - rect.top) * height / rect.height };
}

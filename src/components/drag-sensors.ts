"use client";

import { MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

// U-08: dragging starts after a hold of about 0.3 s on a phone, so a normal swipe still scrolls,
// and after 6 px with a mouse, so a click still clicks. Shared by every reorderable to-do list.
export function useLongPressDrag() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
  );
}

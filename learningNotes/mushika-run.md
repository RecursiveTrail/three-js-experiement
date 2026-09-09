# Mushika Run

The mouse stays at the origin. Distance is a number on the snapshot; tiles, modaks, and gates are placed at `worldZ = distance - atDistance` so the street scrolls toward +Z (the camera). Collects and gates use that number, not mesh X.

`useFrame` is the only clock. The reducer ticks inside it. Lane lerp and hop stretch are visual and must not decide collects.

Hunger is the fail condition. Bhuk’s Z/scale are functions of the same `hunger` the HUD bar reads, so they cannot disagree.

Audio copies Dahi Handi’s overlapping player (not Cat World’s one-voice player) because nibble and a late bell must be allowed to overlap.

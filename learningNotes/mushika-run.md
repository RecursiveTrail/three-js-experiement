# Mushika Run

The mouse stays at the origin. Distance is a number on the snapshot; tiles, modaks, and gates are placed at `worldZ = distance - atDistance` so the street scrolls toward +Z (the camera). Collects and gates use that number, not mesh X.

`useFrame` is the only clock. The reducer ticks inside it. Lane lerp, namaste, and door angle are visual and must not decide collects or phase.

Hunger is the fail condition. Bhuk’s Z/scale are functions of the same `hunger` the HUD bar reads, so they cannot disagree.

`phase` is `playing | opening | shrine | over`. Crossing a gate freezes distance at the threshold, opens doors (0.8 s), then cuts to HTML video behind a transparent canvas (4 s, tap skips). Resume sets `distance = gate.distance + 2.5`. There is no `celebrateT` and no roadside ganpati photos.

Audio copies Dahi Handi’s overlapping player (not Cat World’s one-voice player) because nibble and a late bell must be allowed to overlap. Shrine video is muted; the bell is the blessing sound.

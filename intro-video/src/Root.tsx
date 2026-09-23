import React from "react";
import { Composition } from "remotion";
import { WebBoostReel, FPS, TOTAL_FRAMES } from "./WebBoostReel";

export const Root: React.FC = () => (
  <Composition id="WebBoostReel" component={WebBoostReel} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
);

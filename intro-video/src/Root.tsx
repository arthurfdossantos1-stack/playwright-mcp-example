import React from "react";
import { Composition } from "remotion";
import { WebDevIntro, TOTAL_FRAMES } from "./WebDevIntro";

export const Root: React.FC = () => (
  <Composition
    id="WebDevIntro"
    component={WebDevIntro}
    durationInFrames={TOTAL_FRAMES}
    fps={30}
    width={1920}
    height={1080}
  />
);

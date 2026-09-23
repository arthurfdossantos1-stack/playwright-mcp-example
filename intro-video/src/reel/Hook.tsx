import React from "react";
import { useVideoConfig } from "remotion";
import { theme } from "../theme";
import { SceneShell } from "../components/Layers";
import { Exit, WordReveal } from "../components/Motion";
import { NotificationCard } from "../components/Mockups";
import { Phase, T, useFloat, usePop } from "./common";

// "Tá precisando de um site que traga cliente de verdade? / Então você chegou no lugar certo."
export const Hook: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const cliente = usePop(50);
  const n1 = usePop(46, "smooth");
  const n2 = usePop(58, "smooth");
  const f1 = useFloat(24, 10);
  const f2 = useFloat(28, 10, 2);
  return (
    <SceneShell>
      <Exit duration={durationInFrames}>
        <Phase from={0} to={96}>
          <div style={{ position: "absolute", top: 300, left: 70, transform: `translateY(${f1}px) rotate(-3deg)`, ...n1.style }}>
            <NotificationCard title="Novo cliente" body="Quero fazer um pedido!" width={620} />
          </div>
          <div style={{ position: "absolute", top: 1420, right: 60, transform: `translateY(${f2}px) rotate(3deg)`, ...n2.style }}>
            <NotificationCard title="Novo orçamento" body="Vi seu site, pode me atender?" width={640} />
          </div>
          <WordReveal text="Tá precisando" delay={2} per={4} gap={26} style={{ ...T.hero, fontSize: 116 }} />
          <WordReveal text="de um site que traga" delay={14} per={3} gap={16} style={{ ...T.sub, fontSize: 60, marginTop: 26 }} />
          <div style={{ ...T.hero, fontSize: 200, color: theme.colors.primary, marginTop: 10, ...cliente.style }}>cliente</div>
          <WordReveal text="de verdade?" delay={60} per={4} gap={24} style={{ ...T.hero, fontSize: 116 }} />
        </Phase>
        <Phase from={104}>
          <WordReveal text="Então você chegou" delay={104} per={3} gap={16} style={{ ...T.sub, fontSize: 64 }} />
          <WordReveal
            text="no lugar certo."
            delay={112}
            per={4}
            gap={28}
            highlight={2}
            style={{ ...T.hero, fontSize: 150, marginTop: 20, width: 900 }}
          />
        </Phase>
      </Exit>
    </SceneShell>
  );
};

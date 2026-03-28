"use client";

import { HeartHandshake, Sparkles } from "lucide-react";

interface BlindBoxDisplayProps {
  mode?: "hero" | "mini";
  tone?: "rose" | "purple";
  label?: string;
  caption?: string;
}

export function BlindBoxDisplay({
  mode = "mini",
  tone = "rose",
  label,
  caption,
}: BlindBoxDisplayProps) {
  const isHero = mode === "hero";
  const containerClass = isHero
    ? "mx-auto flex w-full max-w-[360px] items-center justify-center px-6 py-10"
    : "relative overflow-hidden rounded-[32px] border border-white/70 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]";

  const containerStyle =
    tone === "purple"
      ? { backgroundImage: "linear-gradient(135deg, rgb(243 232 255) 0%, rgb(250 245 255) 42%, rgb(255 255 255) 100%)" }
      : { backgroundImage: isHero ? undefined : "linear-gradient(135deg, rgb(255 241 242) 0%, rgb(255 247 237) 40%, rgb(255 255 255) 100%)" };

  const stageClass = isHero ? "blindbox-stage" : "blindbox-stage blindbox-stage--mini";
  const glowClass = tone === "purple" ? "blindbox-glow blindbox-glow--purple" : "blindbox-glow";
  const heartClass = tone === "purple" ? "blindbox-heart blindbox-heart--purple" : "blindbox-heart";
  const ribbonClass = tone === "purple" ? "blindbox-ribbon blindbox-ribbon--purple" : "blindbox-ribbon";

  return (
    <div className={containerClass} style={containerStyle}>
      <div className={stageClass}>
        <div className={glowClass} />
        <div className="blindbox-spark blindbox-spark-a" />
        <div className="blindbox-spark blindbox-spark-b" />
        <div className="blindbox-spark blindbox-spark-c" />
        <div className="blindbox-spark blindbox-spark-d" />

        {label ? (
          <div className="blindbox-card">
            <span>{label}</span>
          </div>
        ) : null}

        <div className="blindbox-lid">
          <span className={`blindbox-ribbon-vertical ${ribbonClass}`} />
          <span className={`blindbox-ribbon-horizontal ${ribbonClass}`} />
          <span className="blindbox-knot blindbox-knot-left" />
          <span className="blindbox-knot blindbox-knot-right" />
        </div>

        <div className="blindbox-body">
          <span className={`blindbox-ribbon-vertical ${ribbonClass}`} />
          <span className={`blindbox-ribbon-horizontal ${ribbonClass}`} />
          <div className={heartClass}>
            {tone === "purple" ? <Sparkles className="h-7 w-7 text-purple-500" /> : <HeartHandshake className="h-7 w-7 text-rose-500" />}
          </div>
        </div>
      </div>

      {caption ? <p className="mt-5 text-center text-sm leading-7 text-slate-600">{caption}</p> : null}

      <style jsx>{`
        .blindbox-stage {
          position: relative;
          width: 280px;
          height: 260px;
        }

        .blindbox-stage--mini {
          width: 210px;
          height: 190px;
          margin: 0 auto;
        }

        .blindbox-glow {
          position: absolute;
          left: 50%;
          top: 56%;
          width: 220px;
          height: 220px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(248, 113, 113, 0.22) 0%, rgba(244, 114, 182, 0.14) 42%, rgba(255, 255, 255, 0) 72%);
          transform: translate(-50%, -50%);
          animation: glowPulse 3.4s ease-in-out infinite;
        }

        .blindbox-stage--mini .blindbox-glow {
          width: 160px;
          height: 160px;
        }

        .blindbox-glow--purple {
          background: radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(217, 70, 239, 0.14) 42%, rgba(255, 255, 255, 0) 72%);
        }

        .blindbox-body,
        .blindbox-lid {
          position: absolute;
          left: 50%;
          border-radius: 28px;
          overflow: hidden;
          background: linear-gradient(160deg, #fff7ed 0%, #ffe4e6 55%, #fce7f3 100%);
          box-shadow: 0 30px 60px rgba(15, 23, 42, 0.12);
        }

        .blindbox-stage--mini .blindbox-body,
        .blindbox-stage--mini .blindbox-lid {
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
          border-radius: 24px;
        }

        .blindbox-body {
          bottom: 14px;
          width: 200px;
          height: 146px;
          transform: translateX(-50%);
          border: 1px solid rgba(251, 113, 133, 0.2);
          animation: bodyFloat 3s ease-in-out infinite;
        }

        .blindbox-stage--mini .blindbox-body {
          bottom: 6px;
          width: 156px;
          height: 112px;
        }

        .blindbox-lid {
          top: 34px;
          width: 228px;
          height: 82px;
          transform: translateX(-50%) rotate(-3deg);
          border: 1px solid rgba(251, 113, 133, 0.16);
          animation: lidFloat 3s ease-in-out infinite;
        }

        .blindbox-stage--mini .blindbox-lid {
          top: 24px;
          width: 178px;
          height: 62px;
        }

        .blindbox-ribbon-vertical,
        .blindbox-ribbon-horizontal {
          position: absolute;
          background: linear-gradient(180deg, #fb7185 0%, #f43f5e 100%);
          opacity: 0.94;
        }

        .blindbox-ribbon--purple {
          background: linear-gradient(180deg, #a855f7 0%, #d946ef 100%);
        }

        .blindbox-ribbon-vertical {
          left: 50%;
          top: 0;
          width: 20px;
          height: 100%;
          transform: translateX(-50%);
        }

        .blindbox-stage--mini .blindbox-ribbon-vertical {
          width: 16px;
        }

        .blindbox-ribbon-horizontal {
          left: 0;
          top: 50%;
          width: 100%;
          height: 20px;
          transform: translateY(-50%);
        }

        .blindbox-stage--mini .blindbox-ribbon-horizontal {
          height: 16px;
        }

        .blindbox-knot {
          position: absolute;
          top: 6px;
          width: 42px;
          height: 24px;
          border: 6px solid #f43f5e;
          border-radius: 999px 999px 4px 999px;
          background: rgba(255, 255, 255, 0.38);
        }

        .blindbox-stage--mini .blindbox-knot {
          width: 32px;
          height: 18px;
          border-width: 5px;
        }

        .blindbox-knot-left {
          left: calc(50% - 40px);
          transform: rotate(-18deg);
        }

        .blindbox-knot-right {
          right: calc(50% - 40px);
          transform: scaleX(-1) rotate(-18deg);
        }

        .blindbox-stage--mini .blindbox-knot-left {
          left: calc(50% - 30px);
        }

        .blindbox-stage--mini .blindbox-knot-right {
          right: calc(50% - 30px);
        }

        .blindbox-heart {
          position: absolute;
          left: 50%;
          top: 50%;
          display: flex;
          height: 74px;
          width: 74px;
          transform: translate(-50%, -50%);
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.72);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .blindbox-stage--mini .blindbox-heart {
          width: 58px;
          height: 58px;
          border-radius: 20px;
        }

        .blindbox-heart--purple {
          background: rgba(255, 255, 255, 0.84);
        }

        .blindbox-card {
          position: absolute;
          left: 50%;
          top: 34px;
          display: flex;
          width: 152px;
          height: 96px;
          transform: translateX(-50%);
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(16, 185, 129, 0.22);
          box-shadow: 0 18px 38px rgba(16, 185, 129, 0.16);
          color: #047857;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.04em;
          animation: cardFloat 3s ease-in-out infinite;
        }

        .blindbox-spark {
          position: absolute;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(251, 191, 36, 0.95) 100%);
          box-shadow: 0 0 18px rgba(251, 191, 36, 0.42);
          animation: sparkBlink 2.6s ease-in-out infinite;
        }

        .blindbox-spark-a { top: 12px; right: 38px; width: 14px; height: 14px; }
        .blindbox-spark-b { top: 44px; left: 18px; width: 10px; height: 10px; animation-delay: 0.4s; }
        .blindbox-spark-c { bottom: 46px; right: 18px; width: 12px; height: 12px; animation-delay: 0.8s; }
        .blindbox-spark-d { bottom: 92px; left: 28px; width: 8px; height: 8px; animation-delay: 1.2s; }

        @keyframes lidFloat {
          0%, 100% { transform: translateX(-50%) rotate(-3deg) translateY(0); }
          50% { transform: translateX(-50%) rotate(2deg) translateY(-12px); }
        }

        @keyframes bodyFloat {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }

        @keyframes cardFloat {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-14px); }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.72; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
        }

        @keyframes sparkBlink {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { calculateStratifiedTankStep, calculatePhysicalShuttleStep, calculateTanklessStep, calculateMinutesRemaining } from './models/ValveModel';

declare const __COMMIT_HASH__: string;
declare const __COMMIT_DATE__: string;
declare const __BUILD_DATE__: string;

const getTempColor = (t: number) => {
  if (t <= 60) return '#3b82f6';
  if (t >= 140) return '#ef4444';
  if (t < 110) {
    const pct = (t - 60) / 50;
    return `rgb(${Math.floor(59 + pct * (14 - 59))}, ${Math.floor(130 + pct * (165 - 130))}, ${Math.floor(246 + pct * (233 - 246))})`;
  } else if (t < 125) {
    const pct = (t - 110) / 15;
    return `rgb(${Math.floor(14 + pct * (249 - 14))}, ${Math.floor(165 + pct * (115 - 165))}, ${Math.floor(233 + pct * (22 - 233))})`;
  } else {
    const pct = (t - 125) / 15;
    return `rgb(${Math.floor(249 + pct * (239 - 249))}, ${Math.floor(115 + pct * (68 - 115))}, ${Math.floor(22 + pct * (68 - 22))})`;
  }
};

const Tip = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: 4, verticalAlign: 'middle' }}>
      <span onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }} style={{ display: 'inline-block',
        width: 14, height: 14, lineHeight: '14px', borderRadius: '50%', border: '1px solid #52525b',
        color: '#71717a', fontSize: '0.6rem', textAlign: 'center', cursor: 'pointer' }}>?</span>
      {open && <span onClick={(e) => { e.stopPropagation(); setOpen(false); }} style={{ position: 'absolute',
        bottom: '120%', left: '50%', transform: 'translateX(-50%)', background: '#27272a',
        border: '1px solid #3f3f46', borderRadius: 6, padding: '6px 10px', fontSize: '0.75rem',
        color: '#e4e4e7', width: 220, zIndex: 100, lineHeight: 1.4, cursor: 'pointer', textTransform: 'none' as const,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>{text}</span>}
    </span>
  );
};

const PlumbingDiagram = ({
  preheatLayers, rheem80Layers, flowRate, coldInTemp, preheatCapacity, rheem80Capacity,
  currentShuttleR, leftPortIsHot, tTanklessActual, tanklessSetpoint, setpoint, tankFlow, tanklessFlow, isTanklessLimited,
  totalFlow, recircFlow, upstairsPumpOn, mainBsmtPumpOn, onToggleUpstairs, onToggleMainBsmt,
  faucetOn, onToggleFaucet, gallonsDispensed
}: any) => {
  const bronzeColor = '#b45309';
  const preheatOut = preheatLayers[0];
  const rheemOut = rheem80Layers[0];
  const tH_Source = leftPortIsHot ? rheemOut : tTanklessActual;
  const tC_Source = leftPortIsHot ? tTanklessActual : rheemOut;
  const tMixed = currentShuttleR * tH_Source + (1 - currentShuttleR) * tC_Source;
  const mixedColor = getTempColor(tMixed);
  const animDur = (rate: number) => `${2/Math.max(rate,0.1)}s`;

  return (
    <div style={{ background: '#18181b', padding: '2rem', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', marginBottom: '2rem', border: '1px solid #3f3f46' }}>
      <style>{`@keyframes flow { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } } .flow-line { stroke-dasharray: 2 10; animation: flow 1s linear infinite; }`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#f4f4f5' }}>System Visualization</h3>
      </div>
      <svg viewBox="0 0 600 280" style={{ width: '100%', height: 'auto', display: 'block' }}>

        {/* ===== NON-POTABLE HEATING LOOP (above & left of preheat tank) ===== */}

        {/* Heat pump — above preheat tank */}
        <rect x="60" y="10" width="110" height="35" rx="5" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5" />
        <text x="115" y="25" textAnchor="middle" fill="#93c5fd" fontSize="7" fontWeight="bold">Ground-Source</text>
        <text x="115" y="36" textAnchor="middle" fill="#93c5fd" fontSize="6">VRF Heat Pump</text>

        {/* Circulator pump — left of preheat, below heat pump */}
        <circle cx="40" cy="75" r="12" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
        <text x="40" y="78" textAnchor="middle" fill="#a1a1aa" fontSize="5" fontWeight="bold">PUMP</text>
        <text x="40" y="100" textAnchor="middle" fill="#71717a" fontSize="6">Circulator</text>
        <text x="40" y="109" textAnchor="middle" fill="#71717a" fontSize="6">Pump</text>

        {/* Buffer tank — left of preheat tank */}
        <rect x="25" y="120" width="30" height="50" rx="4" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
        <text x="40" y="140" textAnchor="middle" fill="#a1a1aa" fontSize="6" fontWeight="bold">20G</text>
        <text x="40" y="150" textAnchor="middle" fill="#a1a1aa" fontSize="6">Buffer</text>
        <text x="40" y="180" textAnchor="middle" fill="#71717a" fontSize="6">Buffer Tank</text>

        {/* Non-potable loop piping (dashed blue = non-potable, always circulating) */}
        <path d="M 70 45 L 70 55 L 40 55 L 40 63" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 2" />
        <path d="M 70 45 L 70 55 L 40 55 L 40 63" fill="none" stroke="white" strokeWidth="1.5" className="flow-line" style={{ animationDuration: '2s' }} />
        <path d="M 40 87 L 40 120" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 2" />
        <path d="M 40 87 L 40 120" fill="none" stroke="white" strokeWidth="1.5" className="flow-line" style={{ animationDuration: '2s' }} />
        <path d="M 55 155 L 100 155" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 2" />
        <path d="M 55 155 L 100 155" fill="none" stroke="white" strokeWidth="1.5" className="flow-line" style={{ animationDuration: '2s' }} />
        <path d="M 100 125 L 80 125 L 80 45" fill="none" stroke="#4b8cc4" strokeWidth="2" strokeDasharray="4 2" />
        <path d="M 100 125 L 80 125 L 80 45" fill="none" stroke="white" strokeWidth="1.5" className="flow-line" style={{ animationDuration: '2s' }} />
        <text x="115" y="55" textAnchor="middle" fill="#60a5fa" fontSize="7" fontWeight="bold">Non-Potable Loop</text>

        {/* ===== COLD WATER INLET (enters preheat bottom-left) ===== */}
        <path d="M 80 235 L 130 235 L 130 210" fill="none" stroke={getTempColor(coldInTemp)} strokeWidth="4" />
        {flowRate > 0 && <path d="M 80 235 L 130 235 L 130 210" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(flowRate) }} />}
        <text x="75" y="248" fill={getTempColor(coldInTemp)} fontSize="10" fontWeight="bold">COLD IN</text>
        <text x="75" y="260" fill={getTempColor(coldInTemp)} fontSize="10" fontWeight="bold">{coldInTemp}°F</text>

        {/* ===== HTP MSSU-80N PREHEAT TANK ===== */}
        <rect x="100" y="110" width="60" height="100" rx="5" fill="#27272a" stroke="#3f3f46" strokeWidth="2" />
        {preheatLayers.map((temp: number, i: number) => (
          <rect key={`p${i}`} x="105" y={115 + (i * 9)} width="50" height="9" fill={getTempColor(temp)} opacity="0.9" />
        ))}
        <text x="130" y="100" textAnchor="middle" fill="#eee" fontSize="9" fontWeight="bold">{preheatCapacity}G Indirect</text>
        <text x="130" y="90" textAnchor="middle" fill="#a1a1aa" fontSize="8">Preheat Tank</text>
        <text x="130" y="128" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" style={{ textShadow: '0 0 3px black' }}>{preheatLayers[0].toFixed(0)}°F</text>
        <text x="130" y="200" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" style={{ textShadow: '0 0 3px black' }}>{preheatLayers[preheatLayers.length-1].toFixed(0)}°F</text>

        {/* ===== PIPE: PREHEAT OUTPUT (top) → INPUT TEE ===== */}
        <path d="M 160 120 L 195 120" fill="none" stroke={getTempColor(preheatOut)} strokeWidth="4" />
        {flowRate > 0 && <path d="M 160 120 L 195 120" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(flowRate) }} />}
        <text x="178" y="115" textAnchor="middle" fill={getTempColor(preheatOut)} fontSize="8" fontWeight="bold">{preheatOut.toFixed(0)}°F</text>

        {/* ===== PREHEAT → TEE (vertical segment, only flows with faucet demand) ===== */}
        <path d="M 195 120 L 195 200" fill="none" stroke={getTempColor(preheatOut)} strokeWidth="4" />
        {flowRate > 0 && <path d="M 195 120 L 195 200" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(flowRate) }} />}

        {/* ===== TEE → RHEEM INPUT (horizontal, flows with demand + recirc) ===== */}
        <path d="M 195 200 L 220 200" fill="none" stroke={getTempColor(preheatOut)} strokeWidth="4" />
        {(flowRate > 0 || recircFlow > 0) && <path d="M 195 200 L 220 200" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(flowRate + recircFlow) }} />}

        {/* ===== INPUT TEE (recirc return joins at bottom) ===== */}
        <circle cx="195" cy="200" r="4" fill="#52525b" />

        {/* ===== RHEEM HEAT PUMP WATER HEATER (same level as preheat) ===== */}
        <rect x="220" y="110" width="60" height="100" rx="5" fill="#27272a" stroke="#3f3f46" strokeWidth="2" />
        {rheem80Layers.map((temp: number, i: number) => (
          <rect key={`r${i}`} x="225" y={115 + (i * 9)} width="50" height="9" fill={getTempColor(temp)} opacity="0.9" />
        ))}
        <text x="250" y="100" textAnchor="middle" fill="#eee" fontSize="9" fontWeight="bold">{rheem80Capacity}G Heat Pump</text>
        <text x="250" y="90" textAnchor="middle" fill="#a1a1aa" fontSize="8">Water Heater</text>
        <text x="250" y="128" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" style={{ textShadow: '0 0 3px black' }}>{rheem80Layers[0].toFixed(0)}°F</text>
        <text x="250" y="200" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" style={{ textShadow: '0 0 3px black' }}>{rheem80Layers[rheem80Layers.length-1].toFixed(0)}°F</text>

        {/* ===== RHEEM OUTPUT (top) → TEE (flows with demand + recirc) ===== */}
        <path d="M 280 120 L 310 120 L 310 130" fill="none" stroke={getTempColor(rheemOut)} strokeWidth="4" />
        {(flowRate > 0 || recircFlow > 0) && <path d="M 280 120 L 310 120 L 310 130" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(flowRate + recircFlow) }} />}
        <circle cx="310" cy="130" r="4" fill="#52525b" />

        {/* ===== BYPASS PATH: TEE → straight to valve upper port ===== */}
        <path d="M 310 130 L 450 130" fill="none" stroke={getTempColor(rheemOut)} strokeWidth="4" />
        {tankFlow > 0.1 && <path d="M 310 130 L 450 130" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(tankFlow) }} />}
        <text x="380" y="124" textAnchor="middle" fill={getTempColor(rheemOut)} fontSize="8" fontWeight="bold">{rheemOut.toFixed(0)}°F</text>

        {/* ===== TANKLESS PATH: TEE → down → right into tankless (below bypass) ===== */}
        <path d="M 310 130 L 310 198 L 360 198" fill="none" stroke={getTempColor(rheemOut)} strokeWidth="4" opacity="0.8" />
        {tanklessFlow > 0.1 && <path d="M 310 130 L 310 198 L 360 198" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(tanklessFlow) }} />}

        {/* ===== RINNAI TANKLESS (below bypass pipe) ===== */}
        <text x="390" y="165" textAnchor="middle" fill="#818cf8" fontSize="8" fontWeight="bold">SET: {tanklessSetpoint}°F</text>
        <rect x="360" y="170" width="60" height="60" rx="5" fill="#27272a" stroke={isTanklessLimited ? "#ef4444" : "#3f3f46"} strokeWidth="2" />
        <path d="M 370 180 L 410 180 L 370 195 L 410 195 L 370 210 L 410 210" fill="none" stroke={tanklessFlow > 0.1 ? '#ef4444' : '#52525b'} strokeWidth="2" />
        <text x="390" y="242" textAnchor="middle" fill={isTanklessLimited ? "#ef4444" : "#eee"} fontSize="9" fontWeight="bold">Tankless Heater</text>

        {/* ===== TANKLESS → VALVE LOWER PORT (straight line) ===== */}
        <path d="M 420 198 L 450 198" fill="none" stroke={getTempColor(tTanklessActual)} strokeWidth="4" />
        {tanklessFlow > 0.1 && <path d="M 420 198 L 450 198" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(tanklessFlow) }} />}
        <text x="435" y="212" textAnchor="middle" fill={getTempColor(tTanklessActual)} fontSize="8" fontWeight="bold">{tTanklessActual.toFixed(0)}°F</text>

        {/* ===== APOLLO MIXING VALVE (same height as tanks) ===== */}
        <rect x="450" y="110" width="50" height="100" rx="8" fill={bronzeColor} stroke="#92400e" strokeWidth="2" />
        <circle cx="475" cy="160" r="15" fill="#92400e" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <text x="475" y="163" textAnchor="middle" fill="white" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1px' }}>MIXING</text>
        <text x="475" y="130" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{leftPortIsHot ? 'HOT' : 'COLD'}</text>
        <text x="475" y="198" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{leftPortIsHot ? 'COLD' : 'HOT'}</text>
        <text x="475" y="220" textAnchor="middle" fill="#818cf8" fontSize="9" fontWeight="bold">SET: {setpoint}°F</text>

        {/* ===== VALVE OUTPUT → HORIZONTAL TO TEE ===== */}
        <path d="M 500 160 L 575 160" fill="none" stroke={mixedColor} strokeWidth="4" />
        {(flowRate > 0 || recircFlow > 0) && <path d="M 500 160 L 575 160" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(flowRate + recircFlow) }} />}
        <text x="537" y="174" textAnchor="middle" fill={mixedColor} fontSize="10" fontWeight="bold">{tMixed.toFixed(1)}°F</text>

        {/* ===== TEE → DOWN TO RECIRC PUMPS ===== */}
        {/* Shared vertical to upstairs pump branch (y=210) */}
        <path d="M 575 160 L 575 210" fill="none" stroke={mixedColor} strokeWidth="4" />
        {recircFlow > 0 && <path d="M 575 160 L 575 210" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(recircFlow) }} />}
        {/* Vertical continuation to main/bsmt pump (y=240) */}
        <path d="M 575 210 L 575 240" fill="none" stroke={mixedColor} strokeWidth="4" />
        {mainBsmtPumpOn && <path d="M 575 210 L 575 240" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(0.5) }} />}
        {/* Branch to main/bsmt pump inlet */}
        <path d="M 575 240 L 562 240" fill="none" stroke={mixedColor} strokeWidth="4" />
        {mainBsmtPumpOn && <path d="M 575 240 L 562 240" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(0.5) }} />}

        {/* ===== OUTPUT FAUCET / HOSE BIB (branches up from tee) ===== */}
        <circle cx="575" cy="160" r="3" fill="#52525b" />
        <path d="M 575 157 L 575 105" fill="none" stroke={mixedColor} strokeWidth="4" />
        {flowRate > 0 && <path d="M 575 157 L 575 105" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(flowRate) }} />}
        <g onClick={onToggleFaucet} style={{ cursor: 'pointer' }}>
          {/* Hose bib body */}
          <rect x="568" y="95" width="14" height="14" rx="3" fill={faucetOn ? '#1e3a5f' : '#27272a'} stroke={faucetOn ? mixedColor : '#3f3f46'} strokeWidth="1.5" />
          {/* Circular handle on top */}
          <circle cx="575" cy="88" r="7" fill="transparent" stroke={faucetOn ? mixedColor : '#3f3f46'} strokeWidth="2" />
          <circle cx="575" cy="88" r="2" fill={faucetOn ? mixedColor : '#52525b'} />
          {/* Spout pointing right */}
          <path d="M 582 102 L 595 102 L 595 106" fill="none" stroke={faucetOn ? mixedColor : '#3f3f46'} strokeWidth="2.5" strokeLinecap="round" />
          {/* Water stream when running */}
          {flowRate > 0 && <>
            <path d="M 595 108 L 595 130" fill="none" stroke={mixedColor} strokeWidth="2" />
            <path d="M 595 108 L 595 130" fill="none" stroke="white" strokeWidth="1.5" className="flow-line" style={{ animationDuration: animDur(flowRate) }} />
          </>}
        </g>
        <text x="575" y="70" textAnchor="middle" fill={mixedColor} fontSize="7" fontWeight="bold">{flowRate.toFixed(1)} GPM</text>
        <text x="575" y="78" textAnchor="middle" fill={faucetOn ? '#a1a1aa' : '#52525b'} fontSize="7" fontWeight="bold">Faucet</text>
        <text x="595" y="140" textAnchor="middle" fill="#a1a1aa" fontSize="7">{gallonsDispensed.toFixed(1)} gal</text>

        {/* ===== RECIRC PUMPS ===== */}

        {/* Branch to upstairs pump inlet */}
        <path d="M 575 210 L 562 210" fill="none" stroke={mixedColor} strokeWidth="3" />
        {upstairsPumpOn && <path d="M 575 210 L 562 210" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(0.5) }} />}

        {/* Pump 1 (Upstairs) — click to toggle */}
        <g onClick={onToggleUpstairs} style={{ cursor: 'pointer' }}>
          <circle cx="552" cy="210" r="10" fill={upstairsPumpOn ? '#1e3a5f' : '#27272a'} stroke={upstairsPumpOn ? '#3b82f6' : '#3f3f46'} strokeWidth="1.5" />
          <text x="552" y="213" textAnchor="middle" fill={upstairsPumpOn ? '#93c5fd' : '#52525b'} fontSize="5" fontWeight="bold">{upstairsPumpOn ? 'ON' : 'OFF'}</text>
          <text x="552" y="197" textAnchor="middle" fill={upstairsPumpOn ? '#a1a1aa' : '#52525b'} fontSize="7" fontWeight="bold">Upstairs</text>
        </g>

        {/* Pump 2 (Main/Basement) — click to toggle */}
        <g onClick={onToggleMainBsmt} style={{ cursor: 'pointer' }}>
          <circle cx="552" cy="240" r="10" fill={mainBsmtPumpOn ? '#1e3a5f' : '#27272a'} stroke={mainBsmtPumpOn ? '#3b82f6' : '#3f3f46'} strokeWidth="1.5" />
          <text x="552" y="243" textAnchor="middle" fill={mainBsmtPumpOn ? '#93c5fd' : '#52525b'} fontSize="5" fontWeight="bold">{mainBsmtPumpOn ? 'ON' : 'OFF'}</text>
          <text x="552" y="258" textAnchor="middle" fill={mainBsmtPumpOn ? '#a1a1aa' : '#52525b'} fontSize="7" fontWeight="bold">Main/Bsmt</text>
        </g>

        {/* ===== RECIRC RETURN ===== */}
        {/* Pump 1 (upstairs) output → trunk junction */}
        <path d="M 542 210 L 530 210 L 530 250" fill="none" stroke={mixedColor} strokeWidth="3" opacity="0.5" strokeDasharray="8 4" />
        {upstairsPumpOn && <path d="M 542 210 L 530 210 L 530 250" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(0.5) }} />}
        {/* Pump 2 (main/bsmt) output → trunk junction */}
        <path d="M 542 240 L 530 240 L 530 250" fill="none" stroke={mixedColor} strokeWidth="3" opacity="0.5" strokeDasharray="8 4" />
        {mainBsmtPumpOn && <path d="M 542 240 L 530 240 L 530 250" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(0.5) }} />}
        {/* Shared return trunk → Rheem input tee */}
        <path d="M 530 250 L 195 250 L 195 200" fill="none" stroke={mixedColor} strokeWidth="3" opacity="0.5" strokeDasharray="8 4" />
        {recircFlow > 0 && <path d="M 530 250 L 195 250 L 195 200" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(recircFlow) }} />}
        <circle cx="530" cy="250" r="3" fill="#52525b" />
        <text x="250" y="263" textAnchor="middle" fill="#a1a1aa" fontSize="7" fontWeight="bold">Recirculation Return</text>
      </svg>
    </div>
  );
};

function App() {
  // Pump toggle state (upstairs defaults off, main/bsmt defaults on)
  const [upstairsPumpOn, setUpstairsPumpOn] = useState(false);
  const [mainBsmtPumpOn, setMainBsmtPumpOn] = useState(true);
  const [upstairsLoopDeltaT, setUpstairsLoopDeltaT] = useState(4);
  const [mainBsmtLoopDeltaT, setMainBsmtLoopDeltaT] = useState(4);
  const RECIRC_FLOW_GPM = (upstairsPumpOn ? 0.5 : 0) + (mainBsmtPumpOn ? 0.5 : 0);

  // Preheat + Rheem state
  const [preheatTargetTemp, setPreheatTargetTemp] = useState(113);
  const [rheemTargetTemp, setRheemTargetTemp] = useState(135);
  const [coldInTemp, setColdInTemp] = useState(60);
  const [preheatCapacity] = useState(80);
  const [rheem80Capacity] = useState(80);
  const [preheatBTUhSetting, setPreheatBTUhSetting] = useState(39900);
  const preheatRecoveryRate = preheatBTUhSetting / (8.34 * Math.max(1, preheatTargetTemp - coldInTemp));
  const [rheemRecoveryRate, setRheemRecoveryRate] = useState(7);
  const [preheatLayers, setPreheatLayers] = useState(new Array(10).fill(preheatTargetTemp));
  const [rheem80Layers, setRheem80Layers] = useState(new Array(10).fill(135));

  // Tankless + mixing valve state (from original)
  const [tanklessSetpoint, setTanklessSetpoint] = useState(140);
  const [setpoint, setSetpoint] = useState(125);
  const [leftPortIsHot, setLeftPortIsHot] = useState(false);
  const [currentTanklessActual, setCurrentTanklessActual] = useState(140);
  const [isTanklessLimited, setIsTanklessLimited] = useState(false);

  const getInitialShuttle = () => {
    let r = 0.5;
    for (let i = 0; i < 120; i++) { r = calculatePhysicalShuttleStep(r, 140, 135, 125, 1); }
    return r;
  };
  const [currentShuttleR, setCurrentShuttleR] = useState(getInitialShuttle());

  // Simulation controls
  const [flowRate, setFlowRate] = useState(0.5);
  const savedFlowRate = useRef(0.5);
  if (flowRate > 0) savedFlowRate.current = flowRate;
  const faucetOn = flowRate > 0;
  const toggleFaucet = () => {
    if (faucetOn) { setFlowRate(0); }
    else { setFlowRate(savedFlowRate.current || 0.5); }
  };
  const [simSpeed, setSimSpeed] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gallonsDispensed, setGallonsDispensed] = useState(0);

  const stateRef = useRef({ preheatLayers, rheem80Layers, currentShuttleR, currentTanklessActual });
  stateRef.current = { preheatLayers, rheem80Layers, currentShuttleR, currentTanklessActual };

  useEffect(() => {
    const tickRateMs = 100;
    const timer = setInterval(() => {
      const stepSeconds = (tickRateMs / 1000) * simSpeed;
      setElapsedSeconds(prev => prev + stepSeconds);
      setGallonsDispensed(prev => prev + flowRate * stepSeconds / 60);

      // Sub-step the coupled simulation to prevent valve-tankless oscillation.
      // At high sim speeds (300x → 30s steps), the valve converges against stale
      // tankless data, causing overshoot. Capping at 1s keeps them coupled.
      const maxSubStep = 1;
      const numSubSteps = Math.max(1, Math.ceil(stepSeconds / maxSubStep));
      const subStep = stepSeconds / numSubSteps;

      let pL = stateRef.current.preheatLayers;
      let rL = stateRef.current.rheem80Layers;
      let shuttleR = stateRef.current.currentShuttleR;
      let tanklessTemp = stateRef.current.currentTanklessActual;
      let tanklessLimited = false;

      for (let ss = 0; ss < numSubSteps; ss++) {
        // Step 1: Preheat tank — cold water in, heated by heat pump loop
        pL = calculateStratifiedTankStep(
          pL, preheatCapacity, flowRate, coldInTemp,
          preheatRecoveryRate, preheatTargetTemp, subStep
        );

        // Compute recirc return temp from current sub-step state
        const curRheemOut = rL[0];
        const curTH = leftPortIsHot ? curRheemOut : tanklessTemp;
        const curTC = leftPortIsHot ? tanklessTemp : curRheemOut;
        const curMixed = shuttleR * curTH + (1 - shuttleR) * curTC;

        // Step 2: Rheem — blended input from preheat output + recirc return
        const preheatOutTemp = pL[0];
        const totalWHFlow = flowRate + RECIRC_FLOW_GPM;

        const upstairsFlow = upstairsPumpOn ? 0.5 : 0;
        const mainBsmtFlow = mainBsmtPumpOn ? 0.5 : 0;
        const recircReturnTemp = RECIRC_FLOW_GPM > 0
          ? ((curMixed - upstairsLoopDeltaT) * upstairsFlow
           + (curMixed - mainBsmtLoopDeltaT) * mainBsmtFlow) / RECIRC_FLOW_GPM
          : curMixed;

        const blendedInTemp = totalWHFlow > 0
          ? (preheatOutTemp * flowRate + recircReturnTemp * RECIRC_FLOW_GPM) / totalWHFlow
          : preheatOutTemp;
        const rheemRefDegGalPerHr = rheemRecoveryRate * Math.max(0, rheemTargetTemp - coldInTemp);
        const rheemInletDelta = Math.max(1, rheemTargetTemp - blendedInTemp);
        const effectiveRheemRecovery = rheemRefDegGalPerHr / rheemInletDelta;

        rL = calculateStratifiedTankStep(
          rL, rheem80Capacity, totalWHFlow, blendedInTemp,
          effectiveRheemRecovery, rheemTargetTemp, subStep
        );

        // Step 3: Mixing valve — Rheem output on one port, tankless on other
        const rheemOutTemp = rL[0];
        const tH = leftPortIsHot ? rheemOutTemp : tanklessTemp;
        const tC = leftPortIsHot ? tanklessTemp : rheemOutTemp;
        shuttleR = calculatePhysicalShuttleStep(shuttleR, tH, tC, setpoint, subStep);

        // Step 4: Tankless — receives fraction of total flow through valve
        const totalValveFlow = flowRate + RECIRC_FLOW_GPM;
        const tanklessFlowVal = leftPortIsHot ? ((1 - shuttleR) * totalValveFlow) : (shuttleR * totalValveFlow);
        const tanklessResult = calculateTanklessStep(tanklessSetpoint, tanklessFlowVal, rheemOutTemp);
        tanklessTemp = tanklessResult.temp;
        tanklessLimited = tanklessResult.isBTULimited;
      }

      setPreheatLayers(pL);
      setRheem80Layers(rL);
      setCurrentShuttleR(shuttleR);
      setCurrentTanklessActual(tanklessTemp);
      setIsTanklessLimited(tanklessLimited);
    }, tickRateMs);
    return () => clearInterval(timer);
  }, [simSpeed, flowRate, preheatCapacity, rheem80Capacity, preheatRecoveryRate, rheemRecoveryRate,
      preheatTargetTemp, rheemTargetTemp, coldInTemp, tanklessSetpoint, setpoint, leftPortIsHot,
      RECIRC_FLOW_GPM, upstairsPumpOn, mainBsmtPumpOn, upstairsLoopDeltaT, mainBsmtLoopDeltaT]);

  // Derived values
  const rheemOut = rheem80Layers[0];
  const tH_Source = leftPortIsHot ? rheemOut : currentTanklessActual;
  const tC_Source = leftPortIsHot ? currentTanklessActual : rheemOut;
  const tMixed = currentShuttleR * tH_Source + (1 - currentShuttleR) * tC_Source;

  const totalFlow = flowRate + RECIRC_FLOW_GPM;
  const tankFlow = leftPortIsHot ? (currentShuttleR * totalFlow) : ((1 - currentShuttleR) * totalFlow);
  const tanklessFlow = leftPortIsHot ? ((1 - currentShuttleR) * totalFlow) : (currentShuttleR * totalFlow);
  const tankOnPort = leftPortIsHot ? 'hot' : 'cold';

  const minutesRemaining = calculateMinutesRemaining(rheem80Layers, rheem80Capacity, flowRate, rheemRecoveryRate, setpoint);

  const maxRinnaiBTU = 199000 * 0.97;
  const rheemDeltaT = Math.max(0, rheemTargetTemp - coldInTemp);
  const maxRheemBTU = rheemRecoveryRate * 8.34 * rheemDeltaT;
  // Recirc parasitic load: BTU/hr the Rheem must spend reheating cooled return water
  const recircParasiticBTU = ((upstairsPumpOn ? 0.5 : 0) * upstairsLoopDeltaT
    + (mainBsmtPumpOn ? 0.5 : 0) * mainBsmtLoopDeltaT) * 500.4;
  const effectiveRheemBTU = Math.max(0, maxRheemBTU - recircParasiticBTU);
  const totalSystemBTU = maxRinnaiBTU + effectiveRheemBTU;
  let maxSystemGPM = totalSystemBTU / (500.4 * Math.max(1, setpoint - coldInTemp));
  if (tanklessSetpoint < setpoint) { maxSystemGPM = effectiveRheemBTU / (500.4 * Math.max(1, setpoint - coldInTemp)); }

  // BTU calculations
  const preheatBTUh = preheatRecoveryRate * 8.34 * Math.max(0, preheatTargetTemp - coldInTemp);
  const rheemBTUh = rheemRecoveryRate * 8.34 * rheemDeltaT;

  // Optimal flow: max GPM at setpoint sustainable by tank recovery alone
  // Tanks are in series: preheat heats cold→preheatTarget, Rheem heats preheatTarget→setpoint
  // Bottleneck is whichever tank has less capacity relative to its required ΔT
  const effectiveRheemBTUh = Math.max(0, rheemBTUh - recircParasiticBTU);
  const rheemGapTemp = setpoint - preheatTargetTemp;
  const maxOptimalGPM = rheemGapTemp <= 0
    ? preheatBTUh / (500.4 * Math.max(1, setpoint - coldInTemp))
    : rheemTargetTemp < setpoint ? 0
    : Math.min(
        preheatBTUh / (500.4 * Math.max(1, preheatTargetTemp - coldInTemp)),
        effectiveRheemBTUh / (500.4 * rheemGapTemp)
      );
  const tanklessBTUh = maxRinnaiBTU;
  const demandBTUh = flowRate * 500.4 * Math.max(0, tMixed - coldInTemp);
  const gallonsPerPreheatLayer = preheatCapacity / preheatLayers.length;
  const gallonsPerRheemLayer = rheem80Capacity / rheem80Layers.length;
  const preheatStoredBTU = preheatLayers.reduce((sum: number, t: number) => sum + gallonsPerPreheatLayer * 8.34 * Math.max(0, t - coldInTemp), 0);
  const rheemStoredBTU = rheem80Layers.reduce((sum: number, t: number) => sum + gallonsPerRheemLayer * 8.34 * Math.max(0, t - coldInTemp), 0);
  const tankedBTUh = preheatBTUh + rheemBTUh;
  const totalStoredBTU = preheatStoredBTU + rheemStoredBTU;
  const storedTimeH = demandBTUh > 0 ? totalStoredBTU / demandBTUh : Infinity;
  const formatBTU = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0);
  const showerBTU = 25 * 8.34 * Math.max(0, setpoint - coldInTemp); // 2.5 GPM × 10 min = 25 gal
  const bathBTU = 60 * 8.34 * Math.max(0, setpoint - coldInTemp);   // 60 gal tub
  const storedShowers = showerBTU > 0 ? totalStoredBTU / showerBTU : Infinity;
  const storedBaths = bathBTU > 0 ? totalStoredBTU / bathBTU : Infinity;
  const rheemDeficitBTU = rheem80Layers.reduce((sum: number, t: number) =>
    sum + gallonsPerRheemLayer * 8.34 * Math.max(0, rheemTargetTemp - t), 0);
  const estRecoveryHours = effectiveRheemBTUh > 0 ? rheemDeficitBTU / effectiveRheemBTUh : Infinity;
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const sliderStyle = { width: '100%', height: '6px', background: '#3f3f46', borderRadius: '5px', outline: 'none', margin: '15px 0' };

  return (
    <div style={{ background: '#09090b', minHeight: '100vh', width: '100%' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem', color: '#fafafa', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <header style={{ marginBottom: '3rem' }}><h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Manor Water Simulator</h1><p style={{ color: '#a1a1aa' }}>Whole-House Thermal Modeling</p></header>
        <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, background: '#18181b', padding: '1rem 1.5rem', borderRadius: '0.75rem', border: '1px solid #3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: '0.875rem', color: '#a1a1aa', fontWeight: 600 }}>SIMULATION CLOCK</span><span style={{ fontFamily: 'monospace', fontSize: '1.5rem', color: '#6366f1', fontWeight: 'bold' }}>{formatTime(elapsedSeconds)}</span></div>
              <div style={{ width: '200px', background: '#18181b', padding: '1rem 1.5rem', borderRadius: '0.75rem', border: '1px solid #3f3f46' }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600, marginBottom: '0.5rem' }}>SPEED: {simSpeed}x</label><input type="range" min="1" max="300" value={simSpeed} onChange={e => setSimSpeed(parseInt(e.target.value))} style={{ width: '100%', margin: 0 }} /></div>
            </div>
            <PlumbingDiagram
              preheatLayers={preheatLayers} rheem80Layers={rheem80Layers} flowRate={flowRate}
              coldInTemp={coldInTemp} preheatCapacity={preheatCapacity} rheem80Capacity={rheem80Capacity}
              currentShuttleR={currentShuttleR} leftPortIsHot={leftPortIsHot}
              tTanklessActual={currentTanklessActual} tanklessSetpoint={tanklessSetpoint} setpoint={setpoint}
              tankFlow={tankFlow} tanklessFlow={tanklessFlow} isTanklessLimited={isTanklessLimited}
              totalFlow={totalFlow} recircFlow={RECIRC_FLOW_GPM}
              upstairsPumpOn={upstairsPumpOn} mainBsmtPumpOn={mainBsmtPumpOn}
              onToggleUpstairs={() => setUpstairsPumpOn(v => !v)} onToggleMainBsmt={() => setMainBsmtPumpOn(v => !v)}
              faucetOn={faucetOn} onToggleFaucet={toggleFaucet} gallonsDispensed={gallonsDispensed}
            />
            <div style={{ background: '#18181b', padding: '2rem', borderRadius: '1rem', border: '1px solid #3f3f46' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Simulation Controls</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Output Demand<Tip text="Simulated faucet flow rate in gallons per minute" />: <span style={{ color: '#fafafa' }}>{flowRate.toFixed(1)} GPM</span></label><input type="range" min="0" max="20" step="0.1" value={flowRate} onChange={e => setFlowRate(parseFloat(e.target.value))} style={sliderStyle} /></div>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Cold Inlet Temp<Tip text="Temperature of the incoming well water supply" />: <span style={{ color: '#fafafa' }}>{coldInTemp}°F</span></label><input type="range" min="35" max="80" value={coldInTemp} onChange={e => setColdInTemp(parseInt(e.target.value))} style={sliderStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Preheat Tank Target<Tip text="Thermostat setpoint for the preheat tank's heat pump loop" />: <span style={{ color: '#fafafa' }}>{preheatTargetTemp}°F</span></label><input type="range" min="70" max="130" value={preheatTargetTemp} onChange={e => setPreheatTargetTemp(parseInt(e.target.value))} style={sliderStyle} /></div>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Water Heater Target<Tip text="Thermostat setpoint for the Rheem heat pump water heater" />: <span style={{ color: '#fafafa' }}>{rheemTargetTemp}°F</span></label><input type="range" min="100" max="160" value={rheemTargetTemp} onChange={e => setRheemTargetTemp(parseInt(e.target.value))} style={sliderStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Preheat Recovery<Tip text="Heat input rate of the preheat loop's heat pump, in BTU/hr" />: <span style={{ color: '#fafafa' }}>{formatBTU(preheatBTUhSetting)} BTU/h ({preheatRecoveryRate.toFixed(0)} GPH)</span></label><input type="range" min="5000" max="60000" step="100" value={preheatBTUhSetting} onChange={e => setPreheatBTUhSetting(parseInt(e.target.value))} style={sliderStyle} /></div>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Rheem Recovery<Tip text="Recovery rate of the Rheem in heat-pump-only mode, in gallons per hour" />: <span style={{ color: '#fafafa' }}>{rheemRecoveryRate} GPH ({formatBTU(rheemBTUh)} BTU/h)</span></label><input type="range" min="1" max="30" value={rheemRecoveryRate} onChange={e => setRheemRecoveryRate(parseInt(e.target.value))} style={sliderStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Mixing Valve Setpoint<Tip text="Target output temperature of the Apollo thermostatic mixing valve" />: <span style={{ color: '#fafafa' }}>{setpoint}°F</span></label><input type="range" min="85" max="160" value={setpoint} onChange={e => setSetpoint(parseInt(e.target.value))} style={sliderStyle} /></div>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Tankless Output<Tip text="Temperature setpoint of the Rinnai tankless water heater" />: <span style={{ color: '#fafafa' }}>{tanklessSetpoint}°F</span></label><input type="range" min="100" max="160" value={tanklessSetpoint} onChange={e => setTanklessSetpoint(parseInt(e.target.value))} style={sliderStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Upstairs Loop ΔT<Tip text="Temperature drop through the upstairs recirculation piping loop" />: <span style={{ color: '#fafafa' }}>{upstairsLoopDeltaT}°F</span></label><input type="range" min="0" max="15" step="0.5" value={upstairsLoopDeltaT} onChange={e => setUpstairsLoopDeltaT(parseFloat(e.target.value))} style={sliderStyle} /></div>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Main/Bsmt Loop ΔT<Tip text="Temperature drop through the main floor and basement recirculation piping loop" />: <span style={{ color: '#fafafa' }}>{mainBsmtLoopDeltaT}°F</span></label><input type="range" min="0" max="15" step="0.5" value={mainBsmtLoopDeltaT} onChange={e => setMainBsmtLoopDeltaT(parseFloat(e.target.value))} style={sliderStyle} /></div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div style={{ background: '#18181b', padding: '2rem', borderRadius: '1rem', border: '1px solid #3f3f46', textAlign: 'center' }}>
              <h3 style={{ marginTop: 0, fontSize: '0.875rem', textTransform: 'uppercase', color: '#a1a1aa' }}>Real-Time Output</h3>
              <div style={{ fontSize: '4.5rem', fontWeight: 800, color: getTempColor(tMixed) }}>{tMixed.toFixed(1)}°F</div>
              <div style={{ borderTop: '1px solid #27272a', marginTop: '1.5rem', paddingTop: '1.5rem', textAlign: 'left' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}><span style={{ color: '#a1a1aa' }}>Preheat Out</span><span style={{ fontWeight: 600 }}>{preheatLayers[0].toFixed(1)}°F</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}><span style={{ color: '#a1a1aa' }}>Rheem Out</span><span style={{ fontWeight: 600 }}>{rheemOut.toFixed(1)}°F</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}><span style={{ color: '#a1a1aa' }}>Tank Flow</span><span style={{ fontWeight: 600 }}>{tankFlow.toFixed(1)} GPM</span></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}><span style={{ color: '#a1a1aa' }}>Tankless Flow</span><span style={{ fontWeight: 600 }}>{tanklessFlow.toFixed(1)} GPM</span></div>
              </div>
            </div>
            <div style={{ background: '#27272a', padding: '1.5rem', borderRadius: '1rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#18181b', borderRadius: '0.5rem', border: '1px solid #3f3f46', textAlign: 'center' }}><span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block', marginBottom: '0.25rem' }}>ESTIMATED HOT WATER REMAINING<Tip text="Time until stored tank energy is depleted at the current demand rate" /></span><span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: minutesRemaining === Infinity ? '#22c55e' : minutesRemaining < 5 ? '#ef4444' : '#f97316' }}>{minutesRemaining === Infinity ? 'Infinite (Stable)' : formatTime(minutesRemaining * 60)}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#18181b', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #3f3f46', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>System Capacity<Tip text="Maximum GPM the system can deliver at the mixing valve setpoint, combining all heat sources minus recirculation losses" /></span>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f4f4f5' }}>{maxSystemGPM.toFixed(1)} GPM</span>
                  <span style={{ fontSize: '0.6rem', color: '#71717a', display: 'block' }}>@ {setpoint}°F Output</span>
                </div>
                <div style={{ background: '#18181b', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #3f3f46', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Optimal Flow<Tip text="Maximum sustainable GPM from tank recovery alone, without activating the tankless heater" /></span>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#86efac' }}>{maxOptimalGPM.toFixed(1)} GPM</span>
                  <span style={{ fontSize: '0.6rem', color: '#71717a', display: 'block' }}>Sustainable Tank-Only</span>
                </div>
              </div>
              {isTanklessLimited && <div style={{ marginBottom: '1rem', color: '#ef4444', fontWeight: 'bold', textAlign: 'center', border: '1px solid #ef4444', padding: '0.5rem', borderRadius: '0.5rem' }}>HEATER BTU LIMITED</div>}
              {(() => { const demandTankFlow = leftPortIsHot ? (currentShuttleR * flowRate) : ((1 - currentShuttleR) * flowRate); return demandTankFlow > (flowRate - 0.05) && tMixed >= setpoint - 0.5; })() ? (
                <div style={{ marginTop: '1rem', color: '#86efac', border: '1px solid #22c55e', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(34, 197, 94, 0.1)' }}>
                  <strong>OPTIMAL STATE:</strong> Satisfied by tanks alone. Tankless remains dormant.
                </div>
              ) : ((currentShuttleR > 0.98 && tH_Source < setpoint - 0.5 && tankOnPort !== 'hot') || (currentShuttleR < 0.02 && tC_Source > setpoint + 0.5 && tankOnPort !== 'cold')) ? (
                <div style={{ marginTop: '1rem', color: '#fca5a5', border: '1px solid #ef4444', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.1)' }}>
                  <strong>LATCH ALERT:</strong> Valve is mechanically pinned to Tankless. It cannot "see" if the tanks have recovered.
                </div>
              ) : flowRate <= 0.05 ? (
                <div style={{ marginTop: '1rem', color: '#a1a1aa', border: '1px solid #3f3f46', padding: '0.75rem', borderRadius: '0.5rem' }}>
                  <strong>SYSTEM IDLE:</strong> No active demand.
                </div>
              ) : tanklessFlow > (flowRate - 0.05) ? (
                <div style={{ marginTop: '1rem', color: '#93c5fd', border: '1px solid #3b82f6', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(59, 130, 246, 0.1)' }}>
                  <strong>SERIES BACKUP:</strong> Tanks depleted. Rinnai is providing primary heat.
                </div>
              ) : (
                <div style={{ marginTop: '1rem', color: '#fafafa', border: '1px solid #3f3f46', padding: '0.75rem', borderRadius: '0.5rem' }}>
                  <strong>SERIES BOOST:</strong> Active mixing.
                </div>
              )}
            </div>
          </div>
          <div style={{ background: '#18181b', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #3f3f46', marginTop: '1.5rem' }}>
            <h3 style={{ marginTop: 0, fontSize: '0.875rem', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: '1rem' }}>Energy Balance (BTU)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Preheat Recovery<Tip text="BTU/hr the preheat tank's heat pump loop adds to incoming cold water" /></span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#93c5fd' }}>{formatBTU(preheatBTUh)} BTU/h</span>
              </div>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Rheem Recovery<Tip text="BTU/hr the Rheem heat pump water heater adds in HP-only mode" /></span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#93c5fd' }}>{formatBTU(rheemBTUh)} BTU/h</span>
              </div>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Tankless Max<Tip text="Maximum BTU/hr the Rinnai tankless can deliver at full capacity" /></span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#93c5fd' }}>{formatBTU(tanklessBTUh)} BTU/h</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Preheat Stored<Tip text="Thermal energy currently stored in the preheat tank above cold inlet temperature" /></span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f59e0b' }}>{formatBTU(preheatStoredBTU)} BTU</span>
              </div>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Rheem Stored<Tip text="Thermal energy currently stored in the Rheem tank above cold inlet temperature" /></span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f59e0b' }}>{formatBTU(rheemStoredBTU)} BTU</span>
              </div>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Total Stored<Tip text="Combined stored energy in both tanks; shown as equivalent showers (25 gal) and baths (60 gal)" /></span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f59e0b' }}>{formatBTU(totalStoredBTU)} BTU</span>
                <span style={{ fontSize: '0.7rem', color: '#a1a1aa', display: 'block' }}>{storedTimeH === Infinity ? 'No demand' : `${formatTime(storedTimeH * 3600)} at current demand`}</span>
                <span style={{ fontSize: '0.7rem', color: '#a1a1aa', display: 'block' }}>{storedShowers.toFixed(1)} showers · {storedBaths.toFixed(1)} baths</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Tank Recovery Total<Tip text="Combined BTU/hr from both tanks' recovery systems" /></span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: tankedBTUh >= demandBTUh ? '#22c55e' : '#f59e0b' }}>{formatBTU(tankedBTUh)} BTU/h</span>
              </div>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Output Demand<Tip text="BTU/hr being consumed by the current faucet flow at the mixed output temperature" /></span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: demandBTUh > tankedBTUh ? '#ef4444' : '#22c55e' }}>{formatBTU(demandBTUh)} BTU/h</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Recirculation Loss<Tip text="BTU/hr lost through pipe heat dissipation in the recirculation loops" /></span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f59e0b' }}>{formatBTU(recircParasiticBTU)} BTU/h</span>
              </div>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Net Rheem Recovery<Tip text="Rheem recovery BTU/hr minus recirculation losses — the effective heating rate" /></span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: effectiveRheemBTUh > 0 ? '#22c55e' : '#ef4444' }}>{formatBTU(effectiveRheemBTUh)} BTU/h</span>
              </div>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Rheem Recovery ETA<Tip text="Estimated time for the Rheem tank to reach its target temperature at the current net recovery rate" /></span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: rheemDeficitBTU < 1 ? '#22c55e' : '#f59e0b' }}>{rheemDeficitBTU < 1 ? 'At target' : !isFinite(estRecoveryHours) ? 'Never' : formatTime(estRecoveryHours * 3600)}</span>
              </div>
            </div>
          </div>
      </div>
      <footer style={{ marginTop: '2rem', textAlign: 'center', padding: '1rem 0', borderTop: '1px solid #27272a' }}>
        <a href="https://github.com/asjoyner/manor-water-simulator" target="_blank" rel="noopener noreferrer" style={{ color: '#a1a1aa', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 600 }}>github.com/asjoyner/manor-water-simulator</a>
        <div style={{ color: '#71717a', fontSize: '0.75rem', marginTop: '0.5rem' }}>
          <span>commit: {__COMMIT_HASH__} ({new Date(__COMMIT_DATE__).toLocaleString()})</span>
          <span style={{ marginLeft: '1rem' }}>build: {new Date(__BUILD_DATE__).toLocaleString()}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;

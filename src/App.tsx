import React, { useState, useEffect, useRef } from 'react';
import { calculateStratifiedTankStep, calculatePhysicalShuttleStep, calculateTanklessStep, calculateMinutesRemaining } from './models/ValveModel';

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

const PlumbingDiagram = ({
  preheatLayers, rheem80Layers, flowRate, coldInTemp, preheatCapacity, rheem80Capacity,
  currentShuttleR, leftPortIsHot, tTanklessActual, setpoint, tankFlow, tanklessFlow, isTanklessLimited,
  totalFlow, recircFlow, upstairsPumpOn, mainBsmtPumpOn, onToggleUpstairs, onToggleMainBsmt,
  faucetOn, onToggleFaucet
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

        {/* ===== HTP GL119 PREHEAT TANK ===== */}
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

        {/* ===== PREHEAT → RHEEM (down to bottom inlet) ===== */}
        <path d="M 195 120 L 195 210 L 220 210" fill="none" stroke={getTempColor(preheatOut)} strokeWidth="4" />
        {flowRate > 0 && <path d="M 195 120 L 195 210 L 220 210" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(flowRate) }} />}

        {/* ===== INPUT TEE (recirc return joins at bottom) ===== */}
        <circle cx="195" cy="210" r="4" fill="#52525b" />

        {/* ===== RHEEM HEAT PUMP WATER HEATER (same level as preheat) ===== */}
        <rect x="220" y="110" width="60" height="100" rx="5" fill="#27272a" stroke="#3f3f46" strokeWidth="2" />
        {rheem80Layers.map((temp: number, i: number) => (
          <rect key={`r${i}`} x="225" y={115 + (i * 9)} width="50" height="9" fill={getTempColor(temp)} opacity="0.9" />
        ))}
        <text x="250" y="100" textAnchor="middle" fill="#eee" fontSize="9" fontWeight="bold">{rheem80Capacity}G Heat Pump</text>
        <text x="250" y="90" textAnchor="middle" fill="#a1a1aa" fontSize="8">Water Heater</text>
        <text x="250" y="128" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" style={{ textShadow: '0 0 3px black' }}>{rheem80Layers[0].toFixed(0)}°F</text>
        <text x="250" y="200" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" style={{ textShadow: '0 0 3px black' }}>{rheem80Layers[rheem80Layers.length-1].toFixed(0)}°F</text>

        {/* ===== RHEEM OUTPUT (top) → TEE ===== */}
        <path d="M 280 120 L 310 120 L 310 130" fill="none" stroke={getTempColor(rheemOut)} strokeWidth="4" />
        {flowRate > 0 && <path d="M 280 120 L 310 120 L 310 130" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(flowRate) }} />}
        <circle cx="310" cy="130" r="4" fill="#52525b" />

        {/* ===== BYPASS PATH: TEE → straight to valve upper port ===== */}
        <path d="M 310 130 L 450 130" fill="none" stroke={getTempColor(rheemOut)} strokeWidth="8" />
        {tankFlow > 0.1 && <path d="M 310 130 L 450 130" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(tankFlow) }} />}
        <text x="380" y="124" textAnchor="middle" fill={getTempColor(rheemOut)} fontSize="8" fontWeight="bold">{rheemOut.toFixed(0)}°F</text>

        {/* ===== TANKLESS PATH: TEE → down → right into tankless (below bypass) ===== */}
        <path d="M 310 130 L 310 198 L 360 198" fill="none" stroke={getTempColor(rheemOut)} strokeWidth="4" opacity="0.8" />
        {tanklessFlow > 0.1 && <path d="M 310 130 L 310 198 L 360 198" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(tanklessFlow) }} />}

        {/* ===== RINNAI TANKLESS (below bypass pipe) ===== */}
        <rect x="360" y="170" width="60" height="60" rx="5" fill="#27272a" stroke={isTanklessLimited ? "#ef4444" : "#3f3f46"} strokeWidth="2" />
        <path d="M 370 180 L 410 180 L 370 195 L 410 195 L 370 210 L 410 210" fill="none" stroke={getTempColor(tTanklessActual)} strokeWidth="2" />
        <text x="390" y="242" textAnchor="middle" fill={isTanklessLimited ? "#ef4444" : "#eee"} fontSize="9" fontWeight="bold">Tankless Heater</text>
        <text x="390" y="203" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{tTanklessActual.toFixed(1)}°F</text>

        {/* ===== TANKLESS → VALVE LOWER PORT (straight line) ===== */}
        <path d="M 420 198 L 450 198" fill="none" stroke={getTempColor(tTanklessActual)} strokeWidth="8" />
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

        {/* ===== TEE → DOWN TO RECIRC PUMPS (only when pumps active) ===== */}
        <path d="M 575 160 L 575 240 L 562 240" fill="none" stroke={mixedColor} strokeWidth="4" />
        {recircFlow > 0 && <path d="M 575 160 L 575 240 L 562 240" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(recircFlow) }} />}

        {/* ===== OUTPUT FAUCET / HOSE BIB (branches up from tee) ===== */}
        <circle cx="575" cy="160" r="3" fill="#52525b" />
        <path d="M 575 157 L 575 105" fill="none" stroke={mixedColor} strokeWidth="4" />
        {flowRate > 0 && <path d="M 575 157 L 575 105" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(flowRate) }} />}
        <g onClick={onToggleFaucet} style={{ cursor: 'pointer' }}>
          {/* Hose bib body */}
          <rect x="568" y="95" width="14" height="14" rx="3" fill={faucetOn ? '#1e3a5f' : '#27272a'} stroke={faucetOn ? '#3b82f6' : '#3f3f46'} strokeWidth="1.5" />
          {/* Circular handle on top */}
          <circle cx="575" cy="88" r="7" fill="none" stroke={faucetOn ? '#3b82f6' : '#3f3f46'} strokeWidth="2" />
          <circle cx="575" cy="88" r="2" fill={faucetOn ? '#93c5fd' : '#52525b'} />
          {/* Spout pointing right */}
          <path d="M 582 102 L 595 102 L 595 106" fill="none" stroke={faucetOn ? '#3b82f6' : '#3f3f46'} strokeWidth="2.5" strokeLinecap="round" />
          {/* Water drips when running */}
          {flowRate > 0 && <>
            <line x1="595" y1="108" x2="595" y2="114" stroke={mixedColor} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
            <circle cx="595" cy="118" r="1.5" fill={mixedColor} opacity="0.6" />
            <circle cx="595" cy="125" r="1" fill={mixedColor} opacity="0.4" />
          </>}
        </g>
        <text x="575" y="78" textAnchor="middle" fill={faucetOn ? '#a1a1aa' : '#52525b'} fontSize="7" fontWeight="bold">Faucet</text>
        <text x="590" y="140" textAnchor="start" fill={mixedColor} fontSize="7" fontWeight="bold">{flowRate.toFixed(1)} GPM</text>

        {/* ===== RECIRC PUMPS ===== */}

        {/* Tee from vertical to upstairs pump */}
        <path d="M 575 210 L 562 210" fill="none" stroke={mixedColor} strokeWidth="3" />
        {recircFlow > 0 && <path d="M 575 210 L 562 210" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(recircFlow) }} />}

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
        {/* Pump 1 output exits left → return trunk */}
        <path d="M 542 210 L 530 210 L 530 250 L 195 250 L 195 210" fill="none" stroke={mixedColor} strokeWidth="3" opacity="0.5" strokeDasharray="8 4" />
        {recircFlow > 0 && <path d="M 542 210 L 530 210 L 530 250 L 195 250 L 195 210" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(recircFlow) }} />}
        {/* Pump 2 output exits left → joins trunk */}
        <path d="M 542 240 L 530 240 L 530 250" fill="none" stroke={mixedColor} strokeWidth="3" opacity="0.5" strokeDasharray="8 4" />
        {recircFlow > 0 && <path d="M 542 240 L 530 240 L 530 250" fill="none" stroke="white" strokeWidth="2" className="flow-line" style={{ animationDuration: animDur(recircFlow) }} />}
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
  const RECIRC_FLOW_GPM = (upstairsPumpOn ? 0.5 : 0) + (mainBsmtPumpOn ? 0.5 : 0);

  // Preheat + Rheem state
  const [preheatTargetTemp, setPreheatTargetTemp] = useState(113);
  const [rheemTargetTemp, setRheemTargetTemp] = useState(135);
  const [coldInTemp, setColdInTemp] = useState(60);
  const [preheatCapacity] = useState(119);
  const [rheem80Capacity] = useState(80);
  const [preheatBTUhSetting, setPreheatBTUhSetting] = useState(39900);
  const preheatRecoveryRate = preheatBTUhSetting / (8.34 * Math.max(1, preheatTargetTemp - coldInTemp));
  const [rheemRecoveryRate, setRheemRecoveryRate] = useState(7);
  const [preheatLayers, setPreheatLayers] = useState(new Array(10).fill(100));
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

  const stateRef = useRef({ preheatLayers, rheem80Layers, currentShuttleR, currentTanklessActual });
  stateRef.current = { preheatLayers, rheem80Layers, currentShuttleR, currentTanklessActual };

  useEffect(() => {
    const tickRateMs = 100;
    const timer = setInterval(() => {
      const stepSeconds = (tickRateMs / 1000) * simSpeed;
      setElapsedSeconds(prev => prev + stepSeconds);
      const { preheatLayers: pLayers, rheem80Layers: rLayers, currentShuttleR: r, currentTanklessActual: tL } = stateRef.current;

      // Step 1: Preheat tank — cold water in, heated by heat pump loop
      const nextPreheat = calculateStratifiedTankStep(
        pLayers, preheatCapacity, flowRate, coldInTemp,
        preheatRecoveryRate, preheatTargetTemp, stepSeconds
      );
      setPreheatLayers(nextPreheat);

      // Compute previous recirc return temp from prior state
      const prevRheemOut = rLayers[0];
      const prevTH = leftPortIsHot ? prevRheemOut : tL;
      const prevTC = leftPortIsHot ? tL : prevRheemOut;
      const prevMixed = r * prevTH + (1 - r) * prevTC;

      // Step 2: Rheem — blended input from preheat output + recirc return
      const preheatOutTemp = nextPreheat[0];
      const totalWHFlow = flowRate + RECIRC_FLOW_GPM;
      const blendedInTemp = totalWHFlow > 0
        ? (preheatOutTemp * flowRate + prevMixed * RECIRC_FLOW_GPM) / totalWHFlow
        : preheatOutTemp;
      const nextRheem = calculateStratifiedTankStep(
        rLayers, rheem80Capacity, totalWHFlow, blendedInTemp,
        rheemRecoveryRate, rheemTargetTemp, stepSeconds
      );
      setRheem80Layers(nextRheem);

      // Step 3: Mixing valve — Rheem output on one port, tankless on other
      const rheemOutTemp = nextRheem[0];
      const tH = leftPortIsHot ? rheemOutTemp : tL;
      const tC = leftPortIsHot ? tL : rheemOutTemp;
      const nextShuttleR = calculatePhysicalShuttleStep(r, tH, tC, setpoint, stepSeconds);
      setCurrentShuttleR(nextShuttleR);

      // Step 4: Tankless — receives fraction of total flow through valve (demand + recirc)
      const totalValveFlow = flowRate + RECIRC_FLOW_GPM;
      const tanklessFlowVal = leftPortIsHot ? ((1 - nextShuttleR) * totalValveFlow) : (nextShuttleR * totalValveFlow);
      const tanklessResult = calculateTanklessStep(tanklessSetpoint, tanklessFlowVal, rheemOutTemp);
      setCurrentTanklessActual(tanklessResult.temp);
      setIsTanklessLimited(tanklessResult.isBTULimited);
    }, tickRateMs);
    return () => clearInterval(timer);
  }, [simSpeed, flowRate, preheatCapacity, rheem80Capacity, preheatRecoveryRate, rheemRecoveryRate,
      preheatTargetTemp, rheemTargetTemp, coldInTemp, tanklessSetpoint, setpoint, leftPortIsHot, RECIRC_FLOW_GPM]);

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
  const totalSystemBTU = maxRinnaiBTU + maxRheemBTU;
  let maxSystemGPM = totalSystemBTU / (500.4 * Math.max(1, setpoint - coldInTemp));
  if (tanklessSetpoint < setpoint) { maxSystemGPM = maxRheemBTU / (500.4 * Math.max(1, setpoint - coldInTemp)); }

  // BTU calculations
  const preheatBTUh = preheatRecoveryRate * 8.34 * Math.max(0, preheatTargetTemp - coldInTemp);
  const rheemBTUh = rheemRecoveryRate * 8.34 * rheemDeltaT;

  // Optimal flow: max GPM at setpoint sustainable by tank recovery alone
  // Tanks are in series: preheat heats cold→preheatTarget, Rheem heats preheatTarget→setpoint
  // Bottleneck is whichever tank has less capacity relative to its required ΔT
  const rheemGapTemp = setpoint - preheatTargetTemp;
  const maxOptimalGPM = rheemGapTemp <= 0
    ? preheatBTUh / (500.4 * Math.max(1, setpoint - coldInTemp))
    : rheemTargetTemp < setpoint ? 0
    : Math.min(
        preheatBTUh / (500.4 * Math.max(1, preheatTargetTemp - coldInTemp)),
        rheemBTUh / (500.4 * rheemGapTemp)
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
              tTanklessActual={currentTanklessActual} setpoint={setpoint}
              tankFlow={tankFlow} tanklessFlow={tanklessFlow} isTanklessLimited={isTanklessLimited}
              totalFlow={totalFlow} recircFlow={RECIRC_FLOW_GPM}
              upstairsPumpOn={upstairsPumpOn} mainBsmtPumpOn={mainBsmtPumpOn}
              onToggleUpstairs={() => setUpstairsPumpOn(v => !v)} onToggleMainBsmt={() => setMainBsmtPumpOn(v => !v)}
              faucetOn={faucetOn} onToggleFaucet={toggleFaucet}
            />
            <div style={{ background: '#18181b', padding: '2rem', borderRadius: '1rem', border: '1px solid #3f3f46' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Simulation Controls</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Output Demand: <span style={{ color: '#fafafa' }}>{flowRate.toFixed(1)} GPM</span></label><input type="range" min="0" max="20" step="0.1" value={flowRate} onChange={e => setFlowRate(parseFloat(e.target.value))} style={sliderStyle} /></div>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Cold Inlet Temp: <span style={{ color: '#fafafa' }}>{coldInTemp}°F</span></label><input type="range" min="35" max="80" value={coldInTemp} onChange={e => setColdInTemp(parseInt(e.target.value))} style={sliderStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Preheat Tank Target: <span style={{ color: '#fafafa' }}>{preheatTargetTemp}°F</span></label><input type="range" min="70" max="130" value={preheatTargetTemp} onChange={e => setPreheatTargetTemp(parseInt(e.target.value))} style={sliderStyle} /></div>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Water Heater Target: <span style={{ color: '#fafafa' }}>{rheemTargetTemp}°F</span></label><input type="range" min="100" max="160" value={rheemTargetTemp} onChange={e => setRheemTargetTemp(parseInt(e.target.value))} style={sliderStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Preheat Recovery: <span style={{ color: '#fafafa' }}>{formatBTU(preheatBTUhSetting)} BTU/h ({preheatRecoveryRate.toFixed(0)} GPH)</span></label><input type="range" min="5000" max="60000" step="100" value={preheatBTUhSetting} onChange={e => setPreheatBTUhSetting(parseInt(e.target.value))} style={sliderStyle} /></div>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Rheem Recovery: <span style={{ color: '#fafafa' }}>{rheemRecoveryRate} GPH ({formatBTU(rheemBTUh)} BTU/h)</span></label><input type="range" min="1" max="30" value={rheemRecoveryRate} onChange={e => setRheemRecoveryRate(parseInt(e.target.value))} style={sliderStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Mixing Valve Setpoint: <span style={{ color: '#fafafa' }}>{setpoint}°F</span></label><input type="range" min="85" max="160" value={setpoint} onChange={e => setSetpoint(parseInt(e.target.value))} style={sliderStyle} /></div>
                <div><label style={{ display: 'block', fontSize: '0.875rem', color: '#a1a1aa' }}>Tankless Output: <span style={{ color: '#fafafa' }}>{tanklessSetpoint}°F</span></label><input type="range" min="100" max="160" value={tanklessSetpoint} onChange={e => setTanklessSetpoint(parseInt(e.target.value))} style={sliderStyle} /></div>
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
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#18181b', borderRadius: '0.5rem', border: '1px solid #3f3f46', textAlign: 'center' }}><span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block', marginBottom: '0.25rem' }}>ESTIMATED HOT WATER REMAINING</span><span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: minutesRemaining === Infinity ? '#22c55e' : minutesRemaining < 5 ? '#ef4444' : '#f97316' }}>{minutesRemaining === Infinity ? 'Infinite (Stable)' : formatTime(minutesRemaining * 60)}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#18181b', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #3f3f46', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>System Capacity</span>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f4f4f5' }}>{maxSystemGPM.toFixed(1)} GPM</span>
                  <span style={{ fontSize: '0.6rem', color: '#71717a', display: 'block' }}>@ {setpoint}°F Output</span>
                </div>
                <div style={{ background: '#18181b', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #3f3f46', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Optimal Flow</span>
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
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Preheat Recovery</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#93c5fd' }}>{formatBTU(preheatBTUh)} BTU/h</span>
              </div>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Rheem Recovery</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#93c5fd' }}>{formatBTU(rheemBTUh)} BTU/h</span>
              </div>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Tankless Max</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#93c5fd' }}>{formatBTU(tanklessBTUh)} BTU/h</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Preheat Stored</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f59e0b' }}>{formatBTU(preheatStoredBTU)} BTU</span>
              </div>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Rheem Stored</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f59e0b' }}>{formatBTU(rheemStoredBTU)} BTU</span>
              </div>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Total Stored</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f59e0b' }}>{formatBTU(totalStoredBTU)} BTU</span>
                <span style={{ fontSize: '0.7rem', color: '#a1a1aa', display: 'block' }}>{storedTimeH === Infinity ? 'No demand' : `${formatTime(storedTimeH * 3600)} at current demand`}</span>
                <span style={{ fontSize: '0.7rem', color: '#a1a1aa', display: 'block' }}>{storedShowers.toFixed(1)} showers · {storedBaths.toFixed(1)} baths</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Tank Recovery Total</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: tankedBTUh >= demandBTUh ? '#22c55e' : '#f59e0b' }}>{formatBTU(tankedBTUh)} BTU/h</span>
              </div>
              <div style={{ background: '#27272a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', display: 'block', textTransform: 'uppercase' }}>Output Demand</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: demandBTUh > tankedBTUh ? '#ef4444' : '#22c55e' }}>{formatBTU(demandBTUh)} BTU/h</span>
              </div>
            </div>
          </div>
      </div>
      <footer style={{ marginTop: '2rem', textAlign: 'center', padding: '1rem 0', borderTop: '1px solid #27272a' }}>
        <a href="https://github.com/asjoyner/manor-water-simulator" target="_blank" rel="noopener noreferrer" style={{ color: '#a1a1aa', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 600 }}>github.com/asjoyner/manor-water-simulator</a>
      </footer>
    </div>
  );
}

export default App;

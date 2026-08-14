/* ==========================================================================
   Breeze Pearl Cannon Calculator - Core Logic & Physics Engine
   Matching User's Handwritten Physics: Drag=0.99, Gravity=0.03 per tick
   ========================================================================== */

(function () {
    // ----------------------------------------------------------------------
    // Global Physics & App State
    // ----------------------------------------------------------------------
    const state = {
        drag: 0.99,
        gravity: 0.03,
        k_force: 0.40,
        groundLevel: 64,
        stopAtGround: true,
        chamberDx: 1.0,
        chamberDy: 0.5,
        chamberDz: 1.0,
        activeTab: 'inverse', // 'inverse' or 'forward'
        activeGraphTab: 'radar',
        lang: 'tr',
        
        // Target Mode Parameters
        startX: 0,
        startY: 64,
        startZ: 0,
        targetX: 1500,
        targetY: 64,
        targetZ: 800,
        ticks: 100,
        autoTicks: true,

        // Forward Mode Sliders
        fwdNW: 28,
        fwdNE: 0,
        fwdSW: 43,
        fwdSE: 15,
        fwdUp: 0,
        fwdTicks: 100,

        // Solved/Simulated Results
        results: {
            vx0: 0,
            vy0: 0,
            vz0: 0,
            pNW: 0,
            pNE: 0,
            pSW: 0,
            pSE: 0,
            pUp: 0,
            maxY: 0,
            totalDistance: 0,
            finalX: 0,
            finalY: 0,
            finalZ: 0,
            trajectory: []
        }
    };

    // ----------------------------------------------------------------------
    // DOM Elements Cache
    // ----------------------------------------------------------------------
    const el = {
        langToggleBtn: document.getElementById('langToggleBtn'),
        langText: document.getElementById('langText'),
        settingsModalBtn: document.getElementById('settingsModalBtn'),
        settingsModal: document.getElementById('settingsModal'),
        closeSettingsBtn: document.getElementById('closeSettingsBtn'),
        savePhysicsBtn: document.getElementById('savePhysicsBtn'),
        resetPhysicsBtn: document.getElementById('resetPhysicsBtn'),
        
        // Physics Config Inputs
        cfgDrag: document.getElementById('cfgDrag'),
        cfgGravity: document.getElementById('cfgGravity'),
        cfgForceMult: document.getElementById('cfgForceMult'),
        cfgGroundLevel: document.getElementById('cfgGroundLevel'),
        cfgStopAtGround: document.getElementById('cfgStopAtGround'),
        physicsStatusPill: document.getElementById('physicsStatusPill'),
        dispDrag: document.getElementById('dispDrag'),
        dispGravity: document.getElementById('dispGravity'),

        // Chamber Badges
        badgeNW: document.getElementById('badgeNW'),
        badgeNE: document.getElementById('badgeNE'),
        badgeSW: document.getElementById('badgeSW'),
        badgeSE: document.getElementById('badgeSE'),
        vectorCanvas: document.getElementById('vectorCanvas'),
        bbUpInput: document.getElementById('bbUpInput'),

        // Tabs
        tabInverse: document.getElementById('tabInverse'),
        tabForward: document.getElementById('tabForward'),
        contentInverse: document.getElementById('contentInverse'),
        contentForward: document.getElementById('contentForward'),

        // Inverse Mode Inputs
        startX: document.getElementById('startX'),
        startY: document.getElementById('startY'),
        startZ: document.getElementById('startZ'),
        targetX: document.getElementById('targetX'),
        targetY: document.getElementById('targetY'),
        targetZ: document.getElementById('targetZ'),
        ticksInput: document.getElementById('ticksInput'),
        ticksValDisplay: document.getElementById('ticksValDisplay'),
        timeSecDisplay: document.getElementById('timeSecDisplay'),
        btnAutoTicks: document.getElementById('btnAutoTicks'),
        calculateBtn: document.getElementById('calculateBtn'),

        // Forward Mode Inputs
        sliderNW: document.getElementById('sliderNW'),
        sliderNE: document.getElementById('sliderNE'),
        sliderSW: document.getElementById('sliderSW'),
        sliderSE: document.getElementById('sliderSE'),
        valNW: document.getElementById('valNW'),
        valNE: document.getElementById('valNE'),
        valSW: document.getElementById('valSW'),
        valSE: document.getElementById('valSE'),
        fwdTicksInput: document.getElementById('fwdTicks'),

        // Results Card Outputs
        resNW: document.getElementById('resNW'),
        resNE: document.getElementById('resNE'),
        resSW: document.getElementById('resSW'),
        resSE: document.getElementById('resSE'),
        resVx: document.getElementById('resVx'),
        resVy: document.getElementById('resVy'),
        resVz: document.getElementById('resVz'),
        resMaxY: document.getElementById('resMaxY'),
        resDistance: document.getElementById('resDistance'),
        copyResultsBtn: document.getElementById('copyResultsBtn'),

        // Lower Graphs & Table
        radarCanvas: document.getElementById('radarCanvas'),
        profileCanvas: document.getElementById('profileCanvas'),
        tickTableBody: document.getElementById('tickTableBody'),
        tableSearchInput: document.getElementById('tableSearchInput'),
        exportCsvBtn: document.getElementById('exportCsvBtn')
    };

    // ----------------------------------------------------------------------
    // Core Physics Engine: Ender Pearl Simulation
    // ----------------------------------------------------------------------
    function simulatePearlTrajectory(x0, y0, z0, vx0, vy0, vz0, maxTicks) {
        let x = x0, y = y0, z = z0;
        let vx = vx0, vy = vy0, vz = vz0;
        const trajectory = [];
        let maxY = y0;
        let prevX = x0, prevY = y0, prevZ = z0;
        let cumulativeDist = 0;

        trajectory.push({
            tick: 0,
            time: 0,
            x: x0,
            y: y0,
            z: z0,
            vx: vx0,
            vy: vy0,
            vz: vz0,
            speed: Math.sqrt(vx0*vx0 + vy0*vy0 + vz0*vz0) * 20, // m/s
            dist: 0
        });

        for (let t = 1; t <= maxTicks; t++) {
            // Apply Minecraft projectile drag & gravity rules from paper note:
            vx *= state.drag;
            vy = (vy * state.drag) - state.gravity;
            vz *= state.drag;

            x += vx;
            y += vy;
            z += vz;

            if (y > maxY) maxY = y;

            const stepDist = Math.sqrt((x - prevX)**2 + (y - prevY)**2 + (z - prevZ)**2);
            cumulativeDist += stepDist;
            prevX = x; prevY = y; prevZ = z;

            const speedMs = Math.sqrt(vx*vx + vy*vy + vz*vz) * 20;

            trajectory.push({
                tick: t,
                time: (t * 0.05).toFixed(2),
                x: x,
                y: y,
                z: z,
                vx: vx,
                vy: vy,
                vz: vz,
                speed: speedMs,
                dist: cumulativeDist
            });

            // Ground Collision check if enabled
            if (state.stopAtGround && y <= state.groundLevel && t > 1) {
                break;
            }
        }

        return {
            trajectory: trajectory,
            finalX: x,
            finalY: y,
            finalZ: z,
            maxY: maxY,
            totalDistance: cumulativeDist
        };
    }

    // ----------------------------------------------------------------------
    // Core Physics Solver: Target Trajectory -> Velocity & BB Charges
    // ----------------------------------------------------------------------
    function solveInitialVelocity(dx, dy, dz, ticks) {
        let S_N = 0;
        for (let t = 1; t <= ticks; t++) {
            S_N += Math.pow(state.drag, t);
        }

        if (S_N === 0) return { vx0: 0, vy0: 0, vz0: 0 };

        const vx0 = dx / S_N;
        const vz0 = dz / S_N;

        let gravitySum = 0;
        for (let t = 1; t <= ticks; t++) {
            const gravT = state.gravity * (1.0 - Math.pow(state.drag, t)) / (1.0 - state.drag);
            gravitySum += gravT;
        }

        const vy0 = (dy + gravitySum) / S_N;
        return { vx0, vy0, vz0, S_N };
    }

    function solveBbCharges(vx0, vy0, vz0) {
        const dx = state.chamberDx, dy = state.chamberDy, dz = state.chamberDz;
        const norm = Math.sqrt(dx*dx + dy*dy + dz*dz);
        const ux = dx / norm, uy = dy / norm, uz = dz / norm;

        const targetX = ux !== 0 ? vx0 / (state.k_force * ux) : 0;
        const targetZ = uz !== 0 ? vz0 / (state.k_force * uz) : 0;

        const cNW = (targetX + targetZ) / 4.0;
        const cNE = (-targetX + targetZ) / 4.0;
        const cSW = (targetX - targetZ) / 4.0;
        const cSE = (-targetX - targetZ) / 4.0;

        const minC = Math.min(cNW, cNE, cSW, cSE);
        const base = Math.max(0, -minC);

        let pNW = cNW + base;
        let pNE = cNE + base;
        let pSW = cSW + base;
        let pSE = cSE + base;

        // Vertical component contributed by 4 corners:
        const vyFromCorners = state.k_force * uy * (pNW + pNE + pSW + pSE);
        const vyNeededUp = vy0 - vyFromCorners;
        const pUp = Math.max(0, vyNeededUp / (state.k_force * 1.0));

        return {
            pNW: Math.max(0, pNW),
            pNE: Math.max(0, pNE),
            pSW: Math.max(0, pSW),
            pSE: Math.max(0, pSE),
            pUp: pUp
        };
    }

    // Auto-find optimal flight duration ticks for target coordinates
    function findOptimalTicks(dx, dy, dz) {
        let bestTicks = 100;
        let minTotalBB = Infinity;

        const dist2D = Math.sqrt(dx*dx + dz*dz);
        // Estimate heuristic tick bounds
        const estTicks = Math.max(20, Math.min(400, Math.round(dist2D / 15)));

        for (let t = Math.max(15, estTicks - 50); t <= Math.min(500, estTicks + 60); t += 2) {
            const vel = solveInitialVelocity(dx, dy, dz, t);
            const bb = solveBbCharges(vel.vx0, vel.vy0, vel.vz0);
            const totalBB = bb.pNW + bb.pNE + bb.pSW + bb.pSE + bb.pUp;

            if (vel.vy0 > -0.5 && totalBB < minTotalBB) {
                minTotalBB = totalBB;
                bestTicks = t;
            }
        }

        return bestTicks;
    }

    // ----------------------------------------------------------------------
    // Controller / Recalculation Flow
    // ----------------------------------------------------------------------
    function runCalculator() {
        if (state.activeTab === 'inverse') {
            // Read target inputs
            state.startX = parseFloat(el.startX.value) || 0;
            state.startY = parseFloat(el.startY.value) || 64;
            state.startZ = parseFloat(el.startZ.value) || 0;
            state.targetX = parseFloat(el.targetX.value) || 0;
            state.targetY = parseFloat(el.targetY.value) || 64;
            state.targetZ = parseFloat(el.targetZ.value) || 0;

            const dx = state.targetX - state.startX;
            const dy = state.targetY - state.startY;
            const dz = state.targetZ - state.startZ;

            if (state.autoTicks) {
                state.ticks = findOptimalTicks(dx, dy, dz);
                el.ticksInput.value = state.ticks;
            } else {
                state.ticks = parseInt(el.ticksInput.value) || 100;
            }

            el.ticksValDisplay.textContent = state.ticks;
            el.timeSecDisplay.textContent = (state.ticks * 0.05).toFixed(2);

            const vel = solveInitialVelocity(dx, dy, dz, state.ticks);
            const bb = solveBbCharges(vel.vx0, vel.vy0, vel.vz0);
            const sim = simulatePearlTrajectory(state.startX, state.startY, state.startZ, vel.vx0, vel.vy0, vel.vz0, state.ticks);

            state.results = {
                vx0: vel.vx0,
                vy0: vel.vy0,
                vz0: vel.vz0,
                pNW: Math.round(bb.pNW),
                pNE: Math.round(bb.pNE),
                pSW: Math.round(bb.pSW),
                pSE: Math.round(bb.pSE),
                pUp: Math.round(bb.pUp),
                maxY: sim.maxY,
                totalDistance: sim.totalDistance,
                finalX: sim.finalX,
                finalY: sim.finalY,
                finalZ: sim.finalZ,
                trajectory: sim.trajectory
            };

            // Update Up station input
            el.bbUpInput.value = state.results.pUp;

        } else { // Forward Simulator mode
            state.fwdNW = parseFloat(el.sliderNW.value) || 0;
            state.fwdNE = parseFloat(el.sliderNE.value) || 0;
            state.fwdSW = parseFloat(el.sliderSW.value) || 0;
            state.fwdSE = parseFloat(el.sliderSE.value) || 0;
            state.fwdUp = parseFloat(el.bbUpInput.value) || 0;
            state.fwdTicks = parseInt(el.fwdTicksInput.value) || 100;

            const dx = state.chamberDx, dy = state.chamberDy, dz = state.chamberDz;
            const norm = Math.sqrt(dx*dx + dy*dy + dz*dz);
            const ux = dx/norm, uy = dy/norm, uz = dz/norm;

            // Calculate impulse from corner BBs + Up BB
            const vx0 = state.k_force * ux * ((state.fwdNW + state.fwdSW) - (state.fwdNE + state.fwdSE));
            const vz0 = state.k_force * uz * ((state.fwdNW + state.fwdNE) - (state.fwdSW + state.fwdSE));
            const vy0 = state.k_force * uy * (state.fwdNW + state.fwdNE + state.fwdSW + state.fwdSE) + (state.fwdUp * state.k_force * 1.0);

            const sim = simulatePearlTrajectory(state.startX, state.startY, state.startZ, vx0, vy0, vz0, state.fwdTicks);

            state.results = {
                vx0: vx0,
                vy0: vy0,
                vz0: vz0,
                pNW: state.fwdNW,
                pNE: state.fwdNE,
                pSW: state.fwdSW,
                pSE: state.fwdSE,
                pUp: state.fwdUp,
                maxY: sim.maxY,
                totalDistance: sim.totalDistance,
                finalX: sim.finalX,
                finalY: sim.finalY,
                finalZ: sim.finalZ,
                trajectory: sim.trajectory
            };
        }

        updateUIOutputs();
        renderAllVisualizations();
    }

    // ----------------------------------------------------------------------
    // UI Renderers & Visuals
    // ----------------------------------------------------------------------
    function updateUIOutputs() {
        const r = state.results;

        // Chamber Badges
        el.badgeNW.textContent = r.pNW;
        el.badgeNE.textContent = r.pNE;
        el.badgeSW.textContent = r.pSW;
        el.badgeSE.textContent = r.pSE;

        // Forward sliders text
        el.valNW.textContent = r.pNW;
        el.valNE.textContent = r.pNE;
        el.valSW.textContent = r.pSW;
        el.valSE.textContent = r.pSE;

        // Results Card Output
        el.resNW.textContent = r.pNW;
        el.resNE.textContent = r.pNE;
        el.resSW.textContent = r.pSW;
        el.resSE.textContent = r.pSE;

        el.resVx.textContent = r.vx0.toFixed(4);
        el.resVy.textContent = r.vy0.toFixed(4);
        el.resVz.textContent = r.vz0.toFixed(4);

        el.resMaxY.textContent = r.maxY.toFixed(1) + 'm';
        const netDist = Math.sqrt((r.finalX - state.startX)**2 + (r.finalZ - state.startZ)**2);
        el.resDistance.textContent = netDist.toFixed(1) + 'm';

        // Draw Chamber Force Vector Arrows
        drawChamberVectors(r.pNW, r.pNE, r.pSW, r.pSE);

        // Render Table
        renderTickTable(r.trajectory);
    }

    // ----------------------------------------------------------------------
    // Canvas Renderer 1: Chamber Vector Diagram (Paper Note Match)
    // ----------------------------------------------------------------------
    function drawChamberVectors(nw, ne, sw, se) {
        const cv = el.vectorCanvas;
        const ctx = cv.getContext('2d');
        const w = cv.width, h = cv.height;

        ctx.clearRect(0, 0, w, h);

        const center = { x: w / 2, y: h / 2 };
        const corners = {
            nw: { x: 55, y: 40 },
            ne: { x: w - 55, y: 40 },
            sw: { x: 55, y: h - 40 },
            se: { x: w - 55, y: h - 40 }
        };

        const powers = { nw, ne, sw, se };

        Object.keys(corners).forEach(key => {
            const p = corners[key];
            const pwr = powers[key];

            // Direction vector from corner to center pearl
            const dx = center.x - p.x;
            const dy = center.y - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const ux = dx / dist, uy = dy / dist;

            // Draw line
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(center.x - ux * 20, center.y - uy * 20);
            
            const alpha = pwr > 0 ? Math.min(1.0, 0.3 + (pwr / 50)) : 0.15;
            ctx.strokeStyle = pwr > 0 ? `rgba(0, 242, 254, ${alpha})` : 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = pwr > 0 ? Math.min(6, 2 + pwr / 15) : 1;
            ctx.stroke();

            // Arrowhead
            if (pwr > 0) {
                const arrowLen = 10;
                const arrowX = center.x - ux * 22;
                const arrowY = center.y - uy * 22;

                ctx.beginPath();
                ctx.moveTo(arrowX, arrowY);
                ctx.lineTo(arrowX - ux * arrowLen + uy * 6, arrowY - uy * arrowLen - ux * 6);
                ctx.lineTo(arrowX - ux * arrowLen - uy * 6, arrowY - uy * arrowLen + ux * 6);
                ctx.closePath();
                ctx.fillStyle = '#00f2fe';
                ctx.fill();
            }
        });
    }

    // ----------------------------------------------------------------------
    // Canvas Renderer 2: X-Z Top-Down Radar Map
    // ----------------------------------------------------------------------
    function drawRadarCanvas() {
        const cv = el.radarCanvas;
        const ctx = cv.getContext('2d');
        const w = cv.width, h = cv.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#060b11';
        ctx.fillRect(0, 0, w, h);

        const traj = state.results.trajectory;
        if (!traj || traj.length === 0) return;

        // Grid lines
        ctx.strokeStyle = '#142233';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 50) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += 50) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // Determine bounding box
        let minX = state.startX, maxX = state.targetX;
        let minZ = state.startZ, maxZ = state.targetZ;

        traj.forEach(pt => {
            if (pt.x < minX) minX = pt.x;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.z < minZ) minZ = pt.z;
            if (pt.z > maxZ) maxZ = pt.z;
        });

        const margin = 50;
        const rangeX = (maxX - minX) || 100;
        const rangeZ = (maxZ - minZ) || 100;

        function toCanvasX(worldX) {
            return margin + ((worldX - minX) / rangeX) * (w - 2 * margin);
        }
        function toCanvasY(worldZ) {
            return margin + ((worldZ - minZ) / rangeZ) * (h - 2 * margin);
        }

        // Draw Target Marker
        const tx = toCanvasX(state.targetX);
        const tz = toCanvasY(state.targetZ);

        ctx.beginPath();
        ctx.arc(tx, tz, 14, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 82, 82, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(tx, tz, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff5252';
        ctx.fill();

        ctx.fillStyle = '#ff5252';
        ctx.font = '12px "JetBrains Mono"';
        ctx.fillText(`Target (${state.targetX.toFixed(0)}, ${state.targetZ.toFixed(0)})`, tx + 10, tz - 10);

        // Draw Flight Path Trajectory
        ctx.beginPath();
        ctx.moveTo(toCanvasX(traj[0].x), toCanvasY(traj[0].z));

        for (let i = 1; i < traj.length; i++) {
            ctx.lineTo(toCanvasX(traj[i].x), toCanvasY(traj[i].z));
        }

        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw Start Cannon Marker
        const sx = toCanvasX(state.startX);
        const sz = toCanvasY(state.startZ);

        ctx.beginPath();
        ctx.arc(sx, sz, 7, 0, 2 * Math.PI);
        ctx.fillStyle = '#00e676';
        ctx.fill();

        ctx.fillStyle = '#00e676';
        ctx.fillText(`Start (${state.startX}, ${state.startZ})`, sx + 10, sz + 15);
    }

    // ----------------------------------------------------------------------
    // Canvas Renderer 3: Y Height Profile
    // ----------------------------------------------------------------------
    function drawProfileCanvas() {
        const cv = el.profileCanvas;
        const ctx = cv.getContext('2d');
        const w = cv.width, h = cv.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#060b11';
        ctx.fillRect(0, 0, w, h);

        const traj = state.results.trajectory;
        if (!traj || traj.length === 0) return;

        let maxY = state.results.maxY;
        let minY = Math.min(state.groundLevel, state.startY);
        traj.forEach(pt => {
            if (pt.y < minY) minY = pt.y;
        });

        const margin = 45;
        const rangeDist = traj[traj.length - 1].dist || 1;
        const rangeY = (maxY - minY) || 50;

        function toCanvasX(dist) {
            return margin + (dist / rangeDist) * (w - 2 * margin);
        }
        function toCanvasY(yVal) {
            return (h - margin) - ((yVal - minY) / rangeY) * (h - 2 * margin);
        }

        // Draw Ground Level Baseline
        const groundY = toCanvasY(state.groundLevel);
        ctx.beginPath();
        ctx.moveTo(margin, groundY);
        ctx.lineTo(w - margin, groundY);
        ctx.strokeStyle = '#ff9100';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ff9100';
        ctx.font = '11px "JetBrains Mono"';
        ctx.fillText(`Ground Y=${state.groundLevel}`, margin + 5, groundY - 6);

        // Draw Trajectory Parabola
        ctx.beginPath();
        ctx.moveTo(toCanvasX(traj[0].dist), toCanvasY(traj[0].y));

        for (let i = 1; i < traj.length; i++) {
            ctx.lineTo(toCanvasX(traj[i].dist), toCanvasY(traj[i].y));
        }

        ctx.strokeStyle = '#b388ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#b388ff';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Max Y Badge Marker
        const maxPt = traj.reduce((prev, curr) => (curr.y > prev.y) ? curr : prev, traj[0]);
        const mX = toCanvasX(maxPt.dist);
        const mY = toCanvasY(maxPt.y);

        ctx.beginPath();
        ctx.arc(mX, mY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#b388ff';
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '11px "JetBrains Mono"';
        ctx.fillText(`Peak Y: ${maxPt.y.toFixed(1)}m (Tick ${maxPt.tick})`, mX - 40, mY - 10);
    }

    function renderAllVisualizations() {
        if (state.activeGraphTab === 'radar') drawRadarCanvas();
        else if (state.activeGraphTab === 'profile') drawProfileCanvas();
    }

    // ----------------------------------------------------------------------
    // Tick Inspection Table & CSV Export
    // ----------------------------------------------------------------------
    function renderTickTable(trajectory) {
        const tbody = el.tickTableBody;
        tbody.innerHTML = '';

        const filter = el.tableSearchInput.value.trim().toLowerCase();

        trajectory.forEach(pt => {
            if (filter && !pt.tick.toString().includes(filter)) return;

            const tr = document.createElement('tr');
            const chunkStatus = pt.dist > 1500 ? '⚡ Lazy Chunk' : '🟢 Ticking Chunk';

            tr.innerHTML = `
                <td><b>${pt.tick}</b></td>
                <td>${pt.time}s</td>
                <td>${pt.x.toFixed(2)}</td>
                <td>${pt.y.toFixed(2)}</td>
                <td>${pt.z.toFixed(2)}</td>
                <td>${pt.vx.toFixed(4)}</td>
                <td>${pt.vy.toFixed(4)}</td>
                <td>${pt.vz.toFixed(4)}</td>
                <td>${pt.speed.toFixed(1)} m/s</td>
                <td>${chunkStatus}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function exportCsv() {
        const traj = state.results.trajectory;
        if (!traj || traj.length === 0) return;

        let csv = 'Tick,Time_Sec,X,Y,Z,Vx,Vy,Vz,Speed_m_s\n';
        traj.forEach(p => {
            csv += `${p.tick},${p.time},${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)},${p.vx.toFixed(6)},${p.vy.toFixed(6)},${p.vz.toFixed(6)},${p.speed.toFixed(2)}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pearl_cannon_trajectory_ticks_${state.results.trajectory.length}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ----------------------------------------------------------------------
    // Event Listeners & Binding
    // ----------------------------------------------------------------------
    function bindEvents() {
        // Tab switching
        el.tabInverse.addEventListener('click', () => {
            state.activeTab = 'inverse';
            el.tabInverse.classList.add('active');
            el.tabForward.classList.remove('active');
            el.contentInverse.classList.add('active');
            el.contentForward.classList.remove('active');
            runCalculator();
        });

        el.tabForward.addEventListener('click', () => {
            state.activeTab = 'forward';
            el.tabForward.classList.add('active');
            el.tabInverse.classList.remove('active');
            el.contentForward.classList.add('active');
            el.contentInverse.classList.remove('active');
            runCalculator();
        });

        // Graph Tabs
        document.querySelectorAll('.g-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.g-tab').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.g-content').forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                const gtab = btn.dataset.gtab;
                state.activeGraphTab = gtab;

                if (gtab === 'radar') document.getElementById('gContentRadar').classList.add('active');
                else if (gtab === 'profile') document.getElementById('gContentProfile').classList.add('active');
                else if (gtab === 'table') document.getElementById('gContentTable').classList.add('active');

                renderAllVisualizations();
            });
        });

        // Inputs triggering auto recalculate
        [el.startX, el.startY, el.startZ, el.targetX, el.targetY, el.targetZ].forEach(inp => {
            inp.addEventListener('input', () => {
                state.autoTicks = true;
                el.btnAutoTicks.classList.add('active');
                runCalculator();
            });
        });

        el.ticksInput.addEventListener('input', () => {
            state.autoTicks = false;
            el.btnAutoTicks.classList.remove('active');
            runCalculator();
        });

        el.btnAutoTicks.addEventListener('click', () => {
            state.autoTicks = true;
            el.btnAutoTicks.classList.add('active');
            runCalculator();
        });

        document.querySelectorAll('.btn-chip[data-ticks]').forEach(chip => {
            chip.addEventListener('click', () => {
                state.autoTicks = false;
                el.btnAutoTicks.classList.remove('active');
                el.ticksInput.value = chip.dataset.ticks;
                runCalculator();
            });
        });

        el.calculateBtn.addEventListener('click', runCalculator);

        // Forward Mode Sliders
        [el.sliderNW, el.sliderNE, el.sliderSW, el.sliderSE, el.fwdTicksInput, el.bbUpInput].forEach(s => {
            s.addEventListener('input', runCalculator);
        });

        // Search in Table
        el.tableSearchInput.addEventListener('input', () => {
            renderTickTable(state.results.trajectory);
        });

        el.exportCsvBtn.addEventListener('click', exportCsv);

        // Copy Results
        el.copyResultsBtn.addEventListener('click', () => {
            const r = state.results;
            const text = `Breeze Pearl Cannon Settings:\nNW BB: ${r.pNW}\nNE BB: ${r.pNE}\nSW BB: ${r.pSW}\nSE BB: ${r.pSE}\nUp BB: ${r.pUp}\nVx: ${r.vx0.toFixed(6)}, Vy: ${r.vy0.toFixed(6)}, Vz: ${r.vz0.toFixed(6)}\nTarget: (${state.targetX}, ${state.targetY}, ${state.targetZ})`;
            navigator.clipboard.writeText(text).then(() => {
                alert('Sonuçlar panoya kopyalandı!');
            });
        });

        // Settings Modal
        el.settingsModalBtn.addEventListener('click', () => el.settingsModal.classList.add('active'));
        el.closeSettingsBtn.addEventListener('click', () => el.settingsModal.classList.remove('active'));

        el.savePhysicsBtn.addEventListener('click', () => {
            state.drag = parseFloat(el.cfgDrag.value) || 0.99;
            state.gravity = parseFloat(el.cfgGravity.value) || 0.03;
            state.k_force = parseFloat(el.cfgForceMult.value) || 0.40;
            state.groundLevel = parseFloat(el.cfgGroundLevel.value) || 64;
            state.stopAtGround = el.cfgStopAtGround.checked;

            el.dispDrag.textContent = state.drag;
            el.dispGravity.textContent = state.gravity + ' / tick';
            el.physicsStatusPill.textContent = `Fizik: Drag ${state.drag} | Gravity ${state.gravity}`;

            el.settingsModal.classList.remove('active');
            runCalculator();
        });

        el.resetPhysicsBtn.addEventListener('click', () => {
            el.cfgDrag.value = 0.99;
            el.cfgGravity.value = 0.03;
            el.cfgForceMult.value = 0.40;
            el.cfgGroundLevel.value = 64;
            el.cfgStopAtGround.checked = true;
        });

        // Language Switcher Toggle
        el.langToggleBtn.addEventListener('click', () => {
            state.lang = state.lang === 'tr' ? 'en' : 'tr';
            el.langText.textContent = state.lang === 'tr' ? 'EN / TR' : 'TR / EN';
            // Simple translations can be added here if needed
        });
    }

    // ----------------------------------------------------------------------
    // Initialization
    // ----------------------------------------------------------------------
    function init() {
        bindEvents();
        runCalculator();
    }

    // Start on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

const DRAG = 0.99;
const GRAVITY = 0.03;
const K_FORCE = 0.40;

// Chamber offsets relative to Pearl (dy = 0.0 for pure horizontal 0 Y-motion)
const chamberDx = 1.0;
const chamberDy = 0.0; 
const chamberDz = 1.0;

let activeTab = 'target';
let simData = null;

// DOM Elements
const tabTarget = document.getElementById('tab-target');
const tabSim = document.getElementById('tab-simulator');
const viewTarget = document.getElementById('view-target');
const viewSim = document.getElementById('view-simulator');

const startXInput = document.getElementById('start-x');
const startYInput = document.getElementById('start-y');
const startZInput = document.getElementById('start-z');

const targetXInput = document.getElementById('target-x');
const targetYInput = document.getElementById('target-y');
const targetZInput = document.getElementById('target-z');

const btnCalc = document.getElementById('btn-calc');

const simNW = document.getElementById('sim-nw');
const simNE = document.getElementById('sim-ne');
const simSW = document.getElementById('sim-sw');
const simSE = document.getElementById('sim-se');

const valNW = document.getElementById('val-nw');
const valNE = document.getElementById('val-ne');
const valSW = document.getElementById('val-sw');
const valSE = document.getElementById('val-se');

const resNW = document.getElementById('res-nw');
const resNE = document.getElementById('res-ne');
const resSW = document.getElementById('res-sw');
const resSE = document.getElementById('res-se');

const lblNW = document.getElementById('lbl-nw');
const lblNE = document.getElementById('lbl-ne');
const lblSW = document.getElementById('lbl-sw');
const lblSE = document.getElementById('lbl-se');

const resVx = document.getElementById('res-vx');
const resVy = document.getElementById('res-vy');
const resVz = document.getElementById('res-vz');
const resTicks = document.getElementById('res-ticks');
const resSec = document.getElementById('res-sec');
const resDist = document.getElementById('res-dist');

const radarCanvas = document.getElementById('radar-canvas');
const tableBody = document.getElementById('table-body');

// Tabs
tabTarget.addEventListener('click', () => {
    activeTab = 'target';
    tabTarget.classList.add('active');
    tabSim.classList.remove('active');
    viewTarget.classList.add('active');
    viewSim.classList.remove('active');
    calculate();
});

tabSim.addEventListener('click', () => {
    activeTab = 'sim';
    tabSim.classList.add('active');
    tabTarget.classList.remove('active');
    viewSim.classList.add('active');
    viewTarget.classList.remove('active');
    calculate();
});

btnCalc.addEventListener('click', calculate);

[simNW, simNE, simSW, simSE].forEach(slider => {
    slider.addEventListener('input', () => {
        valNW.textContent = simNW.value;
        valNE.textContent = simNE.value;
        valSW.textContent = simSW.value;
        valSE.textContent = simSE.value;
        calculate();
    });
});

function simulateTrajectory(x0, y0, z0, vx0, vy0, vz0, ticks) {
    let x = x0, y = y0, z = z0;
    let vx = vx0, vy = vy0, vz = vz0;
    const trajectory = [];
    let maxY = y0;
    let totalDist = 0;
    let px = x0, py = y0, pz = z0;

    trajectory.push({ tick: 0, time: 0, x, y, z, vx, vy, vz, speed: Math.sqrt(vx*vx + vy*vy + vz*vz) * 20 });

    for (let t = 1; t <= ticks; t++) {
        vx *= DRAG;
        vy = (vy * DRAG) - GRAVITY;
        vz *= DRAG;

        x += vx;
        y += vy;
        z += vz;

        if (y > maxY) maxY = y;

        const dist = Math.sqrt((x - px)**2 + (y - py)**2 + (z - pz)**2);
        totalDist += dist;
        px = x; py = y; pz = z;

        const speed = Math.sqrt(vx*vx + vy*vy + vz*vz) * 20;

        trajectory.push({ tick: t, time: (t * 0.05).toFixed(2), x, y, z, vx, vy, vz, speed });

        if (y <= 64 && t > 1) break;
    }

    return { trajectory, maxY, totalDist, finalX: x, finalY: y, finalZ: z };
}

function solveInitialVelocities(dx, dy, dz, ticks) {
    let sN = 0;
    for (let t = 1; t <= ticks; t++) {
        sN += Math.pow(DRAG, t);
    }

    if (sN === 0) return { vx0: 0, vy0: 0, vz0: 0 };

    const vx0 = dx / sN;
    const vz0 = dz / sN;

    let gravitySum = 0;
    for (let t = 1; t <= ticks; t++) {
        gravitySum += GRAVITY * (1.0 - Math.pow(DRAG, t)) / (1.0 - DRAG);
    }

    const vy0 = (dy + gravitySum) / sN;
    return { vx0, vy0, vz0 };
}

function solveChargeDistribution(vx0, vy0, vz0) {
    const norm = Math.sqrt(chamberDx**2 + chamberDy**2 + chamberDz**2);
    const ux = chamberDx / norm;
    const uz = chamberDz / norm;

    const Fx = ux !== 0 ? vx0 / (K_FORCE * ux) : 0;
    const Fz = uz !== 0 ? vz0 / (K_FORCE * uz) : 0;

    const A = (Fx + Fz) / 2.0;
    const B = (Fx - Fz) / 2.0;

    const pNW = Math.max(0.0, A);
    const pSE = Math.max(0.0, -A);
    const pSW = Math.max(0.0, B);
    const pNE = Math.max(0.0, -B);

    return { pNW, pNE, pSW, pSE };
}

// Automatically calculate optimal flight ticks based on target distance
function findOptimalTicks(dx, dy, dz) {
    let bestTicks = 100;
    let minCharges = Infinity;

    for (let t = 15; t <= 350; t++) {
        const vel = solveInitialVelocities(dx, dy, dz, t);
        const dist = solveChargeDistribution(vel.vx0, vel.vy0, vel.vz0);
        const total = dist.pNW + dist.pNE + dist.pSW + dist.pSE;

        if (total < minCharges && vel.vy0 > -1.0) {
            minCharges = total;
            bestTicks = t;
        }
    }

    return bestTicks;
}

function calculate() {
    const x0 = parseFloat(startXInput.value) || 0;
    const y0 = parseFloat(startYInput.value) || 64;
    const z0 = parseFloat(startZInput.value) || 0;

    let pNW = 0, pNE = 0, pSW = 0, pSE = 0;
    let vx0 = 0, vy0 = 0, vz0 = 0;
    let ticks = 100;

    if (activeTab === 'target') {
        const tx = parseFloat(targetXInput.value) || 0;
        const ty = parseFloat(targetYInput.value) || 64;
        const tz = parseFloat(targetZInput.value) || 0;

        const dx = tx - x0;
        const dy = ty - y0;
        const dz = tz - z0;

        ticks = findOptimalTicks(dx, dy, dz);

        const vel = solveInitialVelocities(dx, dy, dz, ticks);
        vx0 = vel.vx0; vy0 = vel.vy0; vz0 = vel.vz0;

        const dist = solveChargeDistribution(vx0, vy0, vz0);
        pNW = Math.round(dist.pNW);
        pNE = Math.round(dist.pNE);
        pSW = Math.round(dist.pSW);
        pSE = Math.round(dist.pSE);
    } else {
        pNW = parseInt(simNW.value) || 0;
        pNE = parseInt(simNE.value) || 0;
        pSW = parseInt(simSW.value) || 0;
        pSE = parseInt(simSE.value) || 0;

        const norm = Math.sqrt(chamberDx**2 + chamberDy**2 + chamberDz**2);
        const ux = chamberDx / norm, uz = chamberDz / norm;

        vx0 = K_FORCE * ux * ((pNW + pSW) - (pNE + pSE));
        vz0 = K_FORCE * uz * ((pNW + pNE) - (pSW + pSE));
        vy0 = 0.0; // Pure horizontal 0 Y-motion
        ticks = 100;
    }

    const sim = simulateTrajectory(x0, y0, z0, vx0, vy0, vz0, ticks);
    simData = sim;

    // Display Results
    resNW.textContent = pNW;
    resNE.textContent = pNE;
    resSW.textContent = pSW;
    resSE.textContent = pSE;

    lblNW.textContent = pNW;
    lblNE.textContent = pNE;
    lblSW.textContent = pSW;
    lblSE.textContent = pSE;

    resVx.textContent = vx0.toFixed(4);
    resVy.textContent = vy0.toFixed(4);
    resVz.textContent = vz0.toFixed(4);

    resTicks.textContent = ticks;
    resSec.textContent = (ticks * 0.05).toFixed(2);
    const netDist = Math.sqrt((sim.finalX - x0)**2 + (sim.finalZ - z0)**2);
    resDist.textContent = netDist.toFixed(1) + 'm';

    renderRadarCanvas(sim.trajectory, x0, z0, parseFloat(targetXInput.value) || 0, parseFloat(targetZInput.value) || 0);
    renderTable(sim.trajectory);
}

function renderRadarCanvas(traj, startX, startZ, targetX, targetZ) {
    const ctx = radarCanvas.getContext('2d');
    const w = radarCanvas.width, h = radarCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, w, h);

    if (!traj || traj.length === 0) return;

    let minX = startX, maxX = targetX;
    let minZ = startZ, maxZ = targetZ;

    traj.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.z < minZ) minZ = p.z;
        if (p.z > maxZ) maxZ = p.z;
    });

    const margin = 40;
    const rx = (maxX - minX) || 10;
    const rz = (maxZ - minZ) || 10;

    function toX(x) { return margin + ((x - minX) / rx) * (w - 2 * margin); }
    function toY(z) { return margin + ((z - minZ) / rz) * (h - 2 * margin); }

    // Path
    ctx.beginPath();
    ctx.moveTo(toX(traj[0].x), toY(traj[0].z));
    for (let i = 1; i < traj.length; i++) {
        ctx.lineTo(toX(traj[i].x), toY(traj[i].z));
    }
    ctx.strokeStyle = '#4fc1ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Start
    ctx.beginPath();
    ctx.arc(toX(startX), toY(startZ), 5, 0, Math.PI * 2);
    ctx.fillStyle = '#4ec9b0';
    ctx.fill();

    // Target
    ctx.beginPath();
    ctx.arc(toX(targetX), toY(targetZ), 5, 0, Math.PI * 2);
    ctx.fillStyle = '#f14c4c';
    ctx.fill();
}

function renderTable(traj) {
    tableBody.innerHTML = '';
    traj.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.tick}</td>
            <td>${p.time}</td>
            <td>${p.x.toFixed(2)}</td>
            <td>${p.y.toFixed(2)}</td>
            <td>${p.z.toFixed(2)}</td>
            <td>${p.vx.toFixed(4)}</td>
            <td>${p.vy.toFixed(4)}</td>
            <td>${p.vz.toFixed(4)}</td>
            <td>${p.speed.toFixed(1)}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// Initial calculation
calculate();

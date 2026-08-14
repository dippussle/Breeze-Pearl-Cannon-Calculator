# Breeze Pearl Cannon Calculator 🎯

An interactive **Ender Pearl 360° Vector Calculator and Flight Simulator** designed for Technical Minecraft (TMC) redstone engineers using **Breeze Ball (BB)** impulse arrays.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Minecraft](https://img.shields.io/badge/Minecraft-1.21%2B-green.svg)

## 📌 Features

- **🎯 Target Coordinates Solver (Inverse Mode)**: Input starting coords $(X_0, Y_0, Z_0)$ and target coords $(X_t, Y_t, Z_t)$ $\to$ calculates exact initial velocities ($V_x, V_y, V_z$) and required Breeze Ball (BB) charges for all 4 corner stations (NW, NE, SW, SE).
- **🧪 Forward Trajectory Simulator**: Set BB charges manually to observe pearl landing point, peak Y altitude, and total flight distance.
- **🎨 Interactive 4-Corner Chamber Diagram**: Visualizes force vectors acting on the Ender Pearl inside the launch chamber (matching custom 4-corner BB chamber mechanics).
- **🧭 Top-Down X-Z Radar Map & Y Height Profile**: Real-time canvas graphs displaying flight trajectory and parabolic height profile.
- **📋 Tick-by-Tick Inspector & CSV Export**: Inspect velocity, coordinates, speed ($m/s$), and chunk status for every tick.
- **⚙️ Customizable Physics Engine**: Adjust Drag ($0.99$), Gravity ($0.03$), BB Force Multipliers, and Ground Level collision parameters.

---

## 📐 Physics Equations

Based on standard Ender Pearl projectile mechanics:

$$\begin{aligned}
V_{x,t} &= V_{x,t-1} \times 0.99 \\
V_{z,t} &= V_{z,t-1} \times 0.99 \\
V_{y,t} &= (V_{y,t-1} \times 0.99) - 0.03
\end{aligned}$$

- **Drag Coefficient**: `0.99` per tick
- **Gravity Acceleration**: `0.03` per tick
- **Tick Duration**: `1 Tick = 0.05 seconds` ($20\text{ ticks/sec}$)

---

## ⚙️ Chamber Layout Setup

```
   BB (NW)       BB (NE)
        \         /
         \       /
          [ Pearl ]
         /       \
        /         \
   BB (SW)       BB (SE)
```

- **NW (North-West)**: Pushes Pearl $+X, +Y, +Z$
- **NE (North-East)**: Pushes Pearl $-X, +Y, +Z$
- **SW (South-West)**: Pushes Pearl $+X, +Y, -Z$
- **SE (South-East)**: Pushes Pearl $-X, +Y, -Z$

---

## 🚀 Quick Start / Local Run

No installation required! Simply open `index.html` in any web browser, or serve locally using Python:

```bash
python -m http.server 8085
```
Then navigate to `http://localhost:8085`.

---

## 📄 License

MIT License. Free for use and modification by the Technical Minecraft community!

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { open } from "@tauri-apps/plugin-shell";
import { setOnboardingComplete } from "../../services/storage";
import kalamIcon from "../../assets/kalam-icon.png";
import "./Onboarding.css";

// ─── Data ────────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "GlazeWM",
    icon: (
      <svg width="40" height="40" viewBox="0 0 88 94" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 4.99509H39.2085V32.5073C39.2085 33.7735 38.1759 34.7999 36.9021 34.7999H0V4.99509Z" fill="#FB5141"/>
        <path d="M0 41.678H36.9021C38.1759 41.678 39.2085 42.7044 39.2085 43.9707V92.117H0V41.678Z" fill="#94D2BD"/>
        <path d="M46.125 64.6048C46.125 63.3386 47.1576 62.3121 48.4314 62.3121H87.6399V92.117H46.125V64.6048Z" fill="#005F73"/>
        <path d="M46.125 4.99509H87.6399V55.4341H48.4314C47.1576 55.4341 46.125 54.4076 46.125 53.1414V4.99509Z" fill="#FFBD41"/>
      </svg>
    ),
  },
  {
    name: "Zebar",
    icon: (
      <span class="feature-card__icon">
        <svg width="40" height="40" viewBox="0 0 294 294" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 C12.08 4.74 23.62 17.99 33.19 26.69 C37.42 30.54 41.82 34.14 46.27 37.74 C49.84 40.69 53.26 43.78 56.68 46.89 C61.11 50.92 65.63 54.84 70.19 58.71 C77.02 64.53 83.74 70.45 90.33 76.54 C93.18 79.17 96.09 81.73 99.02 84.27 C101.31 86.27 103.56 88.32 105.81 90.38 C109.23 93.47 112.72 96.42 116.31 99.31 C122.32 104.17 127.92 109.41 133.57 114.68 C138.41 119.16 143.43 123.36 148.56 127.5 C152.38 130.61 155.93 133.8 159.35 137.34 C161.04 139.04 162.8 140.62 164.63 142.19 C170.55 147.31 176.27 152.66 182 158 C182.99 158.92 182.99 158.92 184.01 159.87 C210.3 184.34 210.3 184.34 219.5 195.29 C221.76 197.87 224.23 200.21 226.71 202.55 C228 204 228 204 228 206 C228.66 206 229.32 206 230 206 C231.3 207.26 231.3 207.26 232.88 209.13 C233.81 210.22 233.81 210.22 234.76 211.34 C235.5 212.22 236.24 213.1 237 214 C238.41 215.64 239.81 217.28 241.22 218.91 C242.77 220.71 244.31 222.52 245.84 224.32 C247.93 226.78 250.06 229.19 252.22 231.58 C252.73 232.16 253.24 232.73 253.76 233.32 C254.73 234.41 255.71 235.49 256.7 236.56 C258.9 239.07 259.96 240.72 260.45 244.05 C258.87 254.4 250.42 263.64 242.53 269.99 C238.28 272.99 238.28 272.99 236 274 C232.2 272.73 231.51 271.29 229.19 268.06 C228.38 266.96 227.58 265.86 226.77 264.77 C226.33 264.16 225.89 263.56 225.44 262.94 C203.6 229.22 203.6 229.22 173.13 207 C172.09 207 171.06 207 170 207 C167.59 208.98 167.59 208.98 167.63 212.81 C167.84 221.94 171.59 230.61 175.46 238.75 C176.68 241.33 177.86 243.92 179 246.54 C183.41 256.54 188.12 266.28 193.35 275.89 C195 279 195 279 195 280 C152.51 284.86 152.51 284.86 143.3 277.57 C137.29 271.45 134.41 262.91 131.55 254.99 C129.22 248.7 125.66 243.15 122.19 237.44 C120.95 235.3 119.72 233.17 118.5 231.03 C93.89 188.49 66.1 148.04 32.69 111.91 C30.84 109.91 29.01 107.92 27.19 105.91 C22.34 100.57 17.44 95.34 12.27 90.33 C10.34 88.35 8.54 86.34 6.75 84.25 C2.95 79.88 -1.08 75.77 -5.19 71.69 C-5.89 70.99 -6.58 70.28 -7.3 69.56 C-7.98 68.88 -8.66 68.21 -9.36 67.51 C-9.96 66.91 -10.57 66.3 -11.19 65.68 C-13 63.93 -13 63.93 -15.23 62.41 C-15.81 61.94 -16.4 61.48 -17 61 C-17 60.34 -17 59.68 -17 59 C-17.6 58.73 -18.2 58.46 -18.81 58.19 C-21.06 56.97 -22.38 55.97 -24 54 C-24.4 52.01 -24.4 52.01 -24.43 49.75 C-24.45 48.92 -24.46 48.09 -24.47 47.23 C-24.46 46.35 -24.45 45.47 -24.44 44.56 C-24.43 43.66 -24.42 42.76 -24.41 41.82 C-24.06 28.17 -18.95 17.08 -9.33 7.28 C-3 1.5 -3 1.5 0 0 Z" fill="#FA5647" transform="translate(28,11)"/>
          <path d="M0 0 C5.5 5.48 5.5 5.48 7.69 8.06 C8.16 8.6 8.62 9.15 9.1 9.71 C9.82 10.56 9.82 10.56 10.56 11.44 C11.62 12.68 12.68 13.93 13.74 15.17 C14.28 15.81 14.82 16.44 15.37 17.09 C16.95 18.95 18.54 20.79 20.13 22.64 C25.39 28.75 30.58 34.9 35.66 41.16 C38.39 44.48 41.19 47.74 44 51 C48.25 55.93 52.43 60.91 56.53 65.97 C58.44 68.31 60.36 70.64 62.28 72.97 C69.15 81.27 75.93 89.62 82.54 98.13 C84.12 100.16 85.71 102.18 87.3 104.2 C95.18 114.25 102.83 124.45 110.37 134.77 C111.92 136.89 113.48 139 115.04 141.11 C115.52 141.76 116 142.41 116.5 143.08 C117.36 144.24 118.23 145.41 119.1 146.58 C123.28 152.24 127.11 158.13 131 164 C132.37 166.05 133.74 168.09 135.11 170.14 C136.47 172.18 137.83 174.21 139.19 176.25 C139.87 177.27 140.56 178.3 141.26 179.35 C152 195.43 152 195.43 152 198 C137.96 198.07 123.92 198.12 109.88 198.16 C103.36 198.17 96.84 198.19 90.32 198.23 C84.03 198.26 77.73 198.28 71.44 198.28 C69.04 198.29 66.64 198.3 64.24 198.32 C60.88 198.34 57.51 198.34 54.14 198.34 C53.16 198.35 52.17 198.36 51.16 198.37 C37.17 198.31 25.34 192.88 15.26 183.33 C9.97 177.87 5.98 172 3 165 C2.49 163.91 1.98 162.81 1.46 161.69 C-0.71 155.83 -0.37 149.92 -0.29 143.75 C-0.29 142.5 -0.28 141.24 -0.28 139.95 C-0.27 136.64 -0.24 133.34 -0.21 130.03 C-0.18 126.64 -0.16 123.26 -0.15 119.87 C-0.11 113.25 -0.06 106.62 0 100 C1.11 100.93 2.23 101.87 3.34 102.81 C3.95 103.33 4.57 103.86 5.21 104.39 C7.86 106.77 9.98 109.43 12.13 112.25 C12.58 112.84 13.04 113.44 13.52 114.05 C18.41 120.43 23.09 126.96 27.76 133.5 C29.9 136.49 32.07 139.46 34.27 142.41 C35.04 143.45 35.04 143.45 35.82 144.5 C36.8 145.81 37.77 147.11 38.75 148.41 C42 152.78 42 152.78 42 155 C43.65 154.67 45.3 154.34 47 154 C46.71 146.11 43.45 140.12 39.88 133.19 C39.32 132.08 38.76 130.96 38.19 129.82 C32.92 119.45 26.73 109.84 20 100.38 C19.48 99.64 18.96 98.91 18.43 98.16 C15.74 94.39 13.03 90.65 10.19 87 C9.7 86.37 9.22 85.74 8.71 85.09 C7.06 82.99 7.06 82.99 5.18 81.24 C-1.09 74.68 -0.93 67.89 -0.74 59.34 C-0.72 58.55 -0.7 57.75 -0.68 56.93 C-0.67 55.29 -0.66 53.64 -0.65 52 C-0.63 47.69 -0.56 43.38 -0.48 39.08 C-0.41 34.67 -0.38 30.27 -0.34 25.87 C-0.27 17.24 -0.15 8.62 0 0 Z" fill="#056377" transform="translate(4,93)"/>
          <path d="M0 0 C10.91 -0.07 21.82 -0.12 32.73 -0.16 C37.8 -0.17 42.86 -0.19 47.93 -0.23 C52.83 -0.26 57.72 -0.28 62.62 -0.28 C64.48 -0.29 66.34 -0.3 68.2 -0.32 C85.16 -0.46 99.2 1.97 112.16 14.02 C117.85 20.13 122.18 27.14 125 35 C125.34 35.95 125.68 36.9 126.04 37.88 C127.55 43.25 127.26 48.73 127.23 54.27 C127.23 55.49 127.23 56.71 127.23 57.97 C127.23 61.3 127.22 64.62 127.2 67.95 C127.19 71.44 127.19 74.92 127.19 78.4 C127.18 85 127.16 91.59 127.14 98.18 C127.12 105.68 127.11 113.19 127.1 120.7 C127.08 136.13 127.04 151.57 127 167 C123.83 163.94 121.87 161.23 119.9 157.27 C119.33 156.14 118.76 155.02 118.18 153.86 C117.89 153.27 117.59 152.68 117.29 152.07 C108.55 134.61 98.48 118.9 86.72 103.29 C85.1 101.14 83.5 98.97 81.89 96.8 C75.31 87.9 68.44 79.28 61.41 70.73 C59.54 68.44 57.71 66.13 55.88 63.81 C51.53 58.37 47.03 53.05 42.5 47.75 C41.49 46.58 40.49 45.4 39.48 44.21 C31.52 34.87 23.26 25.85 14.83 16.94 C11.91 13.85 9.01 10.74 6.13 7.63 C5.62 7.08 5.11 6.54 4.59 5.98 C1.12 2.23 1.12 2.23 0 0 Z" fill="#FABB44" transform="translate(164,4)"/>
          <path d="M0 0 C8.6 -0.19 17.19 -0.33 25.79 -0.41 C29.79 -0.46 33.78 -0.51 37.77 -0.6 C41.63 -0.69 45.49 -0.74 49.34 -0.76 C50.81 -0.77 52.28 -0.8 53.75 -0.85 C65.2 -1.17 65.2 -1.17 69.61 1.69 C71.64 3.69 73.32 5.71 75 8 C76.16 9.34 77.32 10.68 78.5 12 C79.07 12.66 79.63 13.32 80.22 14 C82.7 16.79 85.37 19.38 88.03 22 C90.57 24.58 92.92 27.32 95.29 30.07 C96.96 31.95 98.7 33.73 100.5 35.5 C103.54 38.49 106.35 41.62 109.13 44.84 C111.17 47.2 113.27 49.51 115.38 51.81 C119.27 56.13 122.97 60.57 126.63 65.09 C128.72 67.65 130.84 70.18 132.99 72.69 C151.12 93.92 167.82 116.58 183 140 C183.43 140.67 183.86 141.33 184.31 142.02 C196.16 160.34 206.75 179.25 216.75 198.63 C218.45 201.86 220.26 205.02 222.08 208.18 C223 210 223 210 223 212 C220.05 210.69 218.21 209.4 216.16 206.92 C215.65 206.32 215.15 205.71 214.63 205.09 C214.11 204.46 213.59 203.83 213.06 203.19 C209.53 198.93 205.95 194.89 202 191 C200.55 189.41 199.11 187.8 197.69 186.19 C194.22 182.3 190.62 178.6 186.91 174.94 C184.35 172.34 181.98 169.58 179.59 166.81 C177.5 164.43 175.27 162.21 173 160 C172.29 159.28 171.57 158.55 170.84 157.81 C167.37 154.38 163.82 151.07 160.25 147.75 C155.05 142.9 149.94 137.98 144.95 132.91 C142.37 130.38 139.64 128.03 136.9 125.68 C135.02 124.02 133.26 122.29 131.5 120.5 C128.55 117.51 125.47 114.75 122.29 112.01 C119.53 109.59 116.83 107.11 114.13 104.63 C110.43 101.23 106.73 97.85 103 94.5 C99.27 91.15 95.57 87.77 91.88 84.38 C88.62 81.38 85.35 78.4 82 75.5 C78.12 72.14 74.34 68.67 70.57 65.19 C66.55 61.5 62.5 57.83 58.44 54.19 C55.91 51.92 53.39 49.65 50.88 47.38 C48.02 44.81 45.16 42.26 42.25 39.75 C37.78 35.86 33.47 31.8 29.14 27.76 C25.5 24.38 21.82 21.06 18.07 17.81 C15.27 15.36 12.51 12.88 9.75 10.38 C9.24 9.92 8.73 9.46 8.21 8.99 C5.14 6.2 2.56 3.26 0 0 Z" fill="#97CEBB" transform="translate(63,4)"/>
        </svg>
      </span>
    ),
  },
  {
    name: "YASB",
    icon: (
      <svg width="40" height="40" viewBox="0 0 869 869" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M241.51,136.69H184a25.09,25.09,0,0,0-22.34,36.52L339.93,521.75a25.08,25.08,0,0,1,.19,22.46L262,703.79a25.09,25.09,0,0,0,22.53,36.13h79.09a46.73,46.73,0,0,0,42-26.18L477,567.88a77.72,77.72,0,0,0-.61-69.59L314.17,181.14A81.6,81.6,0,0,0,241.51,136.69Z" fill="white"/>
        <path d="M557,169.36,491.73,302.65a74.31,74.31,0,0,0,.58,66.54l36,70.42c9.44,18.46,35.89,18.22,45-.39l134.1-273.91a25.16,25.16,0,0,0-22.59-36.23H621.55A71.89,71.89,0,0,0,557,169.36Z" fill="white"/>
      </svg>
    ),
  },
  {
    name: "Rainmeter",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.7 1.088L12 0l-.7 1.088c-.751 1.168-7.342 11.525-7.342 15.366C3.958 20.615 7.565 24 12 24s8.042-3.385 8.042-7.546c0-3.84-6.591-14.197-7.342-15.366M12 22.335c-3.516 0-6.377-2.638-6.377-5.881C5.623 13.908 9.732 6.756 12 3.1c2.268 3.656 6.377 10.809 6.377 13.355c0 3.242-2.861 5.88-6.377 5.88m4.957-6.017c0 2.548-2.22 4.615-4.957 4.615s-4.957-2.067-4.957-4.615q.001-.245.058-.549s1.306-2.616 4.847 0c2.999 2.215 4.95 0 4.95 0q.058.304.059.549"/>
      </svg>
    ),
  },
  {
    name: "Windhawk",
    icon: (
      <svg width="40" height="40" viewBox="0 0 750 750" xmlns="http://www.w3.org/2000/svg">
       <g>
        <title>background</title>
        <rect x="-1" y="-1" width="752" height="752" id="canvas_background" fill="none"/>
       </g>
      
       <g>
        <title>Layer 1</title>
        <path fill="#ffffff" stroke-width="0" d="m208.00003,254.6l3.6,-0.6c-20.9,9.9 -49,30.4 -67.8,44.9c-30.4,23.3 -54.1,57.9 -74,92.9c84.1,-45.7 161.8,-52.4 178.5,-48.2c0.2,0.1 -7.7,45.5 -36.7,83.6c-30.5,39.9 -82.2,72.4 -82.2,72.4c18.9,2.2 37.9,2.6 56.7,0.8c32.2,-3 65.3,-12.4 91.5,-34.7c11.6,-9.9 32.8,-39 30.5,-34.8c-12.5,31.2 -14.3,66.7 -12.3,100.6c1.1,19.9 3.2,39.6 9.1,58.4c5,16.1 12.3,31.2 20.6,45.3l8.2,6.5c0.1,-0.7 -7.9,-111.8 48.5,-166.7c102.6,-99.8 216,-4.9 216,-4.9s-4.5,-75.2 -89.6,-111.7c203.8,-18.8 159.7,102 159.7,102s69.8,-29.8 59.1,-114.9c-9.7,-77 -85,-95.3 -100.7,-98.3c-13.2,-21.7 -113.2,-186.8 -279.8,-121.9c-180.6,70.3 -326.9,53.6 -326.9,53.6c21.5,24.7 46.7,44.6 74.1,58.7c35.6,18.4 75.3,23.8 113.9,17zm314,-15.9c6.3,2.1 12.7,4.2 19.1,6.2c-0.5,6.1 -4.8,10.9 -10,10.9c-5.5,0 -10.1,-5.4 -10.1,-12.1c0.1,-1.8 0.4,-3.5 1,-5zm-40.1,2.4c0,-5.1 0.9,-9.9 2.6,-14.4c3.8,0.9 7.6,1.8 11.2,3c3.8,1.2 7.5,2.5 11.3,3.8c-1.1,3.1 -1.8,6.5 -1.8,10.1c0,15.4 11.6,27.9 25.9,27.9c12.6,0 23,-9.7 25.4,-22.5c2.7,0.6 5.3,1.3 8,1.8c-4.4,18.5 -20.9,32.3 -40.7,32.3c-23.2,0 -41.9,-18.8 -41.9,-42z" id="svg_1"/>
       </g>
      </svg>
    ),
  },
  {
    name: "Wallpaper",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
      </svg>
    ),
  },
];

const TOUR_ITEMS = [
  {
    icon: "🏠",
    label: "Home — Dashboard",
    desc: "View all your profiles. Apply a profile with one click.",
  },
  {
    icon: "✚",
    label: "New Profile",
    desc: "Create and edit profiles. Toggle which tools are included and configure their settings.",
  },
  {
    icon: "⚙",
    label: "Settings",
    desc: "Set global paths to your installed tools. Kalam can auto-detect common install locations.",
  },
];

const TOTAL_STEPS = 5;

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }) {
  return (
    <div className="step-indicator" aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`step-dot ${i + 1 === current ? "active" : i + 1 < current ? "done" : ""}`}
        />
      ))}
    </div>
  );
}

// ─── Individual Steps ─────────────────────────────────────────────────────────

function StepWelcome() {
  return (
    <div className="step-content" key="welcome">
      <div className="welcome-logo">
        <div className="welcome-logo-ring">
          <img src={kalamIcon} alt="Kalam" className="welcome-logo-img" />
        </div>
      </div>
      <h1 className="welcome-title">Welcome to Kalam</h1>
      <p className="welcome-subtitle">
        Profile-based desktop environment manager for Windows.
      </p>
      <p className="welcome-desc">
        Kalam lets you create profiles that bundle configurations for all your
        Windows customization tools. Switch your entire desktop setup —
        Rainmeter, taskbar, wallpaper, window manager, and more — with a single
        click.
      </p>
    </div>
  );
}

function StepTools() {
  return (
    <div className="step-content" key="tools">
      <h2 className="step-title">Tools You Can Manage</h2>
      <div className="tools-grid">
        {TOOLS.map((t) => (
          <div className="tool-card" key={t.name}>
            <div className="tool-icon">{t.icon}</div>
            <div className="tool-info">
              <h3>{t.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepDocs() {
  const openDocs = () => open("https://comp-tech-guy.github.io/Kalam/docs/index.html");
  const openDiscord = () => open("https://discord.gg/EApJY56M8h");

  return (
    <div className="step-content" key="docs">
      <h2 className="step-title">Need Help?</h2>
      <div className="help-cards">
        <button
          className="help-card"
          id="ob-docs-link"
          onClick={openDocs}
        >
          <div className="help-icon">📖</div>
          <div className="help-info">
            <h3>Documentation</h3>
            <p>
              Read the full Kalam documentation to learn about advanced
              features, configuration guides, and troubleshooting tips.
            </p>
          </div>
          <span className="help-card-arrow">›</span>
        </button>
        <button
          className="help-card"
          id="ob-discord-link"
          onClick={openDiscord}
        >
          <div className="help-icon">💬</div>
          <div className="help-info">
            <h3>Discord Server</h3>
            <p>
              Join our community on Discord to ask questions, share your setups,
              and get help from other users and the developers.
            </p>
          </div>
          <span className="help-card-arrow">›</span>
        </button>
      </div>
    </div>
  );
}

function StepTour() {
  return (
    <div className="step-content" key="tour">
      <h2 className="step-title">Your Workspace</h2>
      <div className="tour-items">
        {TOUR_ITEMS.map((item) => (
          <div className="tour-item" key={item.label}>
            <div className="tour-icon">{item.icon}</div>
            <div className="tour-info">
              <h3>{item.label}</h3>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepFinal({ onComplete }) {
  const navigate = useNavigate();

  const finish = async (dest) => {
    await onComplete();
    navigate(dest);
  };

  return (
    <div className="step-content" key="final">
      <div className="final-icon">
        <div className="final-icon-inner">🚀</div>
      </div>
      <h2 className="step-title">Ready to Get Started?</h2>
      <p className="final-desc">
        Create your first profile to bundle your desktop configuration. You can
        always edit it later.
      </p>
      <div className="final-actions">
        <button
          id="ob-create-profile"
          className="btn-ob-primary"
          onClick={() => finish("/profile")}
        >
          Create My First Profile
        </button>
        <button
          id="ob-go-dashboard"
          className="btn-ob-secondary"
          onClick={() => finish("/")}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

// ─── Main Onboarding Component ───────────────────────────────────────────────

function Onboarding({ onDone }) {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleComplete = async () => {
    await setOnboardingComplete(true);
    onDone();
  };

  const handleSkip = async () => {
    await handleComplete();
    navigate("/");
  };

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const isLast = step === TOTAL_STEPS;

  const renderStep = () => {
    switch (step) {
      case 1: return <StepWelcome />;
      case 2: return <StepTools />;
      case 3: return <StepDocs />;
      case 4: return <StepTour />;
      case 5: return <StepFinal onComplete={handleComplete} />;
      default: return null;
    }
  };

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Onboarding wizard">
      <div className="onboarding-card">
        <StepIndicator current={step} total={TOTAL_STEPS} />

        {renderStep()}

        {/* Footer nav — hidden on final step since it has its own CTAs */}
        {!isLast && (
          <div className="onboarding-footer">
            <button
              className="footer-skip"
              onClick={handleSkip}
              id="ob-skip-btn"
            >
              Skip setup
            </button>
            <div className="footer-nav">
              {step > 1 && (
                <button className="btn-ob-back" onClick={back} id="ob-back-btn">
                  ← Back
                </button>
              )}
              <button
                className="btn-ob-primary"
                onClick={step === 1 ? next : next}
                id="ob-next-btn"
              >
                {step === 1 ? "Get Started →" : "Next →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Onboarding;

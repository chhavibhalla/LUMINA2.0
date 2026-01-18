lucide.createIcons();
let pin = "";
let ethChartInstance = null;

// --- LOCK SCREEN LOGIC ---
function tap(v) {
    if(v === 'del') pin = pin.slice(0, -1);
    else if(typeof v === 'number' && pin.length < 4) pin += v;
    
    document.querySelectorAll('.pin-circle').forEach((d, i) => d.classList.toggle('filled', i < pin.length));
    
    if(pin === "1234") {
        gsap.to("#lock-screen", { opacity: 0, duration: 0.5, onComplete: () => {
            document.getElementById('lock-screen').style.display = 'none';
            document.getElementById('app-interface').classList.remove('hidden');
            gsap.to("#app-interface", { opacity: 1, duration: 0.8 });
            initViz();
        }});
    }
}

// --- OVERLAY CONTROLS ---
function handleAction(action) {
    if (action === 'send') {
        const overlay = document.getElementById('send-overlay');
        overlay.classList.remove('hidden');
        gsap.to("#send-overlay", { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" });
        
        // Trigger chart after a short delay
        setTimeout(() => { openChart(); }, 300);

        // Preview Element
        const previewExists = document.getElementById('send-preview');
        if(!previewExists) {
            const preview = document.createElement('div');
            preview.id = 'send-preview';
            preview.className = "flex items-center justify-between p-3 mb-4 bg-[#1c1c1c] rounded-xl border border-white/10";
            preview.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-[#627EEA] flex items-center justify-center relative border border-white/10">
                        <i data-lucide="arrow-up-right" class="w-5 h-5 text-white/70"></i>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-sm font-semibold text-green-400 uppercase">Sent ETH</span>
                        <span class="text-[10px] text-white/50">Preview</span>
                    </div>
                </div>
                <div class="flex flex-col items-end">
                    <span class="text-sm font-bold text-white">-0.005 ETH</span>
                    <span class="text-xs text-white/40">-$16.47</span>
                </div>`;
            overlay.prepend(preview);
            lucide.createIcons();
        }
    } else {
        const statusLabel = document.getElementById('status-label');
        statusLabel.innerText = `${action.toUpperCase()} INITIATED`;
        gsap.fromTo(statusLabel, { opacity: 0.2 }, { opacity: 1, duration: 0.5 });
    }
}

function closeOverlay(id) {
    gsap.to(`#${id}`, { y: "100%", opacity: 0, duration: 0.4, ease: "power2.in", onComplete: () => {
        document.getElementById(id).classList.add('hidden');
    }});
}

// --- CHART LOGIC ---
function openChart() {
    const overlay = document.getElementById("chart-overlay");
    overlay.classList.remove("hidden");
    gsap.to(overlay, { y: 0, duration: 0.5, ease: "expo.out", onComplete: loadETHChart });
}

function closeChart() {
    const overlay = document.getElementById("chart-overlay");
    gsap.to(overlay, { y: "100%", duration: 0.4, ease: "power2.in", onComplete: () => overlay.classList.add("hidden") });
}

async function loadETHChart() {
    const canvas = document.getElementById("ethChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (ethChartInstance) ethChartInstance.destroy();

    try {
        const res = await fetch("http://127.0.0.1:5000/predict");
        const data = await res.json();
        const labels = [...data.historical.map(d => d.date), ...data.predicted.map(d => d.date)];
        const historicalPrices = data.historical.map(d => d.price);
        const predictedPrices = [...Array(historicalPrices.length).fill(null), ...data.predicted.map(d => d.price)];

        ethChartInstance = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    { label: "Historical", data: historicalPrices, borderWidth: 2, tension: 0.4, borderColor: '#06b6d4' },
                    { label: "Predicted (2026)", data: predictedPrices, borderDash: [6, 6], borderWidth: 2, tension: 0.4, borderColor: '#ec4899' }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#aaa", font: { size: 10 } } } } }
        });
    } catch (err) { console.error("Chart load failed:", err); }
}

// --- INITIALIZATION & EVENTS ---
function initViz() {
    const v = document.getElementById('viz');
    v.innerHTML = '';
    for(let i=0; i<15; i++) {
        const b = document.createElement('div'); b.className = 'wave-bar'; v.appendChild(b);
    }
    gsap.to(".wave-bar", { height: 12, duration: 0.6, repeat: -1, yoyo: true, stagger: 0.05 });
}

function switchTab(tabId) {
    const tabs = ['activity', 'tokens', 'defi', 'nfts'];
    tabs.forEach(t => {
        const el = document.getElementById(`tab-${t}`);
        if (el) el.className = "pb-2 text-[11px] font-medium text-white/40 transition-all cursor-pointer";
    });
    const activeTab = document.getElementById(`tab-${tabId}`);
    activeTab.className = "pb-2 text-[11px] font-bold text-white border-b border-white transition-all cursor-pointer";
    gsap.fromTo("#shelf-content", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 });
}

function processIntent() {
    const input = document.getElementById('text-input');
    const val = input.value.trim();
    if(!val) return;
    const shelf = document.getElementById('shelf-content');
    const userMsg = document.createElement('div');
    userMsg.className = "self-end bg-white/5 px-4 py-2 rounded-2xl border border-white/10 text-xs italic text-white/60 mb-4";
    userMsg.innerText = `"${val}"`;
    shelf.prepend(userMsg);
    input.value = "";
    document.getElementById('status-label').innerText = "AI THINKING...";
}

function confirmMockSend() {
    alert("Processing transaction through Neural Core...");
    closeOverlay('send-overlay');
}

// Event Listeners
document.getElementById('btn-buy').addEventListener('click', () => handleAction('buy'));
document.getElementById('btn-swap').addEventListener('click', () => handleAction('swap'));
document.getElementById('btn-send').addEventListener('click', () => handleAction('send'));
document.getElementById('btn-receive').addEventListener('click', () => handleAction('receive'));

// --- SPLASH ANIMATION ---
window.onload = () => {
    const letters = document.querySelectorAll('.letter');
    const orbContainer = document.getElementById('orb-container');

    letters.forEach((letter, i) => {
        const wrapper = document.createElement('div'); wrapper.className = 'absolute';
        const core = document.createElement('div'); core.className = 'orb-core';
        const glow = document.createElement('div'); glow.className = 'orb-glow';
        glow.style.background = i % 2 === 0 ? 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)';
        wrapper.appendChild(core); wrapper.appendChild(glow); orbContainer.appendChild(wrapper);
        gsap.set(wrapper, { x: Math.random() * window.innerWidth, y: Math.random() > 0.5 ? -200 : window.innerHeight + 200, xPercent: -50, yPercent: -50, scale: 0.2, opacity: 0 });

        requestAnimationFrame(() => {
            const rect = letter.getBoundingClientRect();
            const tx = rect.left + rect.width / 2;
            const ty = rect.top + rect.height / 2;
            const orbTL = gsap.timeline({ delay: i * 0.15 });
            orbTL.to(wrapper, { opacity: 1, scale: 1, duration: 1 })
                 .to(wrapper, { x: tx, y: ty, scale: 0.5, duration: 1.5, ease: "expo.inOut", onComplete: () => {
                     gsap.to(letter, { opacity: 1, y: 0, duration: 0.1, color: "#fff", textShadow: i % 2 === 0 ? "0 0 20px #06b6d4" : "0 0 20px #ec4899" });
                     gsap.to(glow, { scale: 2, opacity: 0, duration: 1 });
                     gsap.to(core, { scale: 0, duration: 0.5 });
                 }});
        });
    });

    gsap.to("#splash", { opacity: 0, duration: 1, delay: letters.length * 0.15 + 2, onComplete: () => {
        document.getElementById('splash').style.display = 'none';
        document.getElementById('lock-screen').classList.remove('hidden');
        gsap.to("#lock-screen", { opacity: 1, duration: 0.5 });
    }});
};

async function loadETHChart() {
    const canvas = document.getElementById("ethChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (ethChartInstance) ethChartInstance.destroy();

    // Use PapaParse to read the CSV file
    Papa.parse("data.csv", {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            const data = results.data;
            
            // Filter data for Historical vs Predicted
            const historical = data.filter(row => row.type === 'historical');
            const predicted = data.filter(row => row.type === 'predicted');

            const labels = data.map(row => row.date);
            const historicalPrices = historical.map(row => row.price);
            
            // Offset predicted prices so they start where historical ends
            const predictedPrices = [
                ...Array(historical.length - 1).fill(null),
                historical[historical.length - 1].price, // Connect the lines
                ...predicted.map(row => row.price)
            ];

            ethChartInstance = new Chart(ctx, {
                type: "line",
                data: {
                    labels,
                    datasets: [
                        {
                            label: "Historical ETH",
                            data: historicalPrices,
                            borderColor: "#06b6d4",
                            backgroundColor: "rgba(6, 182, 212, 0.1)",
                            fill: true,
                            borderWidth: 2,
                            tension: 0.4
                        },
                        {
                            label: "Neural Prediction",
                            data: predictedPrices,
                            borderColor: "#ec4899",
                            borderDash: [6, 6],
                            borderWidth: 2,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false } // Cleaner UI
                    },
                    scales: {
                        x: { display: true, ticks: { color: "#444", size: 8 } },
                        y: { display: false }
                    }
                }
            });
        }
    });
}
/**
 * AgriSmart — Next-Generation Client-Side Application Logic (script.js)
 * High-Level UI/UX Engine:
 *   - Glassmorphism & Dual-Theme Engine (Light Glass / Cyber Dark)
 *   - Web Audio API Sound Synthesizer (Zero asset dependencies)
 *   - 2-Way Synchronized Dual Sliders & Numeric Inputs with Live Telemetry Badges
 *   - Animated Inference Scanner HUD with simulated telemetry sequence
 *   - Canvas Physics Confetti Burst on Recommendation
 *   - Interactive Soil Telemetry Radar Chart (Chart.js)
 *   - Regional Agro-Climatic Simulation & Academic Presets
 *   - 22-Crop Catalog Explorer with Search & Filter
 *   - 3D Interactive Card Tilt & Scroll Reveal Animations
 *   - Circular SVG Scroll Progress Indicator & One-Click Report Copy
 */

document.addEventListener("DOMContentLoaded", () => {
    // -------------------------------------------------------------------------
    // 1. Audio Synthesizer (Pure Web Audio API)
    // -------------------------------------------------------------------------
    let audioCtx = null;
    let isSoundEnabled = localStorage.getItem("agrismart_sound") !== "disabled";
    const soundToggleBtn = document.getElementById("soundToggleBtn");
    const soundIcon = document.getElementById("soundIcon");

    function initAudio() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
    }

    function updateSoundIcon() {
        if (soundIcon) {
            if (isSoundEnabled) {
                soundIcon.className = "bi bi-volume-up";
                soundToggleBtn.setAttribute("title", "Sound FX: On (Click to Mute)");
            } else {
                soundIcon.className = "bi bi-volume-mute text-danger";
                soundToggleBtn.setAttribute("title", "Sound FX: Muted (Click to Unmute)");
            }
        }
    }
    updateSoundIcon();

    if (soundToggleBtn) {
        soundToggleBtn.addEventListener("click", () => {
            isSoundEnabled = !isSoundEnabled;
            localStorage.setItem("agrismart_sound", isSoundEnabled ? "enabled" : "disabled");
            updateSoundIcon();
            if (isSoundEnabled) {
                initAudio();
                playTone(520, "sine", 0.1, 0.15);
                showToast("Sound effects enabled.");
            } else {
                showToast("Sound effects muted.");
            }
        });
    }

    function playTone(freq, type = "sine", duration = 0.12, gainLevel = 0.08) {
        if (!isSoundEnabled) return;
        try {
            initAudio();
            if (!audioCtx) return;
            if (audioCtx.state === "suspended") {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(gainLevel, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            // Audio context blocked or not supported
        }
    }

    function playSuccessChord() {
        if (!isSoundEnabled) return;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            setTimeout(() => {
                playTone(freq, "triangle", 0.35, 0.06);
            }, i * 90);
        });
    }

    // -------------------------------------------------------------------------
    // 2. Dual-Theme Engine (Light Glass / Cyber Dark)
    // -------------------------------------------------------------------------
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const themeIcon = document.getElementById("themeIcon");

    function getPreferredTheme() {
        const saved = localStorage.getItem("agrismart_theme");
        if (saved) return saved;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("agrismart_theme", theme);
        if (themeIcon) {
            if (theme === "dark") {
                themeIcon.className = "bi bi-sun-fill text-warning";
                themeToggleBtn.setAttribute("title", "Switch to Light Frosted Glass Mode");
            } else {
                themeIcon.className = "bi bi-moon-stars text-primary-theme";
                themeToggleBtn.setAttribute("title", "Switch to Cyber Dark Glass Mode");
            }
        }
        // Refresh charts with updated theme palette if already initialized
        if (window.modelCompChartInstance && window.featImpChartInstance) {
            updateChartsTheme(theme);
        }
    }

    applyTheme(getPreferredTheme());

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const current = document.documentElement.getAttribute("data-theme");
            const target = current === "dark" ? "light" : "dark";
            applyTheme(target);
            playTone(target === "dark" ? 380 : 580, "sine", 0.15, 0.1);
            showToast(`Theme switched to ${target === "dark" ? "Cyber Dark Glass" : "Light Frosted Glass"}`);
        });
    }

    // -------------------------------------------------------------------------
    // 3. Form & Dual Inputs (Sliders + Number Input Synchronization)
    // -------------------------------------------------------------------------
    const form = document.getElementById("cropForm");
    const submitBtn = document.getElementById("submitBtn");
    const resetBtn = document.getElementById("resetBtn");
    const randomizeBtn = document.getElementById("randomizeBtn");
    const errorAlert = document.getElementById("errorAlert");
    const errorList = document.getElementById("errorList");

    const resultPlaceholder = document.getElementById("resultPlaceholder");
    const resultScanner = document.getElementById("resultScanner");
    const resultActive = document.getElementById("resultActive");
    const scannerStep = document.getElementById("scannerStep");

    const cropNameEl = document.getElementById("cropName");
    const cropIconEl = document.getElementById("cropIcon");
    const cropCategoryEl = document.getElementById("cropCategory");
    const confidenceTextEl = document.getElementById("confidenceText");
    const confidenceBarEl = document.getElementById("confidenceBar");
    const specSeasonEl = document.getElementById("specSeason");
    const specSoilEl = document.getElementById("specSoil");
    const specWaterEl = document.getElementById("specWater");
    const alternativesListEl = document.getElementById("alternativesList");
    const distributionWarningBox = document.getElementById("distributionWarningBox");
    const warningListEl = document.getElementById("warningList");
    const copyAdvisoryBtn = document.getElementById("copyAdvisoryBtn");

    const featureIds = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'];

    // Telemetry range profiles for real-time status assessment
    const TELEMETRY_RANGES = {
        N: {
            calc: (v) => v < 40 ? { label: "Deficient (" + v + ")", cls: "status-warning" }
                      : v <= 100 ? { label: "Optimal (" + v + ")", cls: "status-optimal" }
                      : { label: "Excess (" + v + ")", cls: "status-danger" }
        },
        P: {
            calc: (v) => v < 25 ? { label: "Low (" + v + ")", cls: "status-warning" }
                      : v <= 80 ? { label: "Optimal (" + v + ")", cls: "status-optimal" }
                      : { label: "High (" + v + ")", cls: "status-danger" }
        },
        K: {
            calc: (v) => v < 25 ? { label: "Low (" + v + ")", cls: "status-warning" }
                      : v <= 85 ? { label: "Optimal (" + v + ")", cls: "status-optimal" }
                      : { label: "High (" + v + ")", cls: "status-danger" }
        },
        temperature: {
            calc: (v) => v < 15 ? { label: "Cold (" + v + "°C)", cls: "status-warning" }
                      : v <= 32 ? { label: "Optimal (" + v + "°C)", cls: "status-optimal" }
                      : { label: "Hot (" + v + "°C)", cls: "status-danger" }
        },
        humidity: {
            calc: (v) => v < 40 ? { label: "Arid (" + v + "%)", cls: "status-warning" }
                      : v <= 85 ? { label: "Optimal (" + v + "%)", cls: "status-optimal" }
                      : { label: "Humid (" + v + "%)", cls: "status-optimal" }
        },
        ph: {
            calc: (v) => v < 5.5 ? { label: "Acidic (" + v + ")", cls: "status-warning" }
                      : v <= 7.5 ? { label: "Neutral/Ideal (" + v + ")", cls: "status-optimal" }
                      : { label: "Alkaline (" + v + ")", cls: "status-danger" }
        },
        rainfall: {
            calc: (v) => v < 60 ? { label: "Low (" + v + "mm)", cls: "status-warning" }
                      : v <= 220 ? { label: "Optimal (" + v + "mm)", cls: "status-optimal" }
                      : { label: "Heavy (" + v + "mm)", cls: "status-optimal" }
        }
    };

    function updateBadge(id, val) {
        const badge = document.getElementById(`badge_${id}`);
        if (!badge || isNaN(val)) return;
        const conf = TELEMETRY_RANGES[id];
        if (conf) {
            const res = conf.calc(val);
            badge.textContent = res.label;
            badge.className = `status-pill ${res.cls}`;
        }
    }

    // Bind Dual Inputs: Sliders <-> Number Inputs
    featureIds.forEach(id => {
        const numInput = document.getElementById(id);
        const slider = document.getElementById(`range_${id}`);

        if (numInput && slider) {
            // Slider to input
            slider.addEventListener("input", () => {
                numInput.value = slider.value;
                numInput.classList.remove("is-invalid");
                updateBadge(id, parseFloat(slider.value));
            });

            slider.addEventListener("change", () => {
                playTone(400 + parseFloat(slider.value) * 3, "sine", 0.05, 0.03);
            });

            // Input to slider
            numInput.addEventListener("input", () => {
                const val = parseFloat(numInput.value);
                if (!isNaN(val)) {
                    slider.value = val;
                    updateBadge(id, val);
                }
            });
        }
    });

    // Initialize all input badges on load
    featureIds.forEach(id => {
        const numInput = document.getElementById(id);
        if (numInput && numInput.value) {
            updateBadge(id, parseFloat(numInput.value));
        }
    });

    // -------------------------------------------------------------------------
    // 4. Regional Agro-Climatic Zone Presets
    // -------------------------------------------------------------------------
    const REGIONAL_PRESETS = {
        punjab: {
            N: 115, P: 52, K: 38, temperature: 24.5, humidity: 62.0, ph: 7.3, rainfall: 82.0,
            label: "Indo-Gangetic Punjab (Alluvial, High Nitrogen)"
        },
        kerala: {
            N: 35, P: 25, K: 42, temperature: 28.5, humidity: 88.0, ph: 5.6, rainfall: 245.0,
            label: "Coastal Malabar (Humid Tropics, High Monsoon)"
        },
        deccan: {
            N: 85, P: 42, K: 46, temperature: 27.0, humidity: 56.0, ph: 7.2, rainfall: 72.0,
            label: "Deccan Plateau (Vertisol Black Loam)"
        },
        himachal: {
            N: 22, P: 130, K: 195, temperature: 16.5, humidity: 88.0, ph: 6.0, rainfall: 112.0,
            label: "Temperate Highlands (Kashmir/HP Apple Belt)"
        },
        assam: {
            N: 48, P: 28, K: 32, temperature: 24.0, humidity: 86.0, ph: 5.2, rainfall: 250.0,
            label: "Assam Subtropical Valley (Heavy Precipitation)"
        },
        rajasthan: {
            N: 28, P: 32, K: 48, temperature: 33.5, humidity: 24.0, ph: 7.8, rainfall: 38.0,
            label: "Thar Arid Basin (Low Moisture, Sandy Alkaline)"
        }
    };

    document.querySelectorAll(".region-pill").forEach(pill => {
        pill.addEventListener("click", () => {
            document.querySelectorAll(".region-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            const regKey = pill.getAttribute("data-region");
            if (REGIONAL_PRESETS[regKey]) {
                loadValues(REGIONAL_PRESETS[regKey]);
            }
        });
    });

    // Academic Demo Presets
    const DEMO_PRESETS = {
        rice: {
            N: 90, P: 42, K: 43, temperature: 20.8, humidity: 82.0, ph: 6.5, rainfall: 202.9, label: "Rice (Kharif Monsoon)"
        },
        apple: {
            N: 20, P: 135, K: 200, temperature: 22.5, humidity: 92.3, ph: 5.9, rainfall: 110.5, label: "Apple (High K/P Temperate)"
        },
        cotton: {
            N: 118, P: 46, K: 20, temperature: 24.0, humidity: 80.0, ph: 6.8, rainfall: 80.2, label: "Cotton (High Nitrogen Cash Crop)"
        },
        chickpea: {
            N: 40, P: 68, K: 80, temperature: 19.5, humidity: 16.5, ph: 7.2, rainfall: 75.0, label: "Chickpea (Low Humidity Legume)"
        },
        coffee: {
            N: 101, P: 28, K: 32, temperature: 25.5, humidity: 60.5, ph: 6.8, rainfall: 160.0, label: "Coffee (Tropical Highland)"
        },
        watermelon: {
            N: 100, P: 18, K: 50, temperature: 26.0, humidity: 85.0, ph: 6.5, rainfall: 50.0, label: "Watermelon (Summer Zaid)"
        }
    };

    document.querySelectorAll(".preset-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const presetKey = chip.getAttribute("data-preset");
            if (DEMO_PRESETS[presetKey]) {
                loadValues(DEMO_PRESETS[presetKey]);
            }
        });
    });

    function loadValues(data) {
        clearErrors();
        featureIds.forEach(id => {
            const numInput = document.getElementById(id);
            const slider = document.getElementById(`range_${id}`);
            if (data[id] !== undefined) {
                if (numInput) {
                    numInput.value = data[id];
                    numInput.classList.remove("is-invalid");
                }
                if (slider) {
                    slider.value = data[id];
                }
                updateBadge(id, data[id]);
            }
        });
        playTone(600, "sine", 0.12, 0.08);
        showToast(`Loaded telemetry: ${data.label}`);
    }

    // Randomize Realistic Telemetry
    if (randomizeBtn) {
        randomizeBtn.addEventListener("click", () => {
            const randomSample = {
                N: Math.floor(Math.random() * 110) + 15,
                P: Math.floor(Math.random() * 100) + 10,
                K: Math.floor(Math.random() * 130) + 15,
                temperature: parseFloat((Math.random() * 20 + 15).toFixed(1)),
                humidity: parseFloat((Math.random() * 60 + 30).toFixed(1)),
                ph: parseFloat((Math.random() * 3 + 5).toFixed(1)),
                rainfall: parseFloat((Math.random() * 180 + 35).toFixed(1)),
                label: "Randomized Synthetic Assays"
            };
            loadValues(randomSample);
        });
    }

    // Reset Form
    resetBtn.addEventListener("click", () => {
        form.reset();
        clearErrors();
        featureIds.forEach(id => {
            const slider = document.getElementById(`range_${id}`);
            const input = document.getElementById(id);
            if (slider && input) {
                slider.value = slider.defaultValue || 50;
                input.value = "";
                const badge = document.getElementById(`badge_${id}`);
                if (badge) {
                    badge.textContent = "Awaiting";
                    badge.className = "status-pill status-optimal";
                }
            }
        });
        resultActive.classList.add("d-none");
        resultScanner.classList.add("d-none");
        resultPlaceholder.classList.remove("d-none");
        distributionWarningBox.classList.add("d-none");
        document.querySelectorAll(".region-pill").forEach(p => p.classList.remove("active"));
        playTone(350, "sine", 0.1, 0.05);
        showToast("Inputs and recommendations reset to default.");
    });

    function clearErrors() {
        errorAlert.classList.add("d-none");
        errorList.replaceChildren();
        featureIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.classList.remove("is-invalid");
        });
    }

    function showErrors(errors) {
        errorList.replaceChildren();
        errors.forEach(err => {
            const li = document.createElement("li");
            li.textContent = err;
            errorList.appendChild(li);
        });
        errorAlert.classList.remove("d-none");
        errorAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
        playTone(220, "sawtooth", 0.25, 0.15);
    }

    // -------------------------------------------------------------------------
    // 5. Form Submission with High-Tech Scanning HUD
    // -------------------------------------------------------------------------
    let lastPredictionData = null;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearErrors();

        // 1. Validation
        const clientErrors = [];
        const payload = {};

        featureIds.forEach(id => {
            const input = document.getElementById(id);
            const rawVal = input.value.trim();

            if (rawVal === "") {
                clientErrors.push(`Field '${id.toUpperCase()}' cannot be empty.`);
                input.classList.add("is-invalid");
                return;
            }

            const num = parseFloat(rawVal);
            if (isNaN(num)) {
                clientErrors.push(`Field '${id.toUpperCase()}' must be a valid number.`);
                input.classList.add("is-invalid");
                return;
            }

            payload[id] = num;
        });

        if (clientErrors.length > 0) {
            showErrors(clientErrors);
            return;
        }

        // 2. High-Tech Scanning State
        submitBtn.disabled = true;
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Executing Random Forest Model...
        `;

        resultPlaceholder.classList.add("d-none");
        resultActive.classList.add("d-none");
        resultScanner.classList.remove("d-none");

        playTone(480, "sine", 0.08, 0.06);

        // Simulated scanning sequence
        const scanSteps = [
            "Normalizing soil chemistry N-P-K assays...",
            "Evaluating microclimate boundary limits...",
            "Querying 100 Random Forest bagging estimators...",
            "Aggregating consensus voting distribution..."
        ];

        let stepIdx = 0;
        const scanInterval = setInterval(() => {
            stepIdx = (stepIdx + 1) % scanSteps.length;
            if (scannerStep) scannerStep.textContent = scanSteps[stepIdx];
            playTone(550 + stepIdx * 40, "sine", 0.04, 0.03);
        }, 220);

        try {
            const response = await fetch("/api/predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            // Artificial short delay so user enjoys the futuristic scanner animation
            await new Promise(r => setTimeout(r, 650));
            clearInterval(scanInterval);

            const data = await response.json();

            if (!response.ok) {
                resultScanner.classList.add("d-none");
                resultPlaceholder.classList.remove("d-none");
                const errorDetails = data.details || [data.message || "An unknown error occurred during prediction."];
                showErrors(errorDetails);
                return;
            }

            // 3. Render Prediction Results
            resultScanner.classList.add("d-none");
            renderPredictionResults(data.prediction, payload);

        } catch (err) {
            clearInterval(scanInterval);
            resultScanner.classList.add("d-none");
            resultPlaceholder.classList.remove("d-none");
            console.error("Network or inference error:", err);
            showErrors(["Failed to communicate with AgriSmart server. Please verify backend is running."]);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
        }
    });

    // -------------------------------------------------------------------------
    // 6. Render Prediction Results & Confetti Celebration
    // -------------------------------------------------------------------------
    function renderPredictionResults(pred, inputPayload) {
        lastPredictionData = { pred, input: inputPayload };

        cropNameEl.textContent = pred.crop_display || pred.crop;
        cropIconEl.textContent = pred.icon || "🌱";
        cropCategoryEl.textContent = pred.category || "Agricultural Crop";

        const conf = pred.confidence_percent || 0;
        confidenceTextEl.textContent = `${conf}%`;
        confidenceBarEl.style.width = `${Math.min(conf, 100)}%`;

        specSeasonEl.textContent = pred.season || "Optimal harvest based on regional climate";
        specSoilEl.textContent = pred.ideal_soil || "Loamy soil with balanced drainage";
        specWaterEl.textContent = pred.water_requirement || "Moderate irrigation";

        // Top Alternative Recommendations
        alternativesListEl.replaceChildren();
        if (pred.top_recommendations && pred.top_recommendations.length > 1) {
            pred.top_recommendations.slice(1).forEach((alt) => {
                const row = document.createElement("div");
                row.className = "alt-crop-row";

                const leftDiv = document.createElement("div");
                leftDiv.className = "d-flex align-items-center gap-2";

                const iconSpan = document.createElement("span");
                iconSpan.style.fontSize = "1.3rem";
                iconSpan.textContent = alt.icon || "🌱";

                const nameDiv = document.createElement("div");
                const boldName = document.createElement("div");
                boldName.className = "fw-bold";
                boldName.style.fontSize = "0.9rem";
                boldName.textContent = alt.crop_display;

                const catSmall = document.createElement("div");
                catSmall.className = "small text-muted-theme";
                catSmall.style.fontSize = "0.75rem";
                catSmall.textContent = alt.category;

                nameDiv.appendChild(boldName);
                nameDiv.appendChild(catSmall);
                leftDiv.appendChild(iconSpan);
                leftDiv.appendChild(nameDiv);

                const rightDiv = document.createElement("div");
                rightDiv.className = "text-end";

                const probBadge = document.createElement("span");
                probBadge.className = "badge bg-light text-dark border";
                probBadge.textContent = `${alt.confidence_percent}% Match`;

                rightDiv.appendChild(probBadge);
                row.appendChild(leftDiv);
                row.appendChild(rightDiv);
                alternativesListEl.appendChild(row);
            });
        }

        // Out-of-Distribution Warnings
        if (pred.distribution_warnings && pred.distribution_warnings.length > 0) {
            warningListEl.replaceChildren();
            pred.distribution_warnings.forEach(w => {
                const li = document.createElement("li");
                li.textContent = w;
                warningListEl.appendChild(li);
            });
            distributionWarningBox.classList.remove("d-none");
        } else {
            distributionWarningBox.classList.add("d-none");
        }

        // Show Result Panel
        resultActive.classList.remove("d-none");

        // Render Dynamic Soil Telemetry Radar Chart
        renderSoilRadarChart(inputPayload);

        // Sound & Celebration
        playSuccessChord();
        triggerConfetti();

        if (window.innerWidth < 992) {
            resultActive.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    // -------------------------------------------------------------------------
    // 7. Dynamic Soil Telemetry Radar Chart
    // -------------------------------------------------------------------------
    let soilRadarChartInstance = null;

    function renderSoilRadarChart(inputs) {
        const ctx = document.getElementById("soilRadarChart");
        if (!ctx) return;

        // Normalization against nominal maximums for intuitive 0-100% visualization
        const normN = Math.min(100, (inputs.N / 140) * 100);
        const normP = Math.min(100, (inputs.P / 145) * 100);
        const normK = Math.min(100, (inputs.K / 205) * 100);
        const normTemp = Math.min(100, ((inputs.temperature - 5) / 38) * 100);
        const normHum = Math.min(100, inputs.humidity);
        const normPH = Math.min(100, ((inputs.ph - 3.5) / 6.5) * 100);
        const normRain = Math.min(100, (inputs.rainfall / 300) * 100);

        const dataVals = [normN, normP, normK, normTemp, normHum, normPH, normRain];
        const labels = ["Nitrogen", "Phosphorus", "Potassium", "Temp", "Humidity", "pH", "Rainfall"];

        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const gridColor = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(15, 23, 42, 0.08)";
        const labelColor = isDark ? "#cbd5e1" : "#475569";

        if (soilRadarChartInstance) {
            soilRadarChartInstance.data.datasets[0].data = dataVals;
            soilRadarChartInstance.update();
            return;
        }

        soilRadarChartInstance = new Chart(ctx, {
            type: "radar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Input Telemetry (%)",
                        data: dataVals,
                        backgroundColor: "rgba(16, 185, 129, 0.25)",
                        borderColor: "#10b981",
                        borderWidth: 2,
                        pointBackgroundColor: "#059669",
                        pointBorderColor: "#fff",
                        pointHoverBackgroundColor: "#fff",
                        pointHoverBorderColor: "#059669"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: gridColor },
                        grid: { color: gridColor },
                        pointLabels: {
                            color: labelColor,
                            font: { family: "Inter", size: 9, weight: 600 }
                        },
                        ticks: { display: false, max: 100, min: 0 }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` Normalized: ${Math.round(ctx.raw)}%`
                        }
                    }
                }
            }
        });
    }

    // -------------------------------------------------------------------------
    // 8. One-Click Agronomic Report Copy
    // -------------------------------------------------------------------------
    if (copyAdvisoryBtn) {
        copyAdvisoryBtn.addEventListener("click", () => {
            if (!lastPredictionData) return;
            const { pred, input } = lastPredictionData;

            const report = `=====================================================
🌾 AGRISMART CROP RECOMMENDATION REPORT
=====================================================
Primary Recommendation: ${pred.crop_display.toUpperCase()} (${pred.category})
Ensemble Consensus Match: ${pred.confidence_percent}%
Optimal Cultivation Season: ${pred.season}
Water Requirement: ${pred.water_requirement}
Soil Horizon Profile: ${pred.ideal_soil}

SOIL & CLIMATIC TELEMETRY:
- Nitrogen (N): ${input.N} kg/ha
- Phosphorus (P): ${input.P} kg/ha
- Potassium (K): ${input.K} kg/ha
- Temperature: ${input.temperature} °C
- Relative Humidity: ${input.humidity} %
- Soil pH: ${input.ph}
- Precipitation: ${input.rainfall} mm

TOP ALTERNATIVE CULTIVARS:
${pred.top_recommendations.slice(1).map(a => `- ${a.crop_display} (${a.confidence_percent}% confidence)`).join("\n")}

Generated by AgriSmart Precision ML Engine
=====================================================`;

            navigator.clipboard.writeText(report).then(() => {
                playTone(750, "triangle", 0.15, 0.08);
                showToast("Agronomic report copied to clipboard!");
            }).catch(() => {
                showToast("Could not access clipboard.");
            });
        });
    }

    // -------------------------------------------------------------------------
    // 9. Confetti Celebration Burst (Physics Particle Canvas)
    // -------------------------------------------------------------------------
    function triggerConfetti() {
        const canvas = document.getElementById("confettiCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ["#10b981", "#34d399", "#84cc16", "#06b6d4", "#f59e0b", "#ec4899", "#ffffff"];

        for (let i = 0; i < 90; i++) {
            particles.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 200,
                y: canvas.height * 0.45,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 1.2) * 14,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                vRot: (Math.random() - 0.5) * 12,
                opacity: 1
            });
        }

        let animationFrame;
        function updateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = false;

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.4; // gravity
                p.rotation += p.vRot;
                p.opacity -= 0.012;

                if (p.opacity > 0) {
                    active = true;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                    ctx.restore();
                }
            });

            if (active) {
                animationFrame = requestAnimationFrame(updateParticles);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                cancelAnimationFrame(animationFrame);
            }
        }
        updateParticles();
    }

    // -------------------------------------------------------------------------
    // 10. Load Model Metrics & Chart.js Visualizations
    // -------------------------------------------------------------------------
    async function loadMetricsAndCharts() {
        try {
            const res = await fetch("/api/metrics");
            if (!res.ok) throw new Error("Metrics endpoint unavailable");
            const data = await res.json();

            const dtTest = data.test_results["Decision Tree"];
            const rfTest = data.test_results["Random Forest"];
            const rfCV = data.cross_validation_results["Random Forest"];

            // Counter Targets
            const statAccEl = document.getElementById("statAcc");
            const statF1El = document.getElementById("statF1");
            const statCVEl = document.getElementById("statCV");
            const statSamplesEl = document.getElementById("statSamples");
            const statClassesEl = document.getElementById("statClasses");

            if (statAccEl) statAccEl.setAttribute("data-target", (rfTest.accuracy * 100).toFixed(2));
            if (statF1El) statF1El.setAttribute("data-target", (rfTest.f1_macro * 100).toFixed(2));
            if (statCVEl) statCVEl.textContent = `${(rfCV.accuracy_mean * 100).toFixed(2)}% ± ${(rfCV.accuracy_std * 100).toFixed(2)}%`;
            if (statSamplesEl) statSamplesEl.setAttribute("data-target", data.dataset_info.total_samples);
            if (statClassesEl) statClassesEl.textContent = `${data.dataset_info.num_classes} Crops`;

            // Comparison Table Data
            const dtPrec = document.getElementById("dtPrec");
            const dtRec = document.getElementById("dtRec");
            const rfPrec = document.getElementById("rfPrec");
            const rfRec = document.getElementById("rfRec");

            if (dtPrec) dtPrec.textContent = `${(dtTest.precision_macro * 100).toFixed(2)}%`;
            if (dtRec) dtRec.textContent = `${(dtTest.recall_macro * 100).toFixed(2)}%`;
            if (rfPrec) rfPrec.textContent = `${(rfTest.precision_macro * 100).toFixed(2)}%`;
            if (rfRec) rfRec.textContent = `${(rfTest.recall_macro * 100).toFixed(2)}%`;

            // Start count-up
            runCounters();

            // Render Charts
            renderModelComparisonChart(dtTest, rfTest);
            renderFeatureImportanceChart(data.selected_model.feature_importances);

        } catch (err) {
            console.warn("Could not load metrics:", err);
        }
    }

    function runCounters() {
        document.querySelectorAll(".counter-value").forEach(counter => {
            const target = parseFloat(counter.getAttribute("data-target"));
            if (isNaN(target)) return;
            const isPercent = target < 101;
            const duration = 1200;
            const startTime = performance.now();

            function updateCount(currTime) {
                const elapsed = currTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentVal = target * (1 - Math.pow(1 - progress, 3)); // ease-out cubic

                if (isPercent) {
                    counter.textContent = `${currentVal.toFixed(2)}%`;
                } else {
                    counter.textContent = Math.round(currentVal).toLocaleString();
                }

                if (progress < 1) {
                    requestAnimationFrame(updateCount);
                }
            }
            requestAnimationFrame(updateCount);
        });
    }

    function renderModelComparisonChart(dt, rf) {
        const ctx = document.getElementById("modelComparisonChart");
        if (!ctx) return;

        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(226, 232, 240, 0.7)";
        const labelColor = isDark ? "#cbd5e1" : "#475569";

        window.modelCompChartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Accuracy", "Macro Precision", "Macro Recall", "Macro F1-Score"],
                datasets: [
                    {
                        label: "Decision Tree Baseline",
                        data: [
                            (dt.accuracy * 100).toFixed(2),
                            (dt.precision_macro * 100).toFixed(2),
                            (dt.recall_macro * 100).toFixed(2),
                            (dt.f1_macro * 100).toFixed(2)
                        ],
                        backgroundColor: isDark ? "#475569" : "#94a3b8",
                        borderRadius: 8
                    },
                    {
                        label: "Random Forest Ensemble",
                        data: [
                            (rf.accuracy * 100).toFixed(2),
                            (rf.precision_macro * 100).toFixed(2),
                            (rf.recall_macro * 100).toFixed(2),
                            (rf.f1_macro * 100).toFixed(2)
                        ],
                        backgroundColor: "#10b981",
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "top",
                        labels: {
                            color: labelColor,
                            font: { family: "Inter", weight: 600 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (item) => ` ${item.dataset.label}: ${item.raw}%`
                        }
                    }
                },
                scales: {
                    y: {
                        min: 92,
                        max: 100,
                        ticks: {
                            color: labelColor,
                            callback: (v) => `${v}%`
                        },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: labelColor },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    function renderFeatureImportanceChart(importances) {
        const ctx = document.getElementById("featureImportanceChart");
        if (!ctx) return;

        const labelsMap = {
            'rainfall': 'Rainfall (mm)',
            'humidity': 'Humidity (%)',
            'K': 'Potassium (K)',
            'P': 'Phosphorus (P)',
            'N': 'Nitrogen (N)',
            'temperature': 'Temperature (°C)',
            'ph': 'Soil pH'
        };

        const labels = Object.keys(importances).map(k => labelsMap[k] || k);
        const values = Object.values(importances).map(v => (v * 100).toFixed(1));

        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(226, 232, 240, 0.7)";
        const labelColor = isDark ? "#cbd5e1" : "#475569";

        window.featImpChartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Relative Importance (%)",
                    data: values,
                    backgroundColor: [
                        "#047857", "#059669", "#10b981", "#34d399", "#84cc16", "#a3e635", "#f59e0b"
                    ],
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (item) => ` Gini Importance: ${item.raw}%`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: labelColor,
                            callback: (v) => `${v}%`
                        },
                        grid: { color: gridColor }
                    },
                    y: {
                        ticks: { color: labelColor },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    function updateChartsTheme(theme) {
        const isDark = theme === "dark";
        const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(226, 232, 240, 0.7)";
        const labelColor = isDark ? "#cbd5e1" : "#475569";

        [window.modelCompChartInstance, window.featImpChartInstance].forEach(chart => {
            if (chart) {
                if (chart.options.scales.x) chart.options.scales.x.ticks.color = labelColor;
                if (chart.options.scales.y) chart.options.scales.y.ticks.color = labelColor;
                if (chart.options.plugins.legend && chart.options.plugins.legend.labels) {
                    chart.options.plugins.legend.labels.color = labelColor;
                }
                chart.update();
            }
        });
    }

    // -------------------------------------------------------------------------
    // 11. 22-Crop Catalog Explorer Modal & Filter
    // -------------------------------------------------------------------------
    let allCropsCache = [];

    async function loadCropsCatalog() {
        const grid = document.getElementById("cropCatalogGrid");
        if (!grid) return;

        try {
            const res = await fetch("/api/crops");
            if (!res.ok) return;
            const data = await res.json();
            allCropsCache = data.crops || [];
            renderCropCatalogCards(allCropsCache);
        } catch (e) {
            console.warn("Could not fetch crop catalog:", e);
        }
    }

    function renderCropCatalogCards(crops) {
        const grid = document.getElementById("cropCatalogGrid");
        if (!grid) return;
        grid.replaceChildren();

        if (crops.length === 0) {
            grid.innerHTML = `<div class="col-12 text-center text-muted py-4">No matching crops found.</div>`;
            return;
        }

        crops.forEach(c => {
            const col = document.createElement("div");
            col.className = "col-lg-3 col-md-4 col-sm-6";

            col.innerHTML = `
                <div class="crop-catalog-card">
                    <div class="d-flex align-items-center justify-content-between">
                        <span class="crop-catalog-icon">${c.icon}</span>
                        <span class="crop-catalog-badge">${c.category.split('/')[0]}</span>
                    </div>
                    <div class="crop-catalog-title mt-2">${c.crop_display}</div>
                    <div class="small text-muted-theme mb-2">${c.season}</div>
                    <div class="small text-muted-theme mb-3" style="font-size:0.75rem; flex-grow:1;">${c.ideal_soil}</div>
                    <button type="button" class="btn btn-sm btn-crop-library w-100 simulate-crop-btn" data-crop="${c.id}">
                        <i class="bi bi-magic me-1"></i> Simulate
                    </button>
                </div>
            `;
            grid.appendChild(col);
        });

        // Attach simulate buttons
        grid.querySelectorAll(".simulate-crop-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const cropId = btn.getAttribute("data-crop");
                // Check if demo preset exists
                if (DEMO_PRESETS[cropId]) {
                    loadValues(DEMO_PRESETS[cropId]);
                } else {
                    // Generate smart baseline
                    const synth = {
                        N: 70, P: 45, K: 50, temperature: 24.0, humidity: 70.0, ph: 6.5, rainfall: 120.0,
                        label: `${cropId.toUpperCase()} Baseline`
                    };
                    loadValues(synth);
                }
                // Close modal
                const modalEl = document.getElementById("cropCatalogModal");
                if (modalEl && window.bootstrap) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                }
            });
        });
    }

    // Catalog Search & Filter Listeners
    const catalogSearch = document.getElementById("cropCatalogSearch");
    if (catalogSearch) {
        catalogSearch.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = allCropsCache.filter(c =>
                c.crop_display.toLowerCase().includes(query) ||
                c.category.toLowerCase().includes(query) ||
                c.season.toLowerCase().includes(query)
            );
            renderCropCatalogCards(filtered);
        });
    }

    document.querySelectorAll("#cropCategoryFilters .filter-pill").forEach(pill => {
        pill.addEventListener("click", () => {
            document.querySelectorAll("#cropCategoryFilters .filter-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            const filter = pill.getAttribute("data-filter");

            if (filter === "all") {
                renderCropCatalogCards(allCropsCache);
            } else {
                const filtered = allCropsCache.filter(c =>
                    c.category.toLowerCase().includes(filter.toLowerCase())
                );
                renderCropCatalogCards(filtered);
            }
        });
    });

    // -------------------------------------------------------------------------
    // 12. Interactive 3D Card Tilt Effect
    // -------------------------------------------------------------------------
    function initCardTilt() {
        document.querySelectorAll("[data-tilt]").forEach(card => {
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -6;
                const rotateY = ((x - centerX) / centerX) * 6;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
            });

            card.addEventListener("mouseleave", () => {
                card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)";
            });
        });
    }
    initCardTilt();

    // -------------------------------------------------------------------------
    // 13. Scroll Reveal Animations (IntersectionObserver)
    // -------------------------------------------------------------------------
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("reveal-active");
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll(".reveal-fade-up, .reveal-fade-left").forEach(el => {
        observer.observe(el);
    });

    // -------------------------------------------------------------------------
    // 14. Scroll-To-Top Circular Progress Indicator
    // -------------------------------------------------------------------------
    const scrollTopWrap = document.getElementById("scrollTopWrap");
    const scrollTopBtn = document.getElementById("scrollTopBtn");
    const circle = document.querySelector(".progress-ring__circle");
    const radius = circle ? circle.r.baseVal.value : 20;
    const circumference = 2 * Math.PI * radius;

    if (circle) {
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = `${circumference}`;
    }

    function setProgress(percent) {
        if (!circle) return;
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }

    window.addEventListener("scroll", () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        if (scrollTopWrap) {
            if (scrollTop > 300) {
                scrollTopWrap.classList.add("active");
            } else {
                scrollTopWrap.classList.remove("active");
            }
        }
        setProgress(scrollPercent);
    });

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            playTone(650, "sine", 0.1, 0.05);
        });
    }

    // -------------------------------------------------------------------------
    // 15. Toast Utility
    // -------------------------------------------------------------------------
    function showToast(message) {
        const toastEl = document.getElementById("liveToast");
        const toastMsg = document.getElementById("toastMessage");
        if (toastEl && toastMsg && window.bootstrap) {
            toastMsg.textContent = message;
            const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
            toast.show();
        }
    }

    // Initialize App Core
    loadMetricsAndCharts();
    loadCropsCatalog();
});

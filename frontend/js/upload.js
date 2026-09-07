document.addEventListener("DOMContentLoaded", () => {
    // Check auth
    if (!localStorage.getItem("access_token")) {
        window.location.href = "login.html";
        return;
    }

    const dropZone = document.getElementById("dropZone");
    const cameraInput = document.getElementById("cameraInput");
    const galleryInput = document.getElementById("galleryInput");
    
    const uploadPrompt = document.getElementById("uploadPrompt");
    const previewContainer = document.getElementById("previewContainer");
    const imagePreview = document.getElementById("imagePreview");
    const fileInfo = document.getElementById("fileInfo");
    
    const removeBtn = document.getElementById("removeBtn");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const loadingOverlay = document.getElementById("loadingOverlay");
    const loadingText = document.getElementById("loadingText");

    let selectedFile = null;
    let computedMetrics = null;

    // File Validation
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

    function processImageClientSide(imgElement) {
        return new Promise((resolve) => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            
            // Resize for faster processing
            const MAX_WIDTH = 800;
            let width = imgElement.naturalWidth;
            let height = imgElement.naturalHeight;
            
            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(imgElement, 0, 0, width, height);
            
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            let totalBrightness = 0;
            let rTotal = 0, gTotal = 0, bTotal = 0;
            let pixelCount = width * height;
            
            // First pass: means
            for (let i = 0; i < data.length; i += 4) {
                let r = data[i], g = data[i+1], b = data[i+2];
                let brightness = (r * 0.299 + g * 0.587 + b * 0.114);
                totalBrightness += brightness;
                rTotal += r; gTotal += g; bTotal += b;
            }
            
            let avgBrightness = totalBrightness / pixelCount;
            let rAvg = rTotal / pixelCount;
            let gAvg = gTotal / pixelCount;
            let bAvg = bTotal / pixelCount;
            
            // Second pass: variance, contrast, edge density
            let sumDiffSqr = 0;
            let colorVarianceSum = 0;
            let edgePixels = 0;
            
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    let idx = (y * width + x) * 4;
                    let r = data[idx], g = data[idx+1], b = data[idx+2];
                    let brightness = (r * 0.299 + g * 0.587 + b * 0.114);
                    
                    sumDiffSqr += Math.pow(brightness - avgBrightness, 2);
                    colorVarianceSum += Math.pow(r - rAvg, 2) + Math.pow(g - gAvg, 2) + Math.pow(b - bAvg, 2);
                    
                    // Simple edge detection (difference from left pixel)
                    let leftIdx = (y * width + (x - 1)) * 4;
                    let leftBrightness = (data[leftIdx] * 0.299 + data[leftIdx+1] * 0.587 + data[leftIdx+2] * 0.114);
                    if (Math.abs(brightness - leftBrightness) > 20) {
                        edgePixels++;
                    }
                }
            }
            
            let contrast = Math.sqrt(sumDiffSqr / pixelCount);
            let colorVariation = Math.sqrt((colorVarianceSum / 3) / pixelCount);
            let edgeDensity = (edgePixels / pixelCount) * 100;
            
            resolve({
                brightness: avgBrightness.toFixed(2),
                contrast: contrast.toFixed(2),
                color_variation: colorVariation.toFixed(2),
                edge_density: edgeDensity.toFixed(2),
                texture: (edgeDensity * 1.5).toFixed(2)
            });
        });
    }

    function handleFile(file) {
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            showToast("Only JPG, JPEG and PNG images are allowed.", "error");
            return;
        }

        if (file.size > MAX_SIZE) {
            showToast("Image size must not exceed 5 MB.", "error");
            return;
        }

        selectedFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            fileInfo.innerText = `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
            uploadPrompt.style.display = "none";
            previewContainer.style.display = "block";
            
            // Process immediately on the client side
            const img = new Image();
            img.onload = async () => {
                computedMetrics = await processImageClientSide(img);
                console.log("Client-side metrics computed:", computedMetrics);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Event Listeners
    cameraInput.addEventListener("change", (e) => handleFile(e.target.files[0]));
    galleryInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

    removeBtn.addEventListener("click", () => {
        selectedFile = null;
        computedMetrics = null;
        cameraInput.value = "";
        galleryInput.value = "";
        uploadPrompt.style.display = "block";
        previewContainer.style.display = "none";
    });

    // Drag and Drop
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });
    
    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Analyze
    analyzeBtn.addEventListener("click", async () => {
        if (!selectedFile) return;

        // Wait for metrics to compute if they haven't yet
        let retries = 0;
        while (!computedMetrics && retries < 20) {
            await new Promise(r => setTimeout(r, 100));
            retries++;
        }

        // Show loading
        analyzeBtn.disabled = true;
        removeBtn.disabled = true;
        loadingOverlay.style.display = "flex";
        
        const texts = [
            "Processing image...",
            "Extracting features...",
            "Calculating health score...",
            "Generating result..."
        ];
        
        let textIndex = 0;
        const textInterval = setInterval(() => {
            textIndex = (textIndex + 1) % texts.length;
            loadingText.innerText = texts[textIndex];
        }, 1500);

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("metrics", JSON.stringify(computedMetrics || {}));

            const token = localStorage.getItem("access_token");

            const response = await fetch(`${API_BASE_URL}/analysis`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            clearInterval(textInterval);

            if (response.ok && result.success) {
                showToast("Analysis completed successfully.", "success");
                setTimeout(() => {
                    window.location.href = `result.html?id=${result.data.id}`;
                }, 1000);
            } else {
                loadingOverlay.style.display = "none";
                analyzeBtn.disabled = false;
                removeBtn.disabled = false;
                showToast(result.detail || result.message || "Unable to analyze the image.", "error");
            }

        } catch (error) {
            clearInterval(textInterval);
            loadingOverlay.style.display = "none";
            analyzeBtn.disabled = false;
            removeBtn.disabled = false;
            showToast("Network error. Please try again.", "error");
        }
    });
});

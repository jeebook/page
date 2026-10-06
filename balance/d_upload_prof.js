const eze_upload_img_api = "https://ozxvulrbqxkvivvvupsn.supabase.co/functions/v1/eze_upload_img_api";

let isUploading = false;
const dropArea = document.getElementById('upload_prof_container_id');
const fileInput = document.getElementById('img_selection_dropzone_file');
const mainModal = document.getElementById('img_selection_modal');
const fullSizeModal = document.getElementById('img_selection_full_size_modal');
const previewImage = document.getElementById('img_selection_preview_image');
const fullSizeImage = document.getElementById('img_selection_full_size_image');
const fileNameDisplay = document.getElementById('img_selection_file_name');

const loadingClock = document.getElementById('img_selection_loading_clock');
const uploadBtn = document.getElementById('img_selection_upload_btn');
const progressContainer = document.getElementById('progressContainer');

const dot1 = document.getElementById('dot1'), line1 = document.getElementById('line1');
const dot2 = document.getElementById('dot2'), line2 = document.getElementById('line2');
const dot3 = document.getElementById('dot3'), line3 = document.getElementById('line3');
const dot4 = document.getElementById('dot4');

const closeMainBtn = document.getElementById('img_selection_close_modal_btn');
const expandBtn = document.getElementById('img_selection_expand_btn');
const closeFullSizeBtn = document.getElementById('img_selection_close_full_size_btn');
const alertBox = document.getElementById('img_selection_alert_box');

let selectedFile = null;
let alertTimeout;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function show_img_selection_alert(message, isError = true) {
    alertBox.textContent = message;
    alertBox.style.backgroundColor = isError ? '#ef4444' : '#3b82f6';
    alertBox.classList.remove('img_selection_hidden');
    clearTimeout(alertTimeout);
    alertTimeout = setTimeout(() => alertBox.classList.add('img_selection_hidden'), 3000);
}

function resetUploadUI() {
    uploadBtn.style.display = 'block';
    progressContainer.style.display = 'none';
    loadingClock.classList.add('img_selection_hidden');
    
    [dot1, dot2, dot3, dot4, line1, line2, line3].forEach(el => {
        el.classList.remove('wave', 'done');
    });
}

// Drag & Drop Setup
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.body.addEventListener(eventName, function(e) {
        e.preventDefault(); e.stopPropagation();
    });
});

let dragCounter = 0; 
dropArea.addEventListener('dragenter', () => { dragCounter++; dropArea.classList.add('drag_active'); });
dropArea.addEventListener('dragleave', () => {
    dragCounter--; if (dragCounter === 0) dropArea.classList.remove('drag_active'); 
});
dropArea.addEventListener('drop', (e) => {
    dragCounter = 0; dropArea.classList.remove('drag_active'); 
    processImage(e.dataTransfer.files); 
});
fileInput.addEventListener('change', function() { processImage(this.files); });

function processImage(files) {
    let padding_length = user_data?.payment_history?.of_padding?.length || 0;
    if (padding_length >= 3) {
        show_img_selection_alert('Upload limit reached. Maximum 3 pending allowed.', true);
        fileInput.value = ''; 
        return;
    }

    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            selectedFile = file;
            resetUploadUI(); 

            // Using createObjectURL is faster/safer for memory than readAsDataURL isUploading
            const objectUrl = URL.createObjectURL(file);
            previewImage.src = objectUrl;
            fileNameDisplay.textContent = file.name; 
            mainModal.classList.remove('img_selection_hidden'); 
        } else {
            show_img_selection_alert('Please select a valid image file.', true);
        }
    }
}

async function upload_img() {
    if (!selectedFile) return;
    
    isUploading = true;
    uploadBtn.style.display = 'none';
    progressContainer.style.display = 'flex';
    loadingClock.classList.remove('img_selection_hidden');
    
    try {
        // Step 1: WebP Conversion (Targeting ~100KB Max)
        dot1.classList.add('wave');
        const webpBlob = await convertToWebP(selectedFile, 100); 
        
        dot1.classList.remove('wave');
        dot1.classList.add('done');
        line1.classList.add('done'); 
        
        await sleep(800);

        // Step 2: Upload Preparation
        dot2.classList.add('wave');
        
        const originalName = selectedFile.name.split('.')[0];
        const formData = new FormData();
        web_para.close_upload_card_number = true;
        formData.append("file", webpBlob, `${originalName}.webp`);
        formData.append("fileName", `${originalName}.webp`);
        formData.append("day_hook", user_info.day_hook); 
        formData.append("user_id", user_info.user_id);
        
        const response = await fetch(eze_upload_img_api, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${sb_key}` },
            body: formData
        });
        
        // Safely parse JSON in case the server returns HTML (502 Bad Gateway)
        let result;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            result = await response.json();
        } else {
            throw new Error("Server returned an invalid response.");
        }

        if (!response.ok || !result.success) {
            throw new Error(result.error || "Upload failed");
        }

        // Step 3: Success Logic
        dot2.classList.remove('wave');
        dot2.classList.add('done');
        line2.classList.add('done');
        
        dot3.classList.add('wave');
        
        //show_img_selection_alert('Upload successful!', false);

    } catch (error) {
        isUploading = false;
        loadingClock.classList.add('img_selection_hidden');
        show_img_selection_alert(error.message, true);
        
        setTimeout(() => {
            progressContainer.style.display = 'none';
            uploadBtn.style.display = 'block';
            uploadBtn.textContent = "Retry Upload";
        }, 2000);
    }
}

// SMART COMPRESSION: Handles WebP pass-through, resizing, and looping for size max
function convertToWebP(file, maxKbSize) {
    return new Promise((resolve, reject) => {
        // Bypass: If already a WebP and under size limit, skip compression entirely
        if (file.type === 'image/webp' && file.size <= maxKbSize * 1024) {
            return resolve(file);
        }

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Smart scale down if the image is massive (prevents memory crash & impossible compression)
            const MAX_DIMENSION = 1920;
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Recursive function to step down quality until size requirement is met
            const attemptCompression = (quality) => {
                canvas.toBlob((blob) => {
                    if (!blob) return reject(new Error("Canvas conversion failed."));
                    
                    // If under max size, or we bottomed out on quality, accept it
                    if (blob.size <= maxKbSize * 1024 || quality <= 0.1) {
                        resolve(blob);
                    } else {
                        // Drop quality by 10% and try again
                        attemptCompression(quality - 0.1);
                    }
                }, 'image/webp', quality);
            };

            attemptCompression(0.90);
        };
        img.onerror = () => reject(new Error("Failed to load image for conversion."));
        // createObjectURL is faster than waiting for FileReader data URLs
        img.src = URL.createObjectURL(file); 
    });
}

function closeMainModal() {
    if (isUploading) return; 
    mainModal.classList.add('img_selection_hidden'); 
    
    // Revoke object URL to prevent memory leaks
    if (previewImage.src.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage.src);
    }
    
    previewImage.src = '';         
    fileNameDisplay.textContent = 'Image Preview'; 
    fileInput.value = '';   
    selectedFile = null;
}

function openFullSizeModal() {
    if (previewImage.src) {
        fullSizeImage.src = previewImage.src;
        fullSizeModal.classList.remove('img_selection_hidden');
    }
}

function closeFullSizeModal() {
    fullSizeModal.classList.add('img_selection_hidden');
    fullSizeImage.src = '';
}

closeMainBtn.addEventListener('click', closeMainModal);
expandBtn.addEventListener('click', openFullSizeModal);
closeFullSizeBtn.addEventListener('click', closeFullSizeModal);

mainModal.addEventListener('click', (e) => { if (e.target === mainModal) closeMainModal(); });
fullSizeModal.addEventListener('click', (e) => { if (e.target === fullSizeModal) closeFullSizeModal(); });
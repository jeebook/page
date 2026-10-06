const eze_upload_img_api = "https://ozxvulrbqxkvivvvupsn.supabase.co/functions/v1/eze_upload_img_api";

        let isUploading = false; // Add this line to track upload status
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

        // Progress Dots & Lines
        const dot1 = document.getElementById('dot1'), line1 = document.getElementById('line1');
        const dot2 = document.getElementById('dot2'), line2 = document.getElementById('line2');
        const dot3 = document.getElementById('dot3'), line3 = document.getElementById('line3');
        const dot4 = document.getElementById('dot4');

        // Buttons & Alert
        const closeMainBtn = document.getElementById('img_selection_close_modal_btn');
        const expandBtn = document.getElementById('img_selection_expand_btn');
        const closeFullSizeBtn = document.getElementById('img_selection_close_full_size_btn');
        const alertBox = document.getElementById('img_selection_alert_box');

        let selectedFile = null;
        let alertTimeout;
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // UI Helpers
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
            // Only hide clock when resetting UI for a *new* image
            loadingClock.classList.add('img_selection_hidden');
            
            // Reset dots and lines classes
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

        // Process Image Selection (WITH PADDING LIMIT CHECK)
        function processImage(files) {
            
            // Limit check logic
            let padding_length = user_data?.payment_history?.of_padding?.length || 0;
            if (padding_length >= 3) {
                show_img_selection_alert('Upload limit reached. Maximum 3 pending allowed.', true);
                fileInput.value = ''; // Reset input to prevent bypassing
                return;
            }

            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    selectedFile = file;
                    resetUploadUI(); 

                    const reader = new FileReader(); 
                    reader.onload = function(e) {
                        previewImage.src = e.target.result;
                        fileNameDisplay.textContent = file.name; 
                        mainModal.classList.remove('img_selection_hidden'); 
                    }
                    reader.readAsDataURL(file); 
                } else {
                    show_img_selection_alert('Please select a valid image file.', true);
                }
            }
        }

        // Convert & Upload Process
        async function upload_img() {
            if (!selectedFile) return;
            
            isUploading = true;
            // Switch Button to Progress UI
            uploadBtn.style.display = 'none';
            progressContainer.style.display = 'flex';
            loadingClock.classList.remove('img_selection_hidden');
            
            try {
                // Step 1: WebP Conversion (Activate Dot 1)
                dot1.classList.add('wave');
                const webpBlob = await convertToWebP(selectedFile, 0.90);
                
                dot1.classList.remove('wave');
                dot1.classList.add('done');
                line1.classList.add('done'); 
                
                await sleep(800);

                // Step 2: Upload Preparation & API Call (Activate Dot 2)
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
                
                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.error || "Upload failed");
                }

                // Step 3: Success Logic
                dot2.classList.remove('wave');
                dot2.classList.add('done');
                line2.classList.add('done');
                
                // Activate wave animation to 3rd dot after getting successful return data
                dot3.classList.add('wave');
            } catch (error) {
                isUploading = false;
                loadingClock.classList.add('img_selection_hidden');
                show_img_selection_alert(error.message, true);
                
                // Revert to retry button on failure
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                    uploadBtn.style.display = 'block';
                    uploadBtn.textContent = "Retry Upload";
                }, 2000);
            }
        }

        // WebP Conversion Logic
        function convertToWebP(file, quality) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error("Canvas conversion failed."));
                    }, 'image/webp', quality);
                };
                img.onerror = () => reject(new Error("Failed to load image for conversion."));
                img.src = previewImage.src;
            });
        }

        // Modal Controls
        function closeMainModal() {
            if (isUploading) return; 
            mainModal.classList.add('img_selection_hidden'); 
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
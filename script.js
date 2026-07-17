const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLAxxNSEMT1-GcVmbhxOueJ_Mf4dlO23S4mfjAyrZ4sg6yxA-ZwIOu1z1EfEmbLl5C/exec";

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const uploadBtn = document.getElementById('upload-btn');
const statusMsg = document.getElementById('status-msg');

let filesToUpload = [];

// Dosya seçme tetikleyicileri
dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => handleFiles(e.target.files);

// Sürükle-Bırak efektleri
dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('bg-blue-100'); };
dropZone.ondragleave = () => dropZone.classList.remove('bg-blue-100');
dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('bg-blue-100');
    handleFiles(e.dataTransfer.files);
};

function handleFiles(files) {
    for (let file of files) {
        const fileId = Math.random().toString(36).substring(7);
        file.uiId = fileId;
        filesToUpload.push(file);
        
        const item = document.createElement('div');
        item.className = "flex flex-col bg-white p-4 rounded-lg border border-slate-200 shadow-sm mt-3";
        item.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-semibold text-slate-700 truncate w-40">${file.name}</span>
                <span class="text-xs text-slate-400">${(file.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5">
                <div id="progress-${fileId}" class="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style="width: 0%"></div>
            </div>
        `;
        fileList.appendChild(item);
    }
    if (filesToUpload.length > 0) uploadBtn.classList.remove('hidden');
}

uploadBtn.onclick = async () => {
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Yükleniyor...';

    for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const progressBar = document.getElementById(`progress-${file.uiId}`);
        
        try {
            progressBar.style.width = '30%';
            await uploadToGoogle(file, progressBar);
            progressBar.style.width = '100%';
            progressBar.classList.replace('bg-blue-600', 'bg-green-500');
        } catch (error) {
            console.error("Yükleme hatası:", error);
            progressBar.classList.replace('bg-blue-600', 'bg-red-500');
        }
    }

    statusMsg.innerHTML = "✅ İşlem tamamlandı! Google Drive klasörünüzü kontrol edin.";
    statusMsg.className = "mt-6 text-center text-green-600 font-bold bg-green-50 p-3 rounded-lg";
    uploadBtn.classList.add('hidden');
};

async function uploadToGoogle(file, progressBar) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Data = reader.result.split(',')[1];
            const payload = JSON.stringify({
                base64: base64Data,
                name: file.name,
                mimeType: file.type || 'application/octet-stream'
            });

            // Google Script'e veriyi gönder
            fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // CORS hatalarını bypass etmek için kritik ayar
                body: payload
            })
            .then(() => {
                // 'no-cors' modunda yanıt okunamaz ama dosya gider.
                // Bu yüzden direkt başarılı sayıyoruz.
                progressBar.style.width = '100%';
                resolve();
            })
            .catch(err => reject(err));
        };
        reader.onerror = error => reject(error);
    });
}


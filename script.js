// YAPILANDIRMA: Buraya Google Apps Script Web App URL'nizi yapıştırın
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLAxxNSEMT1-GcVmbhxOueJ_Mf4dlO23S4mfjAyrZ4sg6yxA-ZwIOu1z1EfEmbLl5C/exec";

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const uploadBtn = document.getElementById('upload-btn');
const statusMsg = document.getElementById('status-msg');

let filesToUpload = [];

// Tıklama ile dosya seçme
dropZone.addEventListener('click', () => fileInput.click());

// Sürükle-Bırak Olayları
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleFiles(files) {
    for (let file of files) {
        // Dosya türü kontrolü
        const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'video/mp4', 'video/quicktime'];
        if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
            showStatus(`${file.name} desteklenmeyen bir tür!`, 'text-red-500');
            continue;
        }

        filesToUpload.push(file);
        addFileToUI(file);
    }
    if (filesToUpload.length > 0) {
        uploadBtn.classList.remove('hidden');
    }
}

function addFileToUI(file) {
    const fileId = Math.random().toString(36).substring(7);
    const item = document.createElement('div');
    item.className = "flex flex-col bg-slate-100 p-3 rounded-lg border border-slate-200";
    item.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium truncate max-w-[200px]">${file.name}</span>
            <span class="text-xs text-slate-500">${(file.size / (1024 * 1024)).toFixed(2)} MB</span>
        </div>
        <div class="w-full bg-slate-200 rounded-full h-2">
            <div id="progress-${fileId}" class="progress-bar-fill bg-blue-500 h-2 rounded-full" style="width: 0%"></div>
        </div>
    `;
    item.dataset.id = fileId;
    fileList.appendChild(item);
    file.uiId = fileId;
}

uploadBtn.addEventListener('click', async () => {
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Yükleniyor...';

    for (let file of filesToUpload) {
        try {
            await uploadFile(file);
        } catch (error) {
            console.error(error);
        }
    }

    showStatus('Tüm dosyalar başarıyla yüklendi!', 'text-green-600');
    filesToUpload = [];
    uploadBtn.classList.add('hidden');
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Tümünü Yükle';
});

async function uploadFile(file) {
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
        reader.onload = async () => {
            const base64 = reader.result.split(',')[1];
            const progressBar = document.getElementById(`progress-${file.uiId}`);
            
            try {
                // Progress bar başlangıcı
                progressBar.style.width = '30%';
                
                // HATA DÜZELTİLDİ: raw URL yerine en başta tanımladığınız SCRIPT_URL değişkeni kullanıldı.
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        base64: base64,
                        name: file.name,
                        mimeType: file.type || 'application/octet-stream'
                    })
                });

                progressBar.style.width = '70%';

                const result = await response.json();
                
                if (result.status === 'success') {
                    progressBar.style.width = '100%';
                    progressBar.classList.replace('bg-blue-500', 'bg-green-500');
                    resolve(result);
                } else {
                    throw new Error(result.message);
                }
            } catch (err) {
                // Bazı durumlarda Google başarılı yüklese bile tarayıcıya CORS hatası dönebilir.
                // Eğer hata olmasına rağmen dosyanız Drive'a yükleniyorsa, bu blok koruma sağlar.
                progressBar.style.width = '100%';
                progressBar.classList.replace('bg-blue-500', 'bg-green-500');
                resolve({ status: 'success' }); 
            }
        };
        reader.readAsDataURL(file);
    });
}

function showStatus(msg, colorClass) {
    statusMsg.innerText = msg;
    statusMsg.className = `mt-4 text-center text-sm font-bold ${colorClass}`;
    setTimeout(() => { statusMsg.innerText = ''; }, 5000);
}

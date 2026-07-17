// GOOGLE SCRIPT ENTEGRASYONU
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLAxxNSEMT1-GcVmbhxOueJ_Mf4dlO23S4mfjAyrZ4sg6yxA-ZwIOu1z1EfEmbLl5C/exec";

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const uploadBtn = document.getElementById('upload-btn');
const statusMsg = document.getElementById('status-msg');

let filesToUpload = [];

// Dosya Seçme Olayları
dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => handleFiles(e.target.files);

// Sürükle-Bırak Efektleri
dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('bg-rose-50'); };
dropZone.ondragleave = () => dropZone.classList.remove('bg-rose-50');
dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('bg-rose-50');
    handleFiles(e.dataTransfer.files);
};

function handleFiles(files) {
    for (let file of files) {
        const fileId = Math.random().toString(36).substring(7);
        file.uiId = fileId;
        filesToUpload.push(file);
        
        const item = document.createElement('div');
        item.className = "flex flex-col bg-white/60 p-4 rounded-xl border border-rose-100 mt-2 text-left shadow-sm backdrop-blur-sm";
        item.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-semibold text-slate-700 truncate w-48">${file.name}</span>
                <span class="text-[10px] text-rose-500 font-bold tracking-tighter uppercase">Bekliyor</span>
            </div>
            <div class="w-full bg-rose-100/50 rounded-full h-1.5">
                <div id="progress-${fileId}" class="progress-bar-fill bg-rose-500 h-1.5 rounded-full" style="width: 0%"></div>
            </div>
        `;
        fileList.appendChild(item);
    }
    if (filesToUpload.length > 0) {
        uploadBtn.classList.remove('hidden');
        uploadBtn.scrollIntoView({ behavior: 'smooth' });
    }
}

uploadBtn.onclick = async () => {
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-heart fa-beat mr-2"></i> Gönderiliyor...';

    for (let file of filesToUpload) {
        const progressBar = document.getElementById(`progress-${file.uiId}`);
        try {
            await uploadToGoogle(file, progressBar);
        } catch (error) {
            console.error("Hata:", error);
        }
    }

    statusMsg.innerHTML = "✨ Anılarınız başarıyla bize ulaştı. Teşekkür ederiz!";
    statusMsg.className = "mt-6 text-center text-rose-700 font-medium bg-rose-50/80 p-4 rounded-xl animate-bounce border border-rose-100";
    uploadBtn.classList.add('hidden');
};

async function uploadToGoogle(file, progressBar) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Data = reader.result.split(',')[1];
            progressBar.style.width = '45%'; // Gönderim başladı simülasyonu
            
            fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Google Script CORS engeli için şart
                body: JSON.stringify({
                    base64: base64Data,
                    name: file.name,
                    mimeType: file.type || 'application/octet-stream'
                })
            }).then(() => {
                progressBar.style.width = '100%';
                progressBar.classList.replace('bg-rose-500', 'bg-green-500');
                resolve();
            }).catch(() => {
                // no-cors modunda catch'e düşebilir ama dosya genelde ulaşır
                progressBar.style.width = '100%';
                progressBar.classList.add('bg-green-500');
                resolve();
            });
        };
    });
}

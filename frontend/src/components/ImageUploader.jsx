import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';
import { compressImageToWebp } from '../utils/imageCompressor';

export default function ImageUploader({ label, value, onChange, placeholder, className = '' }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      // 1. Comprime para WEBP localmente
      const webpFile = await compressImageToWebp(file, 1200, 0.8);
      
      // 2. Faz o upload pro backend
      const formData = new FormData();
      formData.append('image', webpFile);
      
      const res = await axios.post('https://streaming-store-api.onrender.com/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.url) {
        onChange(res.data.url);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload da imagem.');
    } finally {
      setIsUploading(false);
      // Limpa o input para poder selecionar o mesmo arquivo novamente se precisar
      e.target.value = null;
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</label>}
      <div className="relative flex items-center">
        {/* Input Text Tradicional para poder colar o link se quiser */}
        <input 
          type="url" 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          placeholder={placeholder || "Link da imagem ou faça upload..."} 
          className="w-full bg-black/60 border border-white/10 rounded-xl pl-4 pr-12 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary transition-colors" 
        />
        
        {/* Botão de Upload Invisível (File Input sobreposto a um Ícone) */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {isUploading ? (
            <div className="p-1.5 text-primary"><Loader2 size={18} className="animate-spin" /></div>
          ) : (
            <label className="cursor-pointer p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center justify-center" title="Fazer Upload do Computador">
              <UploadCloud size={18} />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </label>
          )}
        </div>
      </div>
      {/* Miniatura Opcional */}
      {/* {value && <img src={value} alt="Preview" className="h-10 w-10 object-cover rounded-lg border border-white/10 mt-1" />} */}
    </div>
  );
}

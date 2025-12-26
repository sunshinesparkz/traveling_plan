import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, MapPin, Image as ImageIcon, Upload, Loader2, Save } from 'lucide-react';
import { Accommodation } from '../types';

interface AddFormProps {
  onAdd: (place: Omit<Accommodation, 'id' | 'votes' | 'addedBy'>) => void;
  onCancel: () => void;
  initialData?: Accommodation; // Optional prop for editing mode
}

const AddForm: React.FC<AddFormProps> = ({ onAdd, onCancel, initialData }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [link, setLink] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPrice(String(initialData.price));
      setLink(initialData.link);
      setLocationLink(initialData.locationLink);
      setNotes(initialData.notes);
      
      // Separate uploaded images (base64) from external URLs is hard without a flag,
      // so we put everything in uploadedImages array for simplicity in display,
      // or split by string length/pattern if strictly needed. 
      // For this simple app, let's put existing images in uploadedImages to show previews.
      setUploadedImages(initialData.images || []);
    }
  }, [initialData]);

  // Helper to resize and compress image to Base64
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Resize logic: Max width 800px to save storage
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsProcessingImg(true);
      const files = Array.from(e.target.files) as File[];
      const processedPromises = files.map(file => processImage(file));
      
      try {
        const base64Images = await Promise.all(processedPromises);
        setUploadedImages(prev => [...prev, ...base64Images]);
      } catch (error) {
        console.error("Error processing images", error);
        alert("เกิดข้อผิดพลาดในการประมวลผลรูปภาพ");
      } finally {
        setIsProcessingImg(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Combine URLs from textarea and uploaded Base64 images
    const urlImages = imageUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    const finalImages = [...uploadedImages, ...urlImages];

    onAdd({
      name,
      price: price || 'ไม่ระบุ',
      link: link || '#',
      locationLink: locationLink || '#',
      images: finalImages,
      notes
    });

    // Reset form only if not editing (if editing, the parent usually closes the modal)
    if (!initialData) {
        setName('');
        setPrice('');
        setLink('');
        setLocationLink('');
        setImageUrls('');
        setUploadedImages([]);
        setNotes('');
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-teal-100 p-6 mb-8 animate-fade-in-down ${initialData ? 'w-full' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-teal-800">
            {initialData ? 'แก้ไขข้อมูลที่พัก' : 'เพิ่มที่พักใหม่'}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อที่พัก *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none"
            placeholder="เช่น บ้านไอทะเล..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ราคา (บาท)</label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="เช่น 1500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">เว็บไซต์ / Facebook Page</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            <MapPin size={16} /> ลิงก์ Google Maps
          </label>
          <input
            type="text"
            value={locationLink}
            onChange={(e) => setLocationLink(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none"
            placeholder="https://maps.app.goo.gl/..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            <ImageIcon size={16} /> รูปภาพประกอบ
          </label>
          
          {/* Upload Button */}
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingImg}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-300"
            >
              {isProcessingImg ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              {initialData ? 'เพิ่มรูปภาพ' : 'อัปโหลดรูปภาพ'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Uploaded Images Preview */}
          {uploadedImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-2 mb-2 scrollbar-hide">
              {uploadedImages.map((img, idx) => (
                <div key={idx} className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={img} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeUploadedImage(idx)}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {!initialData && (
             <textarea
                value={imageUrls}
                onChange={(e) => setImageUrls(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none h-20 resize-none text-sm font-mono mt-1"
                placeholder={`หรือวางลิงก์รูปภาพที่นี่ (บรรทัดละ 1 รูป)...`}
             />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">บันทึกช่วยจำ</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none h-20 resize-none"
            placeholder="เช่น ติดทะเลแต่ไม่มีอาหารเช้า..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {initialData ? (
            <><Save size={20} /> บันทึกการแก้ไข</>
          ) : (
            <><Plus size={20} /> บันทึกรายการ</>
          )}
        </button>
      </form>
    </div>
  );
};

export default AddForm;
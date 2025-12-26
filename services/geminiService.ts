import { GoogleGenAI, Type } from "@google/genai";
import { AiSuggestionParams, Accommodation } from "../types";

// Declare process to avoid TypeScript errors
declare const process: any;

// The API key must be obtained exclusively from the environment variable process.env.API_KEY
const apiKey = process.env.API_KEY || ''; 

// Initialize only if key exists to avoid immediate errors, though functionality will be limited
const ai = apiKey ? new GoogleGenAI({ apiKey: apiKey }) : null;

export const getAccommodationSuggestions = async (params: AiSuggestionParams): Promise<Omit<Accommodation, 'id' | 'votes' | 'addedBy'>[]> => {
  if (!ai || !apiKey) {
    console.warn("API_KEY not found. Returning mock data.");
    return [
      { 
        name: "บ้านรินรักษ์ (Mock)", 
        price: "2500", 
        link: "https://www.google.com/search?q=บ้านรินรักษ์+เกาะล้าน",
        locationLink: "https://maps.google.com/?q=บ้านรินรักษ์+เกาะล้าน",
        images: ["https://cf.bstatic.com/xdata/images/hotel/max1024x768/343438075.jpg?k=3f4c6e6e2e5e4e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e"],
        notes: "ห้องพักสีขาว ติดทะเล มินิมอลมาก (Mock data)" 
      },
      { 
        name: "Rimtalay Resort (Mock)", 
        price: "1800", 
        link: "https://www.google.com/search?q=Rimtalay+Resort",
        locationLink: "https://maps.google.com/?q=Rimtalay+Resort",
        images: [],
        notes: "บรรยากาศดี ปิ้งย่างได้ (Mock data)" 
      }
    ];
  }

  try {
    const prompt = `
      แนะนำที่พักบนเกาะล้าน จำนวน 3 แห่ง สำหรับกลุ่มเพื่อน ${params.people} คน
      งบประมาณประมาณ ${params.budget} บาทต่อคืน
      สไตล์ที่ชอบคือ: ${params.style}
      
      ขอข้อมูลเป็น JSON เท่านั้น ประกอบด้วย:
      - name: ชื่อที่พัก
      - price: ราคาโดยประมาณ (ตัวเลขหรือช่วงราคา)
      - link: ลิงก์ค้นหา Google หรือ Facebook
      - locationLink: ลิงก์ Google Maps Search (เช่น https://www.google.com/maps/search/?api=1&query=ชื่อที่พัก)
      - notes: จุดเด่นสั้นๆ
      *ไม่ต้องใส่ images เนื่องจากลิงก์รูปมักจะหมดอายุ ให้ส่ง array ว่างกลับมา []
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.STRING },
              link: { type: Type.STRING },
              locationLink: { type: Type.STRING },
              images: { type: Type.ARRAY, items: { type: Type.STRING } },
              notes: { type: Type.STRING },
            },
            required: ["name", "price", "link", "locationLink", "notes"]
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Ensure images is an array if API returns null/undefined
      return data.map((item: any) => ({
        ...item,
        images: item.images || []
      }));
    }
    return [];

  } catch (error) {
    console.error("Error fetching suggestions:", error);
    throw error;
  }
};
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

type MLPredictRequest = {
  text: string;
};

type MLPredictResponse = {
  text: string;
  label: "HOAKS" | "FAKTA";
  confidence: number;
  is_fake: boolean;
  model_scores: {
    bilstm: number;
    gru: number;
    cnn_bilstm: number;
  };
};

export async function predictNews(content: string): Promise<{
  label: "hoax" | "valid";
  confidence_score: number;
  explanation: string;
  model_scores: {
    bilstm: number;
    gru: number;
    cnn_bilstm: number;
  };
}> {
  if (!env.AI_API_URL) {
    throw new AppError("AI API URL tidak dikonfigurasi", 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.AI_API_TIMEOUT);

  try {
    const response = await fetch(`${env.AI_API_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: content } satisfies MLPredictRequest),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AppError(`AI API Error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as MLPredictResponse;

    const label = data.label === "HOAKS" ? "hoax" : "valid";
    const explanation = generateExplanation(
      label,
      data.confidence,
      data.model_scores,
    );

    return {
      label,
      confidence_score: data.confidence,
      explanation,
      model_scores: data.model_scores,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if ((error as Error).name === "AbortError") {
      throw new AppError("AI API timeout", 504);
    }

    throw new AppError(
      `Gagal menghubungi AI API: ${(error as Error).message}`,
      500,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function generateExplanation(
  label: "hoax" | "valid",
  confidence: number,
  modelScores: { bilstm: number; gru: number; cnn_bilstm: number },
): string {
  const percentage = (confidence * 100).toFixed(1);
  const isHighConfidence = confidence >= 0.85;
  const isLowConfidence = confidence < 0.6;

  // cari model dengan score tertinggi dan terendah
  const entries = Object.entries(modelScores);
  const topModel = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  const lowModel = entries.reduce((a, b) => (b[1] < a[1] ? b : a));

  const topModelName =
    topModel[0] === "cnn_bilstm" ? "CNN-BiLSTM" : topModel[0].toUpperCase();
  const topScore = (topModel[1] * 100).toFixed(1);
  const lowScore = (lowModel[1] * 100).toFixed(1);

  // hitung konsistensi antar model
  const scores = entries.map(([, score]) => score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) /
    scores.length;
  const isConsistent = variance < 0.01; // variance rendah = konsisten

  if (label === "hoax") {
    if (isHighConfidence) {
      const consistency = isConsistent
        ? `Ketiga model menunjukkan hasil yang <strong>sangat konsisten</strong>, mengindikasikan tingkat kepercayaan yang tinggi terhadap    
 klasifikasi ini. `
        : `Meskipun confidence score tinggi, terdapat sedikit variasi antar model (tertinggi <strong>${topScore}%</strong>, terendah          
 <strong>${lowScore}%</strong>), namun kesimpulan akhir tetap kuat. `;

      return `Berdasarkan analisis mendalam menggunakan <strong>ensemble model AI</strong> (BiLSTM, GRU, CNN-BiLSTM), konten ini              
 <strong>terindikasi kuat sebagai informasi yang tidak akurat</strong> dengan tingkat keyakinan <strong>${percentage}%</strong>. Model           
 <strong>${topModelName}</strong> memberikan score tertinggi sebesar <strong>${topScore}%</strong>, menunjukkan pola karakteristik yang sangat   
 konsisten dengan konten hoaks. ${consistency}Sistem kami mendeteksi pola linguistik, struktur narasi, dan penggunaan bahasa yang sering         
 ditemukan pada konten misinformasi. <em>Kami sangat menyarankan untuk <u>tidak menyebarkan</u> informasi ini dan memverifikasi kebenarannya     
 dari sumber berita terpercaya seperti media massa resmi atau lembaga fact-checking independen sebelum mempercayai atau membagikannya kepada     
 orang lain.</em>`;
    } else if (isLowConfidence) {
      return `Sistem mendeteksi kemungkinan konten ini mengandung informasi yang tidak akurat dengan tingkat keyakinan                        
 <strong>${percentage}%</strong>. Namun, <strong>confidence score yang relatif rendah</strong> menunjukkan bahwa konten ini berada di <em>area   
 abu-abu</em> dan memerlukan analisis lebih mendalam. Model <strong>${topModelName}</strong> memberikan score tertinggi                          
 <strong>${topScore}%</strong>, sementara model lain menunjukkan hasil yang lebih rendah (<strong>${lowScore}%</strong>), mengindikasikan adanya 
 ambiguitas dalam konten. Hal ini bisa terjadi karena konten mengandung campuran fakta dan opini, atau menggunakan bahasa yang tidak khas hoaks  
 maupun berita faktual. <em>Kami sangat menyarankan untuk melakukan <strong>pengecekan manual</strong> secara menyeluruh, cross-reference dengan 
 berbagai sumber berita terpercaya, dan mempertimbangkan konteks serta kredibilitas sumber asli sebelum mengambil kesimpulan. <u>Jangan langsung 
 menyebarkan</u> informasi ini tanpa verifikasi lebih lanjut.</em>`;
    } else {
      const consistency = isConsistent
        ? `Hasil analisis menunjukkan <strong>konsistensi yang baik</strong> antar ketiga model. `
        : `Terdapat variasi score antar model (<strong>${topScore}%</strong> hingga <strong>${lowScore}%</strong>), namun mayoritas mengarah  
 pada klasifikasi hoaks. `;

      return `Analisis <strong>ensemble model AI</strong> menunjukkan bahwa konten ini <strong>kemungkinan besar merupakan informasi yang     
 tidak akurat</strong> dengan tingkat keyakinan <strong>${percentage}%</strong>. ${consistency}Pola linguistik, struktur konten, dan             
 karakteristik narasi menunjukkan kemiripan dengan konten hoaks yang telah teridentifikasi sebelumnya. Model <strong>${topModelName}</strong>    
 memberikan indikasi terkuat dengan score <strong>${topScore}%</strong>. Meskipun demikian, kami tetap menyarankan untuk tidak langsung          
 menyimpulkan tanpa melakukan verifikasi tambahan. <em>Cek fakta dari sumber resmi seperti situs berita kredibel, lembaga pemerintah terkait,    
 atau platform fact-checking untuk memastikan kebenaran informasi. Berhati-hatilah dalam menyebarkan konten yang belum terverifikasi untuk       
 mencegah penyebaran misinformasi.</em>`;
    }
  } else {
    if (isHighConfidence) {
      const consistency = isConsistent
        ? `Ketiga model menunjukkan hasil yang <strong>sangat konsisten</strong>, memperkuat validitas klasifikasi ini. `
        : `Meskipun ada sedikit variasi score antar model (<strong>${topScore}%</strong> hingga <strong>${lowScore}%</strong>), kesimpulan    
 akhir tetap mengarah pada konten faktual. `;

      return `Hasil analisis <strong>ensemble model AI</strong> menunjukkan bahwa konten ini <strong>kemungkinan besar merupakan informasi    
 yang akurat</strong> dengan tingkat keyakinan <strong>${percentage}%</strong>. Model <strong>${topModelName}</strong> memberikan score          
 tertinggi sebesar <strong>${topScore}%</strong>, mengindikasikan pola bahasa, struktur, dan karakteristik konten yang sangat konsisten dengan   
 berita faktual. ${consistency}Sistem kami mendeteksi penggunaan bahasa yang objektif, struktur narasi yang terorganisir, dan tidak adanya       
 indikator khas konten hoaks seperti clickbait berlebihan atau klaim sensasional tanpa sumber. <em>Meskipun hasil analisis menunjukkan konten    
 ini kemungkinan akurat, kami tetap menyarankan untuk membaca artikel lengkap dari sumber asli untuk mendapatkan konteks yang lebih              
 komprehensif. Selalu bijak dalam mengonsumsi informasi dan pertimbangkan untuk membaca dari berbagai sumber terpercaya.</em>`;
    } else if (isLowConfidence) {
      return `Sistem mendeteksi kemungkinan konten ini merupakan informasi yang akurat dengan tingkat keyakinan                               
 <strong>${percentage}%</strong>. Namun, <strong>confidence score yang relatif rendah</strong> menunjukkan perlunya verifikasi tambahan untuk    
 memastikan keakuratan informasi. Model <strong>${topModelName}</strong> memberikan score <strong>${topScore}%</strong>, sementara model lain    
 menunjukkan hasil yang lebih rendah (<strong>${lowScore}%</strong>), mengindikasikan adanya elemen dalam konten yang tidak sepenuhnya khas      
 berita faktual. Hal ini bisa disebabkan oleh gaya penulisan yang tidak standar, campuran fakta dengan opini, atau kurangnya detail yang         
 biasanya ada pada berita resmi. <em>Kami menyarankan untuk membaca artikel lengkap dari sumber asli, memeriksa kredibilitas penulis dan media   
 yang mempublikasikan, serta mencari konfirmasi dari sumber berita lain yang terpercaya. Jangan langsung menyimpulkan hanya berdasarkan analisis 
 AI ini.</em>`;
    } else {
      const consistency = isConsistent
        ? `Hasil analisis menunjukkan <strong>konsistensi yang baik</strong> antar ketiga model AI. `
        : `Terdapat variasi score antar model (<strong>${topScore}%</strong> hingga <strong>${lowScore}%</strong>), namun mayoritas mengarah  
 pada klasifikasi faktual. `;

      return `Berdasarkan analisis model AI, konten ini <strong>terindikasi sebagai informasi yang akurat</strong> dengan tingkat keyakinan   
 <strong>${percentage}%</strong>. ${consistency}Model <strong>${topModelName}</strong> memberikan score tertinggi dalam klasifikasi ini sebesar  
 <strong>${topScore}%</strong>, menunjukkan karakteristik yang umumnya ditemukan pada konten berita faktual seperti penggunaan bahasa yang       
 objektif, struktur yang jelas, dan tidak adanya indikator hoaks yang signifikan. Sistem kami menganalisis berbagai aspek termasuk pola          
 linguistik, struktur narasi, dan konsistensi informasi. <em>Meskipun hasil analisis cukup positif, kami tetap menyarankan untuk selalu bijak    
 dalam mengonsumsi informasi. Pertimbangkan untuk membaca berita dari berbagai sumber terpercaya dan perhatikan tanggal publikasi untuk          
 memastikan informasi masih relevan.</em>`;
    }
  }
}

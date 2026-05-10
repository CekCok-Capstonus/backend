import { extract } from "@extractus/article-extractor";
import { convert } from "html-to-text";

const urls = [
  "https://www.tempo.co/politik/prabowo-akan-ada-tambahan-3-smart-board-di-setiap-sekolah-2134808",
  "https://nasional.kompas.com/read/2026/05/10/09140711/klarifikasi-kuasa-hukum-terkait-pegawai-pajak-yang-lari-hindari-wartawan",
  "https://news.detik.com/berita/d-8482691/pramono-deklarasi-gerakan-pilah-sampah-singgung-persoalan-bantargebang",
  "https://www.cnnindonesia.com/nasional/20260509200801-32-1356967/pdip-tolak-usul-ruu-pemilu-jadi-inisiatif-pemerintah-ada-apa",
  "https://www.liputan6.com/news/read/6402618/polisi-gagalkan-tawuran-di-jaktim-senjata-tajam-dan-10-remaja-diamankan",
  "https://kumparan.com/kumparannews/tenda-di-arafah-akan-dipasangi-nama-pastikan-semua-jemaah-haji-ri-bisa-masuk-27MzvUxbdzt",
  "https://www.antaranews.com/berita/5561829/prabowo-apresiasi-nelayan-bertaruh-nyawa-di-laut-demi-keluarga",
  "https://www.tribunnews.com/nasional/7827640/cegah-kecelakan-bus-als-anggota-komisi-v-dpr-lokot-nasution-usul-penerapan-smk3-di-pool-armada",
  "https://www.suara.com/news/2026/05/10/074129/bocah-perempuan-tewas-ditembak-tni-buru-opm-pimpinan-guspi-waker-di-tembagapura",
  "https://www.viva.co.id/berita/nasional/1897595-prabowo-akan-bagikan-1582-kapal-untuk-nelayan",
];

function detectNoise(text: string) {
  const patterns = [
    /ADVERTISEMENT/gi,
    /Scroll ke bawah untuk melanjutkan membaca/gi,
    /IKLAN/gi,
    /SCROLL TO CONTINUE/gi,
    /GULIR UNTUK LANJUT BACA/gi,
    /Baca Juga/gi,
    /Berlangganan/gi,
    /Bagikan/gi,
    /Dengarkan artikel/gi,
    /Tampilkan Ringkasan Artikel/gi,
    /Add as a preferred source on Google/gi,
    /\[Gambas:[^\]]+\]/gi,
  ];

  return patterns.reduce((count, pattern) => {
    return count + (text.match(pattern)?.length ?? 0);
  }, 0);
}

function trimBeforeArticleLead(text: string) {
  const markers = [
    "VIVA –",
    "Jakarta -",
    "JAKARTA, KOMPAS.com",
    "Jakarta, CNN Indonesia",
    "Jakarta (ANTARA)",
    "Suara.com -",
    "Liputan6.com, Jakarta",
    "TRIBUNNEWS.COM",
  ];

  for (const marker of markers) {
    const index = text.indexOf(marker);
    if (index > 0 && index < 300) {
      return text.slice(index);
    }
  }

  return text;
}

function removeNoise(text: string) {
  return (
    text
      .replace(/ADVERTISEMENT/gi, "")
      .replace(/Scroll ke bawah untuk melanjutkan membaca/gi, "")
      .replace(/SCROLL TO CONTINUE WITH CONTENT/gi, "")
      .replace(/GULIR UNTUK LANJUT BACA/gi, "")
      .replace(/\bIklan\b/gi, "")
      .replace(/\bBaca Juga\b/gi, "")
      .replace(/\bBagikan\b/gi, "")
      .replace(/\bDengarkan artikel\b/gi, "")
      .replace(/\bTampilkan Ringkasan Artikel\b/gi, "")
      // cnn footer
      .replace(/Add as a preferred source on Google/gi, "")
      .replace(/\[Gambas:[^\]]+\]/gi, "")

      // antara news copyright
      .replace(/Copyright © ANTARA.*$/gi, "")

      // breadcrumb viva
      .replace(/[]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

for (const url of urls) {
  console.log("\n==============================");
  console.log(url);

  try {
    const article = await extract(
      url,
      {
        contentLengthThreshold: 100,
        descriptionLengthThreshold: 80,
      },
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; CekCokBot/1.0; +https://github.com/CekCok-Capstonus/backend)",
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!article?.content) {
      console.log("FAILED: no content");
      continue;
    }

    const plainText = convert(article.content, {
      wordwrap: false,
      selectors: [
        {
          selector: "img",
          format: "skip",
        },
        {
          selector: "a",
          options: { ignoreHref: true },
        },
      ],
    })
      .replace(/\s+/g, " ")
      .trim();

    const cleaned = trimBeforeArticleLead(removeNoise(plainText));
    const noiseHits = detectNoise(cleaned);

    const quality =
      cleaned.length < 300 ? "unsupported" : noiseHits >= 6 ? "dirty" : "clean";

    console.log("raw html length:", article.content.length);
    console.log("plain length:", plainText.length);
    console.log("clean length:", cleaned.length);
    console.log("noise hits:", noiseHits);
    console.log("quality:", quality);
    console.log("preview:", cleaned);
  } catch (error) {
    console.error("ERROR:", error);
  }
}

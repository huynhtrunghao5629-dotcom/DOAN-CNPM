// Nội dung demo Frontend; không phải bản dịch chính thức từ Backend.
export const LANGUAGE_CODES = { vi: 'vi-VN', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR' };

const SAMPLES = {
  "dai noi": {
    "name": "Đại Nội Huế",
    "en": "The Imperial City of Hue was the political and ceremonial center of the Nguyen dynasty. Its gates, palaces, and courtyards preserve an important part of Vietnamese history.",
    "zh": "顺化皇城曾是阮朝的政治与礼仪中心。城门、宫殿和庭院保存着越南历史的重要篇章。",
    "ja": "フエの王宮はグエン朝の政治と儀式の中心でした。門や宮殿、中庭にはベトナムの大切な歴史が残されています。",
    "ko": "후에 황성은 응우옌 왕조의 정치와 의례 중심지였습니다. 성문과 궁전, 정원에는 베트남의 중요한 역사가 담겨 있습니다.",
    "vi": "Đại Nội Huế là một địa điểm di sản đặc sắc tại Huế. Du khách có thể tìm hiểu lịch sử, kiến trúc và giá trị văn hóa của địa điểm này."
  },
  "thien mu": {
    "name": "Chùa Thiên Mụ",
    "en": "Thien Mu Pagoda stands beside the Perfume River. Its seven-story Phuoc Duyen Tower is one of the best-known symbols of Hue.",
    "zh": "天姥寺位于香江岸边。七层的福缘塔是顺化最著名的象征之一。",
    "ja": "ティエンムー寺はフォン川のほとりに建っています。七層のフオックズエン塔はフエを象徴する建築の一つです。",
    "ko": "티엔무 사원은 흐엉강 옆에 자리합니다. 일곱 층의 프억주옌 탑은 후에를 대표하는 상징 중 하나입니다.",
    "vi": "Chùa Thiên Mụ là một địa điểm di sản đặc sắc tại Huế. Du khách có thể tìm hiểu lịch sử, kiến trúc và giá trị văn hóa của địa điểm này."
  },
  "tu duc": {
    "name": "Lăng Tự Đức",
    "en": "Tu Duc Tomb is set among pine trees, lakes, and traditional buildings. The peaceful grounds reflect the artistic taste of Emperor Tu Duc.",
    "zh": "嗣德陵坐落在松林、湖泊和传统建筑之间。宁静的环境展现了嗣德皇帝的艺术品味。",
    "ja": "トゥドゥック帝廟は松林や池、伝統的な建物に囲まれています。静かな景観から皇帝の美意識が感じられます。",
    "ko": "뜨득 황제릉은 소나무 숲과 호수, 전통 건물에 둘러싸여 있습니다. 고요한 풍경은 황제의 예술적 취향을 보여 줍니다.",
    "vi": "Lăng Tự Đức là một địa điểm di sản đặc sắc tại Huế. Du khách có thể tìm hiểu lịch sử, kiến trúc và giá trị văn hóa của địa điểm này."
  },
  "khai dinh": {
    "name": "Lăng Khải Định",
    "en": "Khai Dinh Tomb combines Vietnamese and European architectural influences. The richly decorated interior is especially notable.",
    "zh": "启定陵融合了越南与欧洲的建筑风格。内部华丽的装饰尤其引人注目。",
    "ja": "カイディン帝廟はベトナムとヨーロッパの建築様式を融合しています。特に豪華な内部装飾が見どころです。",
    "ko": "카이딘 황제릉은 베트남과 유럽의 건축 양식을 결합했습니다. 특히 화려한 내부 장식이 인상적입니다.",
    "vi": "Lăng Khải Định là một địa điểm di sản đặc sắc tại Huế. Du khách có thể tìm hiểu lịch sử, kiến trúc và giá trị văn hóa của địa điểm này."
  },
  "minh mang": {
    "name": "Lăng Minh Mạng",
    "en": "Minh Mang Tomb is known for its balanced layout, lakes, and gardens. The site expresses harmony between architecture and nature.",
    "zh": "明命陵以对称的布局、湖泊和园林闻名。这里体现了建筑与自然的和谐。",
    "ja": "ミンマン帝廟は整った配置や池、庭園で知られています。建築と自然の調和が表現されています。",
    "ko": "민망 황제릉은 균형 잡힌 배치와 호수, 정원으로 유명합니다. 건축과 자연의 조화를 보여 줍니다.",
    "vi": "Lăng Minh Mạng là một địa điểm di sản đặc sắc tại Huế. Du khách có thể tìm hiểu lịch sử, kiến trúc và giá trị văn hóa của địa điểm này."
  },
  "gia long": {
    "name": "Lăng Gia Long",
    "en": "Gia Long Tomb lies in a quiet landscape outside central Hue. It is the resting place of Gia Long, the first emperor of the Nguyen dynasty.",
    "zh": "嘉隆陵位于顺化市区外的宁静山水之间。这里是阮朝首位皇帝嘉隆的陵寝。",
    "ja": "ザーロン帝廟はフエ中心部から離れた静かな自然の中にあります。グエン朝初代皇帝が眠る場所です。",
    "ko": "자롱 황제릉은 후에 도심에서 떨어진 고요한 자연 속에 있습니다. 응우옌 왕조 초대 황제의 무덤입니다.",
    "vi": "Lăng Gia Long là một địa điểm di sản đặc sắc tại Huế. Du khách có thể tìm hiểu lịch sử, kiến trúc và giá trị văn hóa của địa điểm này."
  },
  "nam giao": {
    "name": "Đàn Nam Giao",
    "en": "Nam Giao Esplanade was used by Nguyen emperors for ceremonies honoring heaven and earth. It is an important site of Hue royal rituals.",
    "zh": "南郊坛曾是阮朝皇帝举行祭天祭地仪式的地方，也是顺化皇家礼制的重要遗址。",
    "ja": "ナムザオ祭壇はグエン朝皇帝が天地をまつる儀式を行った場所です。フエの宮廷儀礼を伝える重要な史跡です。",
    "ko": "남자오 제단은 응우옌 왕조 황제들이 하늘과 땅에 제사를 올리던 곳입니다. 후에 왕실 의례의 중요한 유적입니다.",
    "vi": "Đàn Nam Giao là một địa điểm di sản đặc sắc tại Huế. Du khách có thể tìm hiểu lịch sử, kiến trúc và giá trị văn hóa của địa điểm này."
  }
};

// Backend trả về MongoDB id nên nhận diện bằng tên, không dựa vào id cố định.
const stripAccents = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
export function getNarration(poi, language = 'vi') {
  if (!poi) return '';
  // Ưu tiên nội dung thực của Backend nếu đã có bản dịch theo ngôn ngữ.
  const narration = poi.narration;
  if (narration && typeof narration === 'object' && typeof narration[language] === 'string' && narration[language].trim()) return narration[language];
  if (language === 'vi' && typeof narration === 'string' && narration.trim()) return narration;
  const normalizedName = stripAccents(poi.name);
  const key = Object.keys(SAMPLES).find(k => normalizedName.includes(stripAccents(SAMPLES[k].name)));
  if (key) return SAMPLES[key][language] || SAMPLES[key].vi;
  // Không dùng lời mô tả tiếng Việt rồi phát bằng giọng nước ngoài.
  if (language === 'vi') return `${poi.name}. ${poi.description || 'Nội dung thuyết minh đang cập nhật.'}`;
  return '';
}

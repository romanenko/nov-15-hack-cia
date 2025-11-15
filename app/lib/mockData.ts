export interface ProfileData {
  username: string;
  name: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  verified: boolean;
}

export interface Insight {
  question: string;
  answer: string;
}

// Generate a consistent hash from string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Seeded random number generator
function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed + index) * 10000;
  return x - Math.floor(x);
}

export function generateMockProfile(username: string): ProfileData {
  const hash = hashString(username);
  const names = [
    'Sarah Chen', 'Michael Rodriguez', 'Emma Thompson', 'David Kim',
    'Jessica Martinez', 'Alex Johnson', 'Maria Garcia', 'James Wilson'
  ];

  const bios = [
    'Tech enthusiast • Building the future',
    'Entrepreneur | Investor | Coffee addict',
    'Writer, thinker, occasional comedian',
    'Making things happen • San Francisco',
    'Product designer who codes',
    'Just here for the memes and discourse',
    'Venture capital • Previously @startup',
    'AI researcher | Cat person 🐱'
  ];

  const name = names[hash % names.length];

  return {
    username,
    name,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=1d9bf0&color=fff&bold=true`,
    bio: bios[hash % bios.length],
    followers: Math.floor(seededRandom(hash, 1) * 50000) + 1000,
    following: Math.floor(seededRandom(hash, 2) * 2000) + 100,
    verified: seededRandom(hash, 3) > 0.7,
  };
}

export function generateMockInsights(username: string): Insight[] {
  const hash = hashString(username);

  const beliefs = [
    'Advocates for open source and collaborative innovation',
    'Technology can solve global challenges',
    'Values authenticity and transparency',
    'Skeptical of institutions, prefers decentralization'
  ];

  const expertise = [
    'Software engineering and system architecture',
    'Digital marketing and growth strategies',
    'Blockchain technology and Web3',
    'Data science and machine learning'
  ];

  const voting = [
    'Progressive, focused on social equity',
    'Center-left, balancing idealism with pragmatism',
    'Fiscally conservative, socially moderate',
    'Libertarian, values individual liberty'
  ];

  const risk = [
    'High tolerance, early adopter of new ideas',
    'Calculated, weighs opportunities carefully',
    'Moderate aversion, prefers proven solutions',
    'Conservative, values stability'
  ];

  const worldview = [
    'Optimistic about human progress',
    'Pragmatic realist about challenges ahead',
    'Critical, advocates for systemic change',
    'Traditional values with selective modernism'
  ];

  const socioeconomic = [
    'Upper-middle class, tech professional',
    'Middle class, stable career',
    'Affluent, investor mindset',
    'Working professional, career-focused'
  ];

  return [
    {
      question: "What are their beliefs?",
      answer: beliefs[hash % beliefs.length],
    },
    {
      question: "What's their expertise?",
      answer: expertise[hash % expertise.length],
    },
    {
      question: "How do they lean politically?",
      answer: voting[hash % voting.length],
    },
    {
      question: "How do they handle risk?",
      answer: risk[hash % risk.length],
    },
    {
      question: "What's their worldview?",
      answer: worldview[hash % worldview.length],
    },
    {
      question: "What's their socioeconomic class?",
      answer: socioeconomic[hash % socioeconomic.length],
    },
  ];
}

// Simulate API call with delay
export async function fetchProfileData(username: string): Promise<ProfileData> {
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

  // 10% chance of failure
  if (Math.random() < 0.1) {
    throw new Error('Failed to fetch profile data');
  }

  return generateMockProfile(username);
}

export async function fetchInsights(username: string): Promise<Insight[]> {
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

  // 10% chance of failure
  if (Math.random() < 0.1) {
    throw new Error('Failed to generate insights');
  }

  return generateMockInsights(username);
}

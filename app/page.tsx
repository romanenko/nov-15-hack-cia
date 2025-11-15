import HomeClient from './HomeClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CIA - Deep Intelligence on X Profiles',
  description: 'Get comprehensive intelligence analysis on any X (Twitter) profile. Analyze followers, engagement patterns, and content insights.',
  keywords: ['X', 'Twitter', 'profile analysis', 'social media intelligence', 'analytics'],
  authors: [{ name: 'CIA' }],
  openGraph: {
    title: 'CIA - Deep Intelligence on X Profiles',
    description: 'Get comprehensive intelligence analysis on any X (Twitter) profile.',
    type: 'website',
    siteName: 'CIA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CIA - Deep Intelligence on X Profiles',
    description: 'Get comprehensive intelligence analysis on any X (Twitter) profile.',
  },
};

export default function Home() {
  return <HomeClient />;
}

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProfileData } from '../lib/serverApi';
import ProfileClient from './ProfileClient';

type Props = {
  params: Promise<{ username: string }>;
};

// Generate dynamic metadata based on the profile data
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  // Fetch profile data for metadata
  const profile = await getProfileData(username);

  if (!profile) {
    return {
      title: `@${username} - Profile Not Found | CIA`,
      description: `Unable to find profile information for @${username}.`,
    };
  }

  const title = `${profile.name || username} (@${profile.handle}) - Intelligence Analysis | CIA`;
  const description = profile.desc
    ? `${profile.desc.substring(0, 155)}...`
    : `Deep intelligence analysis of @${profile.handle} on X. View follower insights, engagement patterns, and comprehensive profile analysis.`;

  return {
    title,
    description,
    keywords: [
      'X profile analysis',
      username,
      profile.handle,
      'Twitter intelligence',
      'social media analytics',
    ],
    authors: [{ name: 'CIA' }],
    openGraph: {
      title,
      description,
      type: 'profile',
      siteName: 'CIA',
      images: profile.avatar ? [
        {
          url: profile.avatar,
          width: 400,
          height: 400,
          alt: `${profile.name || username} profile picture`,
        }
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: profile.avatar ? [profile.avatar] : undefined,
      creator: `@${profile.handle}`,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;

  // Fetch profile data server-side
  const profile = await getProfileData(username);

  // If profile doesn't exist, show 404
  if (!profile) {
    notFound();
  }

  // Pass the server-fetched data to the client component
  return <ProfileClient username={username} initialProfile={profile} />;
}


'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import ContestClientPage from './_components/contest-client-page';
import type { Contest } from '@/lib/types';
import { getContest } from '@/lib/contestService';

export default function ContestPage() {
  const params = useParams();
  const { id } = params;
  const [contest, setContest] = useState<Contest | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    const fetchContest = async () => {
      try {
        const fetchedContest = await getContest(id as string);
        setContest(fetchedContest);
      } catch (error) {
        console.error("Failed to fetch contest", error);
        setContest(null);
      }
    };

    fetchContest();
  }, [id]);

  if (contest === undefined) {
    return <div>Loading...</div>;
  }

  if (!contest) {
    notFound();
  }

  return <ContestClientPage contest={contest} />;
}

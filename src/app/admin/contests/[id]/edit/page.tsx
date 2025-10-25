
'use client';

import { ContestForm } from '../../_components/contest-form';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Contest } from '@/lib/types';
import { getContest } from '@/lib/contestService';

export default function EditContestPage() {
  const params = useParams();
  const id = params.id as string;
  const [contest, setContest] = useState<Contest | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    const fetchContest = async () => {
      try {
        const fetchedContest = await getContest(id);
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

  if (contest === null) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6">Edit Contest</h1>
      <ContestForm contest={contest} />
    </div>
  );
}

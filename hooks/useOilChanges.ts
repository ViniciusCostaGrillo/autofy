import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getLocalOilChanges, saveLocalOilChanges } from '@/lib/localStore';
import { OilChange } from '@/types/models';

interface MutationResult {
  error: Error | null;
}

export function useOilChanges() {
  const { session } = useAuth();
  const [oilChanges, setOilChanges] = useState<OilChange[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!session?.user?.id) {
      setOilChanges([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await getLocalOilChanges();
    setOilChanges(
      data
        .filter((item) => item.userId === session.user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    refetch().catch((error) => {
      console.error('Failed to fetch oil changes', error);
    });
  }, [refetch]);

  const addOilChange = async (
    input: Omit<OilChange, 'id' | 'createdAt' | 'userId'>
  ): Promise<MutationResult> => {
    if (!session?.user?.id) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const existing = await getLocalOilChanges();
      const nextOilChange: OilChange = {
        ...input,
        id: `oil-${Date.now()}`,
        userId: session.user.id,
        createdAt: new Date().toISOString(),
      };
      await saveLocalOilChanges([nextOilChange, ...existing]);
      await refetch();
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Failed to save oil change'),
      };
    }
  };

  const deleteOilChange = async (id: string): Promise<MutationResult> => {
    if (!session?.user?.id) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const existing = await getLocalOilChanges();
      await saveLocalOilChanges(existing.filter((item) => item.id !== id));
      await refetch();
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Failed to delete oil change'),
      };
    }
  };

  return { oilChanges, loading, refetch, addOilChange, deleteOilChange };
}

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getLocalMaintenanceExpenses, saveLocalMaintenanceExpenses } from '@/lib/localStore';
import { MaintenanceExpense } from '@/types/models';

interface MutationResult {
  error: Error | null;
}

export function useMaintenanceExpenses() {
  const { session } = useAuth();
  const [expenses, setExpenses] = useState<MaintenanceExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!session?.user?.id) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await getLocalMaintenanceExpenses();
    setExpenses(
      data
        .filter((item) => item.userId === session.user.id)
        .sort((a, b) => {
          const dateCompare = b.date.localeCompare(a.date);
          if (dateCompare !== 0) return dateCompare;
          return b.createdAt.localeCompare(a.createdAt);
        })
    );
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    refetch().catch((error) => {
      console.error('Failed to fetch maintenance expenses', error);
    });
  }, [refetch]);

  const addExpense = async (
    input: Omit<MaintenanceExpense, 'id' | 'createdAt' | 'userId'>
  ): Promise<MutationResult> => {
    if (!session?.user?.id) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const existing = await getLocalMaintenanceExpenses();
      const nextExpense: MaintenanceExpense = {
        ...input,
        id: `maintenance-${Date.now()}`,
        userId: session.user.id,
        createdAt: new Date().toISOString(),
      };
      await saveLocalMaintenanceExpenses([nextExpense, ...existing]);
      await refetch();
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Failed to save maintenance expense'),
      };
    }
  };

  const deleteExpense = async (id: string): Promise<MutationResult> => {
    if (!session?.user?.id) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const existing = await getLocalMaintenanceExpenses();
      await saveLocalMaintenanceExpenses(existing.filter((item) => item.id !== id));
      await refetch();
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Failed to delete maintenance expense'),
      };
    }
  };

  return { expenses, loading, refetch, addExpense, deleteExpense };
}

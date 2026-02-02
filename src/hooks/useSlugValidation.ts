import { useState, useEffect } from 'react';
import { companiesService } from '@/services/companies.service';

export function useSlugValidation(slug: string | undefined, initialSlug?: string) {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Don't check if slug hasn't changed from initial value
    if (!slug || slug === initialSlug) {
      setIsAvailable(null);
      return;
    }

    if (slug.length < 2) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    const timer = setTimeout(async () => {
      try {
        const result = await companiesService.checkSlugAvailability(slug);
        setIsAvailable(result.available);
      } catch {
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, initialSlug]);

  return { isChecking, isAvailable };
}

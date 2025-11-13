import { useEffect, useState } from 'react';

export function useFrameworkReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => { try {} finally { if (mounted) setReady(true); } })();
    return () => { mounted = false; };
  }, []);
  return ready;
}

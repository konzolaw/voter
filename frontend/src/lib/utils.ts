import Fingerprint2 from 'fingerprintjs2';

export const getDeviceFingerprint = (): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      Fingerprint2.get((components) => {
        const values = components.map((component) => component.value);
        const hash = Fingerprint2.x64hash128(values.join(''), 31);
        resolve(hash);
      });
    } else {
      resolve('');
    }
  });
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

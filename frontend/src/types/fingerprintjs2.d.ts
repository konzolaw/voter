declare module 'fingerprintjs2' {
  interface Component {
    key: string;
    value: any;
  }

  interface Fingerprint2Static {
    get(callback: (components: Component[]) => void): void;
    x64hash128(input: string, seed: number): string;
  }

  const Fingerprint2: Fingerprint2Static;
  export default Fingerprint2;
}

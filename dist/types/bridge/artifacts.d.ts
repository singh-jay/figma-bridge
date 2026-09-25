export declare function saveArtifact(directory: string, bytes: Uint8Array, mime: string, expectedHash: string): {
    path: string;
    mime: string;
    bytes: number;
    sha256: string;
};

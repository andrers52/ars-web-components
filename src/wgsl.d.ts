// Type declaration for Vite raw WGSL shader imports.
declare module '*.wgsl?raw' {
    const content: string;
    export default content;
}

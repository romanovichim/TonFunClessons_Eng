type Result = {
    start: boolean;
    nextPort: number;
};
/**
 * Increases by one the port number until it finds an available port.
 * @param port Port number to start with.
 * @param root Root of the project.
 */
declare const getNextPort: (port: number, root: string) => Promise<Result>;
export default getNextPort;
//# sourceMappingURL=getNextPort.d.ts.map
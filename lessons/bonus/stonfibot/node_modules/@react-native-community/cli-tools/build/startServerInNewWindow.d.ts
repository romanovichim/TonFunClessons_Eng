import execa from 'execa';
import { CLIError } from './errors';
declare function startServerInNewWindow(port: number, projectRoot: string, reactNativePath: string, terminal?: string): CLIError | execa.ExecaChildProcess<string> | execa.ExecaSyncReturnValue<string> | undefined;
export default startServerInNewWindow;
//# sourceMappingURL=startServerInNewWindow.d.ts.map
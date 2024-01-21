/**
 * check for MacOS default app paths first to avoid waiting for the slow lsregister command
 */
export declare function darwinFast(): string | undefined;
export declare function darwin(): string[];
/**
 * Look for linux executables in 3 ways
 * 1. Look into EDGE_PATH env variable
 * 2. Look into the directories where .desktop are saved on gnome based distro's
 * 3. Look for microsoft-edge-stable & microsoft-edge executables by using the which command
 */
export declare function linux(): string[];
export declare function wsl(): string[];
export declare function win32(): string[];

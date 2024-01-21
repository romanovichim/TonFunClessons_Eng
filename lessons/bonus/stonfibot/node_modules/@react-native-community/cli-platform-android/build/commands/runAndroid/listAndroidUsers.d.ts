type User = {
    id: string;
    name: string;
};
export declare function checkUsers(device: string, adbPath: string): User[];
export declare function promptForUser(users: User[]): Promise<User>;
export {};
//# sourceMappingURL=listAndroidUsers.d.ts.map
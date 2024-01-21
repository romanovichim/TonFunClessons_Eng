type GradleTask = {
    task: string;
    description: string;
};
export declare const parseTasksFromGradleFile: (taskType: 'install' | 'build', text: string) => Array<GradleTask>;
export declare const getGradleTasks: (taskType: 'install' | 'build', sourceDir: string) => GradleTask[];
export declare const promptForTaskSelection: (taskType: 'install' | 'build', sourceDir: string) => Promise<string | undefined>;
export {};
//# sourceMappingURL=listAndroidTasks.d.ts.map
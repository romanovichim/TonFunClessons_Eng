import prompts, { Options, PromptObject } from 'prompts';
type PromptOptions = {
    nonInteractiveHelp?: string;
} & Options;
type InteractionOptions = {
    pause: boolean;
    canEscape?: boolean;
};
type InteractionCallback = (options: InteractionOptions) => void;
export declare function prompt<T extends string>(question: PromptObject, options?: PromptOptions): Promise<prompts.Answers<T>>;
export declare function pauseInteractions(options?: Omit<InteractionOptions, 'pause'>): void;
/** Notify all listeners that keypress observations can start.. */
export declare function resumeInteractions(options?: Omit<InteractionOptions, 'pause'>): void;
/** Used to pause/resume interaction observers while prompting (made for TerminalUI). */
export declare function addInteractionListener(callback: InteractionCallback): void;
export {};
//# sourceMappingURL=prompt.d.ts.map
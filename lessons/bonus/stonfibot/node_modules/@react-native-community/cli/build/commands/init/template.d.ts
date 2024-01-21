import execa from 'execa';
import * as PackageManager from '../../tools/packageManager';
export type TemplateConfig = {
    placeholderName: string;
    templateDir: string;
    postInitScript?: string;
    titlePlaceholder?: string;
};
export declare function installTemplatePackage(templateName: string, root: string, packageManager: PackageManager.PackageManager): Promise<execa.ExecaReturnValue<string>>;
export declare function getTemplateConfig(templateName: string, templateSourceDir: string): TemplateConfig;
export declare function copyTemplate(templateName: string, templateDir: string, templateSourceDir: string): Promise<void>;
export declare function executePostInitScript(templateName: string, postInitScript: string, templateSourceDir: string): execa.ExecaChildProcess<string>;
//# sourceMappingURL=template.d.ts.map
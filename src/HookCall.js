/* @flow */

export default class HookCall {
    sourceName: string;
    hookName: string;
    executionTime: number;
    fromFile: ?string;
    onFile: ?string;

    constructor(
        sourceName: string,
        hookName: string,
        executionTime: number,
        fromFile: ?string = null,
        onFile: ?string = null
    ) {
        this.sourceName = sourceName;
        this.hookName = hookName;
        this.executionTime = executionTime;
        this.fromFile = fromFile;
        this.onFile = onFile;
    }

    isFromPlugin(pluginName: string): boolean {
        return (this.sourceName === pluginName);
    }

    isFromMethod(pluginName: string, methodName: string): boolean {
        return (this.sourceName === pluginName && this.hookName === methodName);
    }

    isOnFile(path: string): boolean {
        return (this.onFile === path);
    }

    getExecutionTime(): number {
        return this.executionTime;
    }

    getOnFile(): ?string {
        return this.onFile;
    }
}

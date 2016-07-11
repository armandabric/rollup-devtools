/* @flow */

import HookCall from './HookCall';
import type { RollupPlugin } from './RollupPlugin';

export function convertNanoSecondToMiliSecond(nanoSecond: number): number {
    return parseInt((nanoSecond / 1000000).toFixed(0), 10);
}

export default class Reporter {
    plugins: Array<RollupPlugin>;
    monitoredMethod: Array<string>;
    history: Array<HookCall>;

    constructor(
        plugins: Array<RollupPlugin>,
        monitoredMethod: Array<string>,
        history: Array<HookCall>
    ) {
        this.plugins = plugins;
        this.monitoredMethod = monitoredMethod;
        this.history = history;
    }

    report(): void {
        this.write('');

        this.reportCallExecutionTimeSummary();
        this.reportFileTimeSummary();
    }

    write(...args: Array<string>): void {
        console.log(...args); // eslint-disable-line no-console
    }

    reportCallExecutionTimeSummary(): void {
        const totalPluginCallExecutionTimes = [];
        this.plugins.forEach((plugin) => {
            const totalPluginCallExecutionTime = this._reportPluginCallExecutionTime(plugin);
            totalPluginCallExecutionTimes.push(totalPluginCallExecutionTime);

            this.write('');
        });

        const pluginsTotal = this._sumArray(totalPluginCallExecutionTimes);

        this.write(`> total execution time in all plugins: ${convertNanoSecondToMiliSecond(pluginsTotal)}ms`);
    }

    reportFileTimeSummary(): void {
        const workingFiles = this._findWorkingFiles();

        workingFiles.forEach((file: string) => {
            this._reportFileExecutionTime(file);
            this.write('');
        });
    }

    _reportFileExecutionTime(file: string) {
        const fileHistory = this._findFileHistory(file);

        this.write(`> file "${file}"`);

        const pluginExecutionTimes = []
        this.plugins.forEach((plugin) => {
            const pluginName = plugin.name;

            const pluginRelatedCalls = this._extractPluginCallHistory(fileHistory, pluginName);
            const pluginExecutionTime = this._calculateHistoryExecutionTime(pluginRelatedCalls);
            pluginExecutionTimes.push(pluginExecutionTime);

            this.write(`>>> ${pluginName} takes ${convertNanoSecondToMiliSecond(pluginExecutionTime)}ms to process it`);
        });

        const totalPluginsCallExecutionTime = this._sumArray(pluginExecutionTimes);

        this.write(`> total call execution time: ${convertNanoSecondToMiliSecond(totalPluginsCallExecutionTime)}ms`);
    }

    _reportPluginCallExecutionTime(plugin: RollupPlugin): number {
        const pluginName = plugin.name;

        this.write(`> ${pluginName}:`);

        const totalMethodCallExecutionTimes = [];
        this.monitoredMethod.forEach((methodName) => {
            if (!plugin[methodName] || typeof plugin[methodName] !== 'function') {
                return;
            }

            const totalMethodCallExecutionTime = this._reportMethodCallExecutionTime(
                pluginName,
                methodName
            );

            totalMethodCallExecutionTimes.push(totalMethodCallExecutionTime);
        });

        const totalPluginCallExecutionTime = this._sumArray(totalMethodCallExecutionTimes);
        const pluginTotalInMilisecond = convertNanoSecondToMiliSecond(totalPluginCallExecutionTime);

        this.write(`>> ${pluginName} total call execution time: ${pluginTotalInMilisecond}ms`);

        return totalPluginCallExecutionTime;
    }

    _reportMethodCallExecutionTime(
        pluginName: string,
        methodName: string
    ): number {
        const methodCallHistory = this._findMethodCallHistory(pluginName, methodName);
        if (methodCallHistory.length === 0) {
            this.write(`>>> ${pluginName}.${methodName} has not been called`);

            return 0;
        }

        const totalMethodCallExecutionTime = this._calculateHistoryExecutionTime(methodCallHistory);
        const methodTotalInMilisecond = convertNanoSecondToMiliSecond(totalMethodCallExecutionTime);

        this.write(`>>> ${pluginName}.${methodName} total call execution time: ${methodTotalInMilisecond}ms`);

        return totalMethodCallExecutionTime;
    }

    _calculateHistoryExecutionTime(history: Array<HookCall>) {
        return history.reduce((total, hookCall: HookCall) => {
            return total + hookCall.getExecutionTime();
        }, 0);
    }

    _sumArray(values: Array<number>) {
        return values.reduce((total, value) => {
            return total + value;
        }, 0);
    }

    _extractPluginCallHistory(
        history : Array<HookCall>,
        pluginName : string
    ): Array<HookCall> {
        return history.filter((call) => {
            return call.isFromPlugin(pluginName);
        });
    }

    _findMethodCallHistory(
        pluginName : string,
        methodName : string
    ): Array<HookCall> {
        return this.history.filter((call: HookCall) => {
            return call.isFromMethod(pluginName, methodName);
        });
    }

    _findFileHistory(file : string): Array<HookCall> {
        return this.history.filter((call: HookCall) => {
            return call.isOnFile(file);
        });
    }

    _findWorkingFiles(): Array<string> {
        const fileSet: Set<string> = new Set();

        this.history.reduce((files: Set<string>, hookCall: HookCall) => {
            const path = hookCall.getOnFile();
            if (!path) {
                return files;
            }

            return files.add(path);
        }, fileSet);

        return Array.from(fileSet);
    }
}

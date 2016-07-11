/* @flow */

import padStart from 'string.prototype.padstart';
import HookCall from './HookCall';
import Reporter from './Reporter';
import type { RollupPlugin } from './RollupPlugin';

export function convertHrtimeToNanoSecond(time: [number, number]): number {
    return parseInt(`${time[0]}${padStart(time[1].toFixed(0), 8, '0')}`, 10);
}

export default class Monitor {
    plugins: Array<RollupPlugin>;

    callsHistory: Array<HookCall>;

    static PLUGIN_METHODS: Array<string> = [
        'option',
        'load',
        'resolveId',
        'transform',
        'transformBundle',
        'intro',
        'outro',
        'banner',
        'footer',
    ];

    constructor() {
        this.plugins = [];
        this.callsHistory = [];
    }

    monitorPlugin(plugin: RollupPlugin): RollupPlugin {
        const pluginName = plugin.name;
        if (!pluginName) {
            throw new Error('A plugin should have a name to be monitored.');
        }

        this.plugins.push(plugin);

        this.constructor.PLUGIN_METHODS.forEach((methodName) => {
            this._monitorPluginMethod(plugin, methodName);
        });

        return plugin;
    }

    _monitorPluginMethod(plugin: RollupPlugin, methodName: string) {
        const pluginName = plugin.name;
        const pluginMethod = plugin[methodName];

        if (!pluginMethod || typeof pluginMethod !== 'function') {
            return;
        }

        plugin[methodName] = this._proxyfyPluginMethod(plugin, pluginName, pluginMethod, methodName);
    }

    _proxyfyPluginMethod(
        plugin: RollupPlugin,
        pluginName: string,
        pluginOriginalMethod: Function,
        methodName: string
    ): Function {
        return (...originalArguments) => {
            const startTime = process.hrtime();

            return Promise
                .resolve(pluginOriginalMethod.apply(plugin, originalArguments))
                .then((originalResult) => {
                    const elapsedTime = process.hrtime(startTime);

                    this._monitorMethodCall(
                        pluginName,
                        methodName,
                        convertHrtimeToNanoSecond(elapsedTime),
                        originalArguments,
                        originalResult
                    );

                    return originalResult;
                });
        };
    }

    _monitorMethodCall(
        pluginName: string,
        methodName: string,
        elapsedTimeInNanoSecond: number,
        originalArguments: Array<mixed>,
        originalResult: Array<mixed>
    ) {
        let call;
        if (methodName === 'transform' && originalResult) {
            const fromFile = originalArguments[1];
            if (typeof fromFile !== 'string') {
                throw new Error('Invalid argument: string expected.');
            }

            call = new HookCall(
                pluginName,
                methodName,
                elapsedTimeInNanoSecond,
                null,
                fromFile
            );
        } else if (methodName === 'resolveId' || methodName === 'load') {
            const toFile = originalArguments[1];
            if (typeof toFile !== 'string') {
                throw new Error('Invalid argument: string expected.');
            }

            const fromFile = originalArguments[0];
            if (typeof fromFile !== 'string') {
                throw new Error('Invalid argument: string expected.');
            }

            call = new HookCall(
                pluginName,
                methodName,
                elapsedTimeInNanoSecond,
                toFile,
                fromFile
            );
        } else {
            call = new HookCall(pluginName, methodName, elapsedTimeInNanoSecond);
        }

        this.callsHistory.push(call);
    }

    report(): void {
        const repporter = new Reporter(
            this.plugins,
            this.constructor.PLUGIN_METHODS,
            this.callsHistory
        );

        repporter.report();
    }
}

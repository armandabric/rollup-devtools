# rollup-devtools

This tools help you to monitor rollup plugins bundle time. It will aggregate
two plugins statistics :
1. the plugin call execution time by method
2. the plugin call execution time by file


Here an example of plugin call execution time by method:

```
> stream-entrypoint:
>>> stream-entrypoint.load total call execution time: 2ms
>>> stream-entrypoint.resolveId total call execution time: 5ms
>> stream-entrypoint total call execution time: 7ms

> node-resolve:
>>> node-resolve.resolveId total call execution time: 2919ms
>> node-resolve total call execution time: 2919ms

> commonjs:
>>> commonjs.load total call execution time: 1ms
>>> commonjs.resolveId total call execution time: 2ms
>>> commonjs.transform total call execution time: 723ms
>> commonjs total call execution time: 726ms

> babel:
>>> babel.load total call execution time: 152ms
>>> babel.resolveId total call execution time: 1ms
>>> babel.transform total call execution time: 5988ms
>> babel total call execution time: 6141ms

> total execution time in all plugins: 9793ms
> file "/opt/build-context/MySite.js"
```

And here an exemple of the call execution time by file:

```
> file "/opt/build-context/MySite.js"
>>> stream-entrypoint takes 1ms to process it
>>> node-resolve takes 0ms to process it
>>> commonjs takes 0ms to process it
>>> babel takes 69ms to process it
> total call execution time: 70ms

> file "react"
>>> stream-entrypoint takes 0ms to process it
>>> node-resolve takes 25ms to process it
>>> commonjs takes 0ms to process it
>>> babel takes 0ms to process it
> total call execution time: 25ms

> file "/opt/build-context/node_modules/react/react.js"
>>> stream-entrypoint takes 0ms to process it
>>> node-resolve takes 0ms to process it
>>> commonjs takes 15ms to process it
>>> babel takes 22ms to process it
> total call execution time: 36ms

> file "commonjsHelpers"
>>> stream-entrypoint takes 2ms to process it
>>> node-resolve takes 2ms to process it
>>> commonjs takes 1ms to process it
>>> babel takes 0ms to process it
> total call execution time: 5ms

> file "./lib/React"
>>> stream-entrypoint takes 0ms to process it
>>> node-resolve takes 50ms to process it
>>> commonjs takes 0ms to process it
>>> babel takes 0ms to process it
> total call execution time: 50ms

> file "/opt/build-context/node_modules/react/lib/React.js"
>>> stream-entrypoint takes 0ms to process it
>>> node-resolve takes 0ms to process it
>>> commonjs takes 25ms to process it
>>> babel takes 73ms to process it
> total call execution time: 99ms

> file "./ReactElementValidator"
>>> stream-entrypoint takes 0ms to process it
>>> node-resolve takes 10ms to process it
>>> commonjs takes 0ms to process it
>>> babel takes 0ms to process it
> total call execution time: 10ms

> file "/opt/build-context/node_modules/react/lib/ReactElementValidator.js"
>>> stream-entrypoint takes 0ms to process it
>>> node-resolve takes 0ms to process it
>>> commonjs takes 22ms to process it
>>> babel takes 95ms to process it
> total call execution time: 117ms

> file "fbjs/lib/warning"
>>> stream-entrypoint takes 0ms to process it
>>> node-resolve takes 351ms to process it
>>> commonjs takes 0ms to process it
>>> babel takes 0ms to process it
> total call execution time: 351ms

> file "/opt/build-context/node_modules/fbjs/lib/warning.js"
>>> stream-entrypoint takes 0ms to process it
>>> node-resolve takes 0ms to process it
>>> commonjs takes 8ms to process it
>>> babel takes 40ms to process it
> total call execution time: 47ms

> file "./emptyFunction"
>>> stream-entrypoint takes 0ms to process it
>>> node-resolve takes 7ms to process it
>>> commonjs takes 0ms to process it
>>> babel takes 0ms to process it
> total call execution time: 7ms

...
```

## How to use it?

For this tools could only be used with the javascript rollup API

```javascript
/* @flow */

import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import { Monitor } from 'rollup-devtools';

export default class RollupJavascriptBundler {
    bundle(entrypointPath: string): Promise<string> {
        console.time('rollup-build');

        const entryPath = '/opt/build-context/MySite.js';

        const monitor = new Monitor();

        const rollupOptions = {
            entry: entryPath,

            plugins: [
                // Encapsulate the plugin to trace by the monitor proxy `monitor.monitorPlugin`
                monitor.monitorPlugin(nodeResolve({
                    extensions: ['.js', '.jsx'],
                    jsxnext: true,
                    main: true,
                    browser: true,
                })),

                monitor.monitorPlugin(commonjs({
                    extensions: ['.js', '.jsx'],
                })),

                monitor.monitorPlugin(babel()),
            ],
        };

        return rollup(rollupOptions).then((bundle) => {
            const result = bundle.generate({
                useStrict: true,
                format: 'umd',
                exports: 'none',
                sourceMap: false,
            });

            monitor.report(); // Generate the report.

            return result.code;
        });
    }
}
```

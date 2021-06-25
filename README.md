# exbuild

Use **esbuild** with **react-native** and **Expo Go** in development or with **react-native-web**.

**WARNING**: This is experimental and currently just a proof of concept.

Esbuild is a very fast bundler. You can use this tool to prototype react-native or react-native-web projects. It is really fast. The first build will be a little longer because the react-native code will be cached to remove the flow types, but the subsequent builds will be really fast.

The react-native-web projects will run in an HTTP development server with livereload. The react-native projects for android will run in the Expo Go app. You can use the barcode to open the project in the expo app, like a normal expo. I am sorry, iOS users, but it doesn`t work whit iOS yet. Help wanted.

## Install

```
$ npm i exbuild
```

or

```
$ npm i -g exbuild
```

## Usage

```
$ exbuild --help
Usage: exbuild <android | ios | web> [options]

Options:
  -v                        output the version number
  -p, --port <number>       port number (default: "19000")
  -m, --minify              Minify (default: false)
  -c, --clean-cache         Clean cache (default: false)
  -r, --live-reload         Live reload (default: true)
  -n, --print-config        Print internal config (default: false)
  -f, --config-file <path>  Path to a config file
  -h, --help                display help for command
```

### web

`$ exbuild web` will bundle the project and open the `dist/index.html` page in the browser in `localhost:3000`.
You can build for production with the option `-m, --minify` (`$ exbuild web -m`).

### native (android)

`$ exbuild android` will bundle the project and show a barcode in the terminal to open the app in Expo Go. If the debug option is enabled in the developer menu in the app, the debugger will be open in `http://localhost:19000/debugger-ui/`.
The app will reload every time a file is saved. To disable it use `--live-reload false`

![](console-barcode.png)

## Config

It is possible to customize the build with a config file (json or js).

The example below uses some defaults for demonstration. **They don't need to be included in a custom config file**. To see all defaults look at the file `src/config.js` or use the option `-n, --print-config`.
The custom config file (`--config-file path_to_file`) will be merged in the default config.

```javascript

module.exports = {
  android: {
    /* packages published with flow types */
    removeFlowOptions: [
      'react-native',
      '@react-native-async-storage/async-storage',
    ],
    /* alias paths */
    importMap: {
      'react-native-vector-icons/': './node_modules/@expo/vector-icons/',  // all subdirectories and files will be aliased
      'react-native-screens': './node_modules/react-native-screens/lib/module/index.native.js', // only the root will be will be aliased
    },
    /* plugins to be used bu Esbuild */
    plugins: [xxxPlugin, yyyPlugin, zzzPlugin],
    /* polifills to be included in the build */
    polyfills: [
      './node_modules/react-native/Libraries/polyfills/console.js',
      './node_modules/react-native/Libraries/polyfills/Object.es7.js',
    ],
    /* js banner to be included in the top of the build file*/
    jsBanner: [
      `var __BUNDLE_START_TIME__=this.nativePerformanceNow?nativePerformanceNow():Date.now()`,
      `var window = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;`,
    ],
    /* Esbuild options. Be careful to use these options to not compromisse the build */
    esbuildOptions: {
      target: 'es2016',
      format: 'iife',
      define: {
         'process.env.TEST_APP_ID': 'asdf',
      }
      tsconfig: 'tsconfig.json'
    },
  },
  web: {
    ...
  }
}

```

## Cache

The react-native and all others packages that have the flow types remove (removeFlowOptions) are cached in `.expo/exbuild/cache`. This cache is not invalidated automatically. Every type that you update one of these packages or include a new one in removeFlowOptions you need to clean the cache (`-c, --clean-cache`).

### Caveats

- No iOS for now
- No fast-refresh, only live-reload for web and native
- No icon and splash screen

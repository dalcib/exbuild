const child_process = require('child_process')
const fs = require('fs')
const path = require('path')
const { getIp, readJSON, mkdir } = require('./utils')

const projectRoot = process.cwd().replace(/\\/g, '/')
const projectName = projectRoot.split('/').pop()

function resolve(filePath) {
  return path.resolve(projectRoot, filePath)
}

function spawn(args) {
  var result = child_process.spawnSync('npm', args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    encoding: 'utf-8',
    shell: true,
  })
  var savedOutput = result.stdout
  console.log(String(savedOutput))
}

const index_html = `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8" />
  <meta httpequiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport"
    content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1.00001,viewport-fit=cover" />
  <title>${projectName}</title>
  <style>
    #root,
    body,
    html {min-height: 100%; width: 100%; -webkit-overflow-scrolling: touch; margin: 0; padding: 0;}
    html {scroll-behavior: smooth; -webkit-text-size-adjust: 100%; height: 100%}
    body {display: flex; overflow-y: auto; overscroll-behavior-y: none; text-rendering: optimizeLegibility; 
      -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;}
    #root {display: flex; flex: 1; flex-shrink: 0; flex-basis: auto; flex-grow: 1;}
  </style>
</head>

<body>
  <div id="root"></div>
  <script src="/index.web.js" type="module"></script>
</body>

</html>
`

const app_json = {
  expo: {
    name: projectName,
    slug: projectName,
    version: '0.1.0',
    sdkVersion: '41.0.0',
  },
}

const App_js = `
import React from 'react'
import { StyleSheet, Text, View, AppRegistry, Platform  } from 'react-native'

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

AppRegistry.registerComponent('main', () => App);
if (Platform.OS === 'web') {
    AppRegistry.runApplication('main', { rootTag: document.getElementById('root') });
}
`

function create() {
  if (!fs.existsSync(resolve('package.json'))) {
    spawn(['init -y'])
    spawn([
      'i react@16.13.1 react-dom@16.13.1 react-native-web@0.13.12 https://github.com/expo/react-native/archive/sdk-41.0.0.tar.gz exbuild',
    ])
    const pkg = JSON.parse(fs.readFileSync(resolve('package.json'), { encoding: 'utf8' }))
    pkg.main = 'App.js'
    fs.writeFileSync(resolve('package.json'), JSON.stringify(pkg, null, 2))
  }
  if (!fs.existsSync(resolve('app.json'))) {
    fs.writeFileSync(resolve('app.json'), JSON.stringify(app_json, null, 2))
  }
  if (!fs.existsSync(resolve('App.js'))) {
    fs.writeFileSync(resolve('App.js'), App_js)
  }
}

function init(platform) {
  const projectRoot = process.cwd().replace(/\\/g, '/')
  const ip = getIp()
  const pkg = readJSON('package.json')
  let app
  try {
    app = readJSON('app.json')
  } catch (e) {
    console.log('error: app.json file not found.')
    process.exit(1)
  }
  mkdir(projectRoot + '/dist')
  if (!fs.existsSync(projectRoot + '/dist/index.html') && platform === 'web') {
    fs.writeFileSync(projectRoot + '/dist/index.html', index_html)
  }
  if (platform !== 'web') {
    mkdir(projectRoot + '/.expo')
    mkdir(projectRoot + '/.expo/exbuild')
    mkdir(projectRoot + '/.expo/exbuild/cache')
  }
  return { ip, projectRoot, pkg, app }
}

module.exports = { create, init }

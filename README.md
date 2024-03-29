<div align="center">
  <h1>Axts</h1>
  <a href="#"><img src="https://img.shields.io/badge/eslint-3A33D1?style=for-the-badge&logo=eslint&logoColor=white" alt="#"></a>
  <a href="#"><img src="https://img.shields.io/badge/prettier-1A2C34?style=for-the-badge&logo=prettier&logoColor=F7BA3E" alt="#"></a>
  <a href="https://www.npmjs.com/package/axts"><img src="https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white" alt="#"></a>
</div>
<p align="center">
Transpile and run your typescript easily
</p>

<p>You can support the project:</p>
<a href="https://www.buymeacoffee.com/luas10cw" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me A Coffee" style="height: 40px !important;width: 192px !important;" ></a>

### **About**

CLI command (alternative to node) for seamlessly running TypeScript & ESM, in both commonjs & module package types.

### **Installation**
```bash
$ npm install axts -D
```

### **Usage**
```bash
$ axts src/main.ts
# or with watch mode
$ axts --watch --extensions ts,json src/main.ts
# you can also use it with commonjs
$ axts --watch --commonjs --extensions ts,json src/main.ts
```

#### IMPORTANT
When the --commonjs flag is missing.

"type": "module" is required in your package.json
```json
{
  ...
  "type": "module",
  ...
}
``````

### **Features**
- Blazing fast on-demand TypeScript & ESM compilation
- Works in both CommonJS and ESM packages
- Supports next-gen TypeScript extensions (.cts & .mts)
- Hides experimental feature warnings
- Resolves tsconfig.json paths


### **How to contribute**

If you want to contribute to the development of this project, feel free to create a GitHub account and fork this repository.


### **Releases**

For information about the latest and previous versions of this project, see the 
[releases](https://github.com/luas10c/axts/releases)
section.


If you made it through, thank you very much for this quick read.

**May the force be with you!**

📃 **License MIT**
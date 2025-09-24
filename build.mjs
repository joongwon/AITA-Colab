// stolen from https://github.com/ahk-d/ChatGPT-Google-Colab/blob/main/build.mjs

import archiver from 'archiver';
import autoprefixer from 'autoprefixer';
import * as dotenv from 'dotenv';
import esbuild from 'esbuild';
import postcssPlugin from 'esbuild-style-plugin';
import fs from 'fs-extra';
import tailwindcss from '@tailwindcss/postcss';

dotenv.config();

const outdir = 'build';

async function deleteOldDir() {
  await fs.remove(outdir);
}

async function runEsbuild() {
  await esbuild.build({
    entryPoints: ['src/content-script.tsx', 'src/background.ts', 'src/options.tsx'],
    bundle: true,
    sourcemap: "inline",
    outdir: outdir,
    treeShaking: true,
    minify: true,
    legalComments: 'none',
    define: { 'process.env.NODE_ENV': '"production"' },
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsx: 'automatic',
    loader: {
      '.png': 'dataurl',
    },
    plugins: [
      postcssPlugin({
        postcss: {
          plugins: [tailwindcss, autoprefixer],
        },
      }),
    ],
  });
}

async function zipFolder(dir) {
  const output = fs.createWriteStream(`${dir}.zip`);
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });
  archive.pipe(output);
  archive.directory(dir, false);
  await archive.finalize();
}

async function copyFiles(entryPoints, targetDir) {
  await fs.ensureDir(targetDir);
  await Promise.all(
    entryPoints.map(async (entryPoint) => {
      await fs.copy(entryPoint.src, `${targetDir}/${entryPoint.dst}`);
    }),
  );
}

async function build() {
  await deleteOldDir();
  await runEsbuild();

  const commonFiles = [
    { src: 'build/content-script.js', dst: 'content-script.js' },
    { src: 'build/content-script.css', dst: 'content-script.css' },
    { src: 'build/background.js', dst: 'background.js' },
    { src: 'build/options.js', dst: 'options.js' },
    { src: 'build/options.css', dst: 'options.css' },
    { src: 'src/options.html', dst: 'options.html' },
    { src: 'src/logo.png', dst: 'logo.png' },
  ];

  // chromium
  await copyFiles([...commonFiles, { src: 'src/manifest.json', dst: 'manifest.json' }], `./${outdir}/chromium`);

  await zipFolder(`./${outdir}/chromium`);

  /*
  // firefox
  await copyFiles([...commonFiles, { src: 'src/manifest.v2.json', dst: 'manifest.json' }], `./${outdir}/firefox`);

  await zipFolder(`./${outdir}/firefox`);
  */

  console.log('Build success.');
}

build();

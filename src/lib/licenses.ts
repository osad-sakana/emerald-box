// 本アプリが利用する OSS / フォントのライセンス情報。
export interface LicenseEntry {
  name: string
  version?: string
  license: string
  copyright: string
  url: string
}

export const LICENSES: LicenseEntry[] = [
  {
    name: 'Astro',
    license: 'MIT License',
    copyright: 'Copyright (c) 2021 Fred K. Schott',
    url: 'https://github.com/withastro/astro',
  },
  {
    name: 'Tailwind CSS',
    license: 'MIT License',
    copyright: 'Copyright (c) Tailwind Labs, Inc.',
    url: 'https://github.com/tailwindlabs/tailwindcss',
  },
  {
    name: 'Monaco Editor',
    version: '0.52.2',
    license: 'MIT License',
    copyright: 'Copyright (c) Microsoft Corporation',
    url: 'https://github.com/microsoft/monaco-editor',
  },
  {
    name: '@monaco-editor/loader',
    license: 'MIT License',
    copyright: 'Copyright (c) 2021 Suren Atoyan',
    url: 'https://github.com/suren-atoyan/monaco-loader',
  },
  {
    name: '0xProto',
    version: '2.502',
    license: 'SIL Open Font License 1.1',
    copyright: 'Copyright (c) 2026, 0xType Project Authors',
    url: 'https://github.com/0xType/0xProto',
  },
]

// MIT ライセンス本文（許諾条件・無保証条項）。各 MIT パッケージ共通。
export const MIT_LICENSE_TEXT = `Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`

// SIL Open Font License の概要（全文は OFL.txt / 配布元を参照）。
export const OFL_NOTICE_TEXT = `この Font Software は SIL Open Font License, Version 1.1 のもとで提供されています。フォントの複製・改変・再配布が可能ですが、上記の著作権およびライセンス表示を保持する必要があり、Reserved Font Name の流用は禁止されています。ライセンス全文は https://scripts.sil.org/OFL を参照してください。`

import { describe, expect, it } from 'vitest'
import { findTagToClose } from './auto-close-tag'

// `|` の位置がカーソル（`>` の直後）。前後に分割して判定関数へ渡す。
const run = (source: string) => {
  const [before, after = ''] = source.split('|')
  return findTagToClose(before, after)
}

describe('findTagToClose: 閉じタグを返すケース', () => {
  it.each([
    ['基本のタグ', '<div>|', 'div'],
    ['属性付き', '<a href="x">|', 'a'],
    ['属性値に > を含む（ダブルクォート）', '<div title="a>b">|', 'div'],
    ['属性値に > を含む（シングルクォート）', "<div title='a>b'>|", 'div'],
    ['開始タグが複数行にまたがる', '<div\n  class="x"\n  id="y">|', 'div'],
    ['大文字小文字は入力のまま保つ', '<DIV>|', 'DIV'],
    ['カスタム要素', '<my-card>|', 'my-card'],
    ['名前空間つきの名前', '<svg:rect>|', 'svg:rect'],
    ['入れ子の内側', '<ul>\n  <li>|', 'li'],
    ['前に別の完結したタグがある', '<p>a</p><span>|', 'span'],
    ['後ろに別の内容がある', '<div>|<p>x</p>', 'div'],
    ['script の開始タグ自体は閉じる', '<script>|', 'script'],
    ['閉じ済みの script の後ろ', '<script>a<b</script><div>|', 'div'],
    ['閉じ済みのコメントの後ろ', '<!-- a --><div>|', 'div'],
    ['直後が別名の閉じタグ', '<div>|</span>', 'div'],
    ['空コメント <!--> の後ろ', '<!--><div>|', 'div'],
    ['空コメント <!---> の後ろ', '<!---><div>|', 'div'],
    ['大文字で閉じた script の後ろ', '<script>a</SCRIPT><div>|', 'div'],
    ['自己閉じ script は内側扱いにしない', '<script/><div>|', 'div'],
    ['直後が名前の続く別名の閉じタグ', '<a.b>|</a.bc>', 'a.b'],
  ])('%s', (_name, source, expected) => {
    expect(run(source)).toBe(expected)
  })
})

describe('findTagToClose: 閉じないケース', () => {
  it.each([
    ['空文字', ''],
    ['タグの外の >', 'a >|'],
    ['タグの外の > （比較演算子風）', 'x > y >|'],
    ['閉じタグ', '</div>|'],
    ['自己閉じタグ', '<x />|'],
    ['自己閉じタグ（スペースなし）', '<x/>|'],
    ['DOCTYPE', '<!DOCTYPE html>|'],
    ['コメント', '<!-- a -->|'],
    ['処理命令', '<?xml version="1.0"?>|'],
    ['数字始まりでタグ名にならない', '<1>|'],
    ['タグ名がない', '<>|'],
    ['直後に同名の閉じタグ', '<div>|</div>'],
    ['直後に同名の閉じタグ（大文字小文字違い）', '<div>|</DIV>'],
    ['未閉鎖コメントの中', '<!-- <div>|'],
    ['script の中', '<script>if (a<b>|'],
    ['style の中', '<style>a<b>|'],
    ['textarea の中', '<textarea><div>|'],
    ['title の中', '<title><b>|'],
    ['名前の続く閉じタグでは script は閉じない', '<script>x</scriptx><div>|'],
    ['閉じていないクォート内の >', '<div class="a>|'],
    ['タグ名が非 ASCII で途切れる', '<my-élément>|'],
    ['タグ名が記号で途切れる', '<a$>|'],
    ['タグ名が日本語で途切れる', '<div日本>|'],
  ])('%s', (_name, source) => {
    expect(run(source)).toBeNull()
  })

  it.each([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'source',
    'track',
    'wbr',
  ])('void 要素 <%s> は閉じない', (name) => {
    expect(run(`<${name}>|`)).toBeNull()
    expect(run(`<${name.toUpperCase()} class="x">|`)).toBeNull()
  })
})

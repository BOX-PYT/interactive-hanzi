# Interactive Hanzi

基于 p5.js 的交互式汉字动效。鼠标或手指触碰屏幕时，汉字笔画会被"推开"并弹回，形成流体变形效果。

## 效果

- 默认展示「不」「知」「道」三个汉字，垂直排列
- 光标/触点在笔画附近滑动时，笔画粒子向外扩散
- 松手后笔画缓慢弹回原位
- 支持触屏设备（移动端）
- 点击左上角「编辑」按钮可自定义显示文字

## 实现原理

- 笔画数据来自 [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data)（CDN 实时拉取）
- 每个笔画被采样为粒子点，实时计算与光标的距离并施加推力
- 辅助的 FloatHand 动画在笔画路径上漂浮，增强视觉层次

## 参考

灵感来自 [Raven Kwok](http://ravenkwok.com/) 的作品**《互动字体演示——随时待命的光标牛马》**，原版用 Processing 实现。核心思路相同：将汉字笔画分解为粒子，由多个光标实时扰动。本项目以 p5.js 重新实现，并适配移动端触屏。

原作链接：http://xhslink.com/o/9UX959w0YqF

## 运行

无需构建，直接在浏览器中打开 `index.html`。

```
open index.html
```

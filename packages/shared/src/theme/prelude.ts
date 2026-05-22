// 用于 index.html 的内联 <script>：把这个字符串嵌入即可
export const themePreludeScript = `
(function () {
  try {
    var key = 'maill.theme';
    var mode = localStorage.getItem(key) || 'system';
    var isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

# toy-react
参考链接：
提前安装 Node.js、npm 环境： https://nodejs.org/en/
webpack： https://webpack.js.org/guides/getting-started/
React Tutorial 教程： https://reactjs.org/tutorial/tutorial.html
TicTacToe： https://codepen.io/gaearon/pen/gWWZgR
MDN： https://developer.mozilla.org/en-US/

# 基于实 DOM 体系的 toy-react 的 component 的设定
jsx是react最主要的特性。
通过阅读Babel官网，知道了@babel/plugin-transform-react-jsx这个插件有两种编译jsx的方式，一个是运行时编译（React Automatic Runtime），另一个是手动引入React.createElement的方式（React Classic Runtime），这解释了困扰我的两个问题：1、为什么定义了createElement方法却没有调用？2、为什么render方法里父节点要接收一个component.root作为参数而不是component？
1、因为babel jsx转换插件是“运行时编译”且pagram参数为createElement，所以代码编译时会自动解析jsx并调用createElement方法。
2、同样是由于babel jsx插件的“运行时”编译，调用createElement方法后会实例化一个Component对象，该对象初始root为null，从而会调用render方法（即MyComponent中的render方法），该方法返回一个JSX，从而又会调用createElement方法，此时是一个真实的DOM节点，所以会初始化一个ElementWrapper对象，该对象包含一个root属性，这时root就不为null了，而是一个div。
配置webpack打包環境。npm init -> npm install webpack webpack-cli --save-dev




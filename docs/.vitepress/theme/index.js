import DefaultTheme from 'vitepress/theme'
import GiscusComment from './GiscusComment.vue'
import './custom.css'

export default DefaultTheme

DefaultTheme.enhanceApp = ({ app }) => {
  app.component('GiscusComment', GiscusComment)
}

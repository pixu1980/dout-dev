// Import main css
import '~/assets/style/index.scss'
import head from './head.js';

// Import default layout so we don't need to import it to every page
import DefaultLayout from '~/layouts/Default.vue'

// The Client API can be used here. Learn more: gridsome.org/docs/client-api
export default function (Vue, {
  head: vueHead,
  // router, isClient
}) {
  head(vueHead);


  // Set default layout as a global component
  Vue.component('Layout', DefaultLayout)
}

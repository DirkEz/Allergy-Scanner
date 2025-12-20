import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
    faBarcode,
    faCamera,
    faCircleNotch,
    faHashtag,
    faTriangleExclamation,
    faDatabase,
    faClipboardCheck,
    faCircleCheck,
    faCircleXmark,
    faCircleQuestion,
    faCircleInfo,
    faList,
    faLeaf,
    faCrosshairs,
    faRotateRight,
    faBroom,
    faLightbulb,
    faMagicWandSparkles,
} from '@fortawesome/free-solid-svg-icons'

library.add(
    faBarcode,
    faCamera,
    faCircleNotch,
    faHashtag,
    faTriangleExclamation,
    faDatabase,
    faClipboardCheck,
    faCircleCheck,
    faCircleXmark,
    faCircleQuestion,
    faCircleInfo,
    faList,
    faLeaf,
    faCrosshairs,
    faRotateRight,
    faBroom,
    faLightbulb,
    faMagicWandSparkles,
)

const app = createApp(App)

app.use(router)

app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app')

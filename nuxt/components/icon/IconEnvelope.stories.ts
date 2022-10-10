import { defineComponent } from 'vue'
import IconEnvelope from './IconEnvelope.vue'

const argTypes = { click: { action: 'click' } }
type ArgTypesType = { argTypes: typeof argTypes }

export default {
  component: IconEnvelope,
  title: 'icon/IconEnvelope',
  argTypes,
}

const Template = (_: never, { argTypes }: ArgTypesType) =>
  defineComponent({
    components: { IconEnvelope },
    props: Object.keys(argTypes),
    template:
      '<IconEnvelope v-bind="$props" @click="click">IconEnvelope</IconEnvelope>',
  })

export const Default = Template.bind({})

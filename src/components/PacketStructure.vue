<template>
  <div class="packet-structure">
    <template v-for="color in [['primary', 'color-1', 'color-2', 'color-3', 'color-4'][(level | 0) % 4]]">
        <div :class="'badge ' + color" :key="id + '-' + color + '-badge'">{{ title }}</div>
        <div :class="'mt-2 list ' + color" :key="id + '-' + color +  + '-list'">
            <template v-for="(fielddata, index) in structure">
                <div v-for="(field, fieldType) in fielddata" :class="'text-center list-item ' + color" :key="id + '-' + index + '-' + fieldType">
                    <template v-if="typeof field === 'string'"><span :class="'badge ' + color">{{ fieldType }}</span> {{ field }}</template>
                    <template v-else>
                        <PacketStructure :structure="field" :title="fieldType" :level="(level | 0) + 1" :id="id + '-' + index + '-' + fieldType + '-substructure'" />
                    </template>
                </div>
            </template>
        </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'PacketStructure',
  props: {
    id: String,
    title: String,
    structure: Array,
    level: Number,
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
</style>

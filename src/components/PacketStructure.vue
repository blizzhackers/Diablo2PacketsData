<template>
  <div>
    <template v-for="color in [['primary', 'info', 'success', 'warning', 'danger', 'secondary'][(level | 0) % 6]]">
        <div :class="'badge badge-' + color" :key="id + '-' + color + '-badge'">{{ title }}</div>
        <div class="list-group" :key="id + '-' + color +  + '-list'">
            <template v-for="(fielddata, index) in structure">
                <div v-for="(field, fieldType) in fielddata" :class="'text-center list-group-item list-group-item-' + color" :key="id + '-' + index + '-' + fieldType">
                    <template v-if="typeof field === 'string'"><span :class="'badge badge-' + color">{{ fieldType }}</span> {{ field }}</template>
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

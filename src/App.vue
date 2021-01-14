<template>
  <div class="card">
    <h1 class="card-header text-center">D2 Packet Browser</h1>
    <div class="card-body">
        <h5 class="text-center">Visit our <a href="https://github.com/blizzhackers/Diablo2PacketsData" target="_blank" class="badge badge-pill badge-primary">GitHub Repository</a> to contribute!</h5>
        <div class="input-group mb-3">
            <div class="input-group-prepend">
                <span class="input-group-text">Search</span>
            </div>
            <input type="text" v-model="filterText" class="form-control" placeholder="Type to search packets...">
        </div>
        <div class="btn-toolbar mb-3">
            <div v-for="(filters, groupName) in filterOptions" :class="'mr-2 p-1 border border-2 rounded ' + (anyFiltersEnabled(groupName) ? 'border-success' : 'border-danger')" :key="groupName">
                <button v-for="(filterValue, filterName) in filters" :key="filterName" :class="'btn mr-1 btn-' + ['secondary', 'success'][filterValue | 0]" @click="filters[filterName] = !filterValue">{{ filterName }} <span class="badge badge-light">{{ filterValue ? 'Show' : 'Hide' }}</span></button>
            </div>
        </div>
        <div class="accordion">
            <div v-for="packet in filteredAndSortedPackets" class="card" :data-relevance="packet.relevance" :key="attrSafeName(packet.Source, packet.Name, packet['Game Version'])">
                <template v-for="local in [{body_id: attrSafeName(packet.Source, packet.Name, packet['Game Version'])}]">
                    <div class="card-header" :key="local.body_id + '-packet-header'">
                        <span class="badge badge-secondary">{{ packet.PacketId }}</span> <a :href="'#' + local.body_id" data-toggle="collapse" aria-expanded="false" class="text-secondary">{{ packet.Name }}</a>
                    </div>
                    <div class="card-body collapse" :id="local.body_id" :key="local.body_id + '-packet-body'">
                        <div class="row mb-3">
                            <template v-for="(column, columnIndex) in columns.filter(v => !['Description', 'Structure'].includes(v))">
                                <div class="col-auto" :key="columnIndex"><span class="badge badge-primary">{{ column }}</span> {{ packet[column] }}</div>
                            </template>
                        </div>
                        <template v-if="packet.Description">
                            <div class="badge badge-primary">Description</div>
                            <p style="white-space: pre">{{ packet.Description }}</p>
                        </template>
                        <PacketStructure v-if="packet.Structure" :structure="packet.Structure" title="Structure" :id="local.body_id + '-packet-structure'" />
                    </div>
                </template>
            </div>
        </div>
    </div>
  </div>
</template>

<script>

function duplicateObject(obj) {
    return JSON.parse(JSON.stringify(obj));
}

import PacketStructure from './components/PacketStructure.vue';
import Packets_client2gs_1_14d from './data/1.14d/client2gs.json';
import Packets_client2mcps_1_14d from './data/1.14d/client2mcps.json';
import Packets_client2sid_1_14d from './data/1.14d/client2sid.json';
import Packets_gs2client_1_14d from './data/1.14d/gs2client.json';
import Packets_mcps2client_1_14d from './data/1.14d/mcps2client.json';
import Packets_sid2client_1_14d from './data/1.14d/sid2client.json';

import Packets_client2sid_1_13c from './data/1.13c/client2sid.json';
import Packets_gs2client_1_13c from './data/1.13c/gs2client.json';

let packetSources = [
    ['client', 'd2gs', '1.14d', Packets_client2gs_1_14d],
    ['client', 'mcp', '1.14d', Packets_client2mcps_1_14d],
    ['client', 'sid', '1.14d', Packets_client2sid_1_14d],
    ['server', 'd2gs', '1.14d', Packets_gs2client_1_14d],
    ['server', 'mcp', '1.14d', Packets_mcps2client_1_14d],
    ['server', 'sid', '1.14d', Packets_sid2client_1_14d],
    ['client', 'd2gs', '1.13c', Packets_client2gs_1_14d],
    ['client', 'mcp', '1.13c', Packets_client2mcps_1_14d],
    ['client', 'sid', '1.13c', Packets_client2sid_1_13c],
    ['server', 'd2gs', '1.13c', Packets_gs2client_1_13c],
    ['server', 'mcp', '1.13c', Packets_mcps2client_1_14d],
    ['server', 'sid', '1.13c', Packets_sid2client_1_14d],
];

export default {
  name: 'App',
  components: {
    PacketStructure
  },
  data() {
    return {
      columns: [],
      packets: [],
      filterOptions: {
        source: {
          client: true,
          server: true,
        },
        type: {
          d2gs: true,
          mcp: true,
          sid: true,
        },
        version: {
          '1.14d': true,
          '1.13c': false,
        }
      },
      filterText: '',
    };
  },
    methods: {
        attrSafeName(...args) {
            return args.map(v => v.match(/[a-z0-9]+/gi).map(v => v.toLowerCase()).join('-')).join('-');
        },
        anyFiltersEnabled(group) {
            return Object.values(this.filterOptions[group]).some(Boolean);
        }
    },
    computed: {
        filteredAndSortedPackets: function () {
            let packets = this.packets.slice(), maxrelevance = -1;

            packets = packets.filter(packet => {
                packet.relevance = 0;

                if (!this.filterOptions.source[packet.Source]) {
                    return false;
                }

                if (!this.filterOptions.type[packet.Type]) {
                    return false;
                }

                if (!this.filterOptions.version[packet['Game Version']]) {
                    return false;
                }

                return true;
            });

            if (this.filterText.length) {
                let terms = this.filterText.toLowerCase().split(/\s+/).filter(Boolean);

                if (terms.length) {
                    maxrelevance = 0;

                    packets.forEach(packet => {
                        terms.forEach(term => {
                            packet.relevance += Math.min(1, packet.searchText.toLowerCase().split(term).length - 1);
                            maxrelevance = Math.max(maxrelevance, packet.relevance);
                        });
                    });

                    packets.forEach(packet => {
                        packet.relevance /= maxrelevance;
                    });
                }
            }

            packets = packets.filter(packet => maxrelevance < 0 || packet.relevance > 0);

            return packets.sort((a, b) => {
                let aid = a.PacketId | 0;
                let bid = b.PacketId | 0;

                if (maxrelevance >= 0 && a.relevance != b.relevance) {
                    return b.relevance - a.relevance;
                }

                if (aid !== bid) {
                    return aid - bid;
                }

                if (a.Name !== b.Name) {
                    return a.Name < b.Name ? -1 : 1;
                }

                if (a.Source !== b.Source) {
                    return a.Source < b.Source ? -1 : 1;
                }

                return 0;
            });
        },
    },
    created: async function () {
        for (let [source, type, version, data] of packetSources) {
            data = duplicateObject(data);
    
            for (let key in data) {
                data[key] = Object.assign({
                    Name: key,
                    Source: source,
                    Type: type,
                    'Game Version': version,
                }, data[key]);
                this.packets.push(data[key]);
    
                for (let column in data[key]) {
                    if (!this.columns.includes(column)) {
                        this.columns.push(column);
                    }
                }

                data[key].searchText = JSON.stringify(data[key]).match(/[a-z0-9_]+/gi).join(' ');
            }
        }
    
        this.active = true;
    },
}
</script>

<style lang="scss">

@import url('https://fonts.googleapis.com/css2?family=Inconsolata:wght@200;300;400;500;600;700;800;900&display=swap');
@import "./styles/bootstrap-4.5.3/scss/bootstrap.scss";

html, body {
    font-family: 'Inconsolata', monospace;
    font-size: 18px;
}

#components {
    display: none;
}

.collapsing {
    transition: none !important;
}

.border-2 {
    border-width: 2px !important;
}

</style>

<template>
    <div :class="'app ' + (dark ? 'dark' : 'light')">
        <a class="light theme-button" @click="toggleTheme">{{ dark ? 'Use Light Mode' : 'Use Dark Mode' }}</a>
        <div class="app-content-wrapper my-5 container">
            <div class="app-content">
                <h1 class="text-center">D2 Packet Browser</h1>
                <h5 class="text-center">Visit our <a href="https://github.com/blizzhackers/Diablo2PacketsData" target="_blank" class="button primary pill">GitHub Repository</a> to contribute!</h5>
                <div class="search-input">
                    <input type="text" v-model="filterText" placeholder="Type to search packets...">
                </div>
                <div class="filter-input row">
                    <div v-for="(filters, groupName) in filterOptions" :class="'filter-input-group border col-auto p-1 ' + (anyFiltersEnabled(groupName) ? 'success' : 'danger')" :key="groupName">
                        <button v-for="(filterValue, filterName) in filters" :key="filterName" :class="'filter-button ' + ['secondary', 'success'][filterValue | 0]" @click="filters[filterName] = !filterValue">{{ filterName }} <span class="badge inner">{{ filterValue ? 'Show' : 'Hide' }}</span></button>
                    </div>
                </div>
                <div class="results">
                    <div v-for="packet in filteredAndSortedPackets" class="result" :data-relevance="packet.relevance" :key="attrSafeName(packet.Source, packet.Name, packet['Game Version'])">
                        <template v-for="local in [{body_id: attrSafeName(packet.Source, packet.Name, packet['Game Version'])}]">
                            <div :key="local.body_id + '-packet-header'" class="result-title background">
                                <span class="badge secondary">{{ packet.PacketId }}</span> <a href="javascript:;" @click="togglePacket(packet)" :aria-expanded="packet.open ? 'true' : 'false'" class="secondary">{{ packet.Name }}</a>
                            </div>
                            <div :class="packet.state.open ? 'result-details drawer' : 'drawer closed'" :id="local.body_id" :key="local.body_id + '-packet-body'">
                                <div class="field-row row">
                                    <template v-for="(column, columnIndex) in columns.filter(v => !['Description', 'Structure'].includes(v))">
                                        <div class="col-auto field" :key="columnIndex"><span class="badge primary">{{ column }}</span> {{ packet[column] }}</div>
                                    </template>
                                </div>
                                <template v-if="packet.Description">
                                    <div class="badge primary">Description</div>
                                    <p style="white-space: pre">{{ packet.Description }}</p>
                                </template>
                                <PacketStructure v-if="packet.Structure" :structure="packet.Structure" title="Structure" :id="local.body_id + '-packet-structure'" />
                            </div>
                        </template>
                    </div>
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

import Packets_client2gs_1_15 from './data/1.15/client2gs.json';
import Packets_gs2client_1_15 from './data/1.15/gs2client.json';

let packetSources = [
    ['client', 'd2gs', '1.15', Packets_client2gs_1_15],
    ['client', 'mcp', '1.15', Packets_client2mcps_1_14d],
    ['client', 'sid', '1.15', Packets_client2sid_1_14d],
    ['server', 'd2gs', '1.15', Packets_gs2client_1_15],
    ['server', 'mcp', '1.15', Packets_mcps2client_1_14d],
    ['server', 'sid', '1.15', Packets_sid2client_1_14d],
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
        dark: this.getCookie('darkMode'),
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
                '1.15': true,
                '1.14d': false,
                '1.13c': false,
            }
        },
        filterText: '',
        };
    },
    methods: {
        setCookie(name, value) {
            document.cookie = name + "=" + JSON.stringify(value) + "; expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/";
        },
        deleteCookie(name) {
            document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
        },
        getCookie(name) {
            let cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                let item = cookie.trimStart().split('=');

                if (item[0] === name) {
                    if (item[0].length) {
                        return JSON.parse(item[1]);
                    } else {
                        return null;
                    }
                }
            }

            return null;
        },
        toggleTheme() {
            this.dark = !this.dark;
            this.setCookie('darkMode', this.dark);
        },
        attrSafeName(...args) {
            return args.map(v => v.match(/[a-z0-9]+/gi).map(v => v.toLowerCase()).join('-')).join('-');
        },
        anyFiltersEnabled(group) {
            return Object.values(this.filterOptions[group]).some(Boolean);
        },
        togglePacket: function (packet) {
            packet.state.open = !packet.state.open;
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
                    searchText: JSON.stringify(data[key]).match(/[a-z0-9_]+/gi).join(' '),
                    state: {
                        open: false,
                    },
                }, data[key]);
                this.packets.push(data[key]);

                for (let column in data[key]) {
                    if (!this.columns.includes(column) && ![
                        'searchText',
                        'state'
                    ].includes(column)) {
                        this.columns.push(column);
                    }
                }
            }
        }

        this.active = true;
    },
}
</script>

<style lang="scss">

@import "styles/base";

</style>

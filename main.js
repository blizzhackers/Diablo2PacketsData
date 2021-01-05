(elem => {
    if (elem) {
        for (let i = 0; i < elem.children.length; i++) {
            let comp = {};

            if (elem.children[i].getAttribute('props')) {
                comp.props = elem.children[i].getAttribute('props').split(',').map(v => v.trim());
            }

            comp.template = '<div>' + elem.children[i].innerHTML + '</div>';

            Vue.component(elem.children[i].id, comp);
        }
    }
})(document.getElementById('components'));

let app = new Vue({
    el: '#app',
    data: {
        active: false,
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
            let packets = this.packets.slice(), maxrelevance = -1, possiblerelevance = -1;

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
                    possiblerelevance = terms.length;
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
        for (let [source, type, version, data] of [
            ['client', 'd2gs', '1.14d', fetch('1.14d/client2gs.json').then(data => data.json())],
            ['client', 'mcp', '1.14d', fetch('1.14d/client2mcps.json').then(data => data.json())],
            ['client', 'sid', '1.14d', fetch('1.14d/client2sid.json').then(data => data.json())],
            ['server', 'd2gs', '1.14d', fetch('1.14d/gs2client.json').then(data => data.json())],
            ['server', 'mcp', '1.14d', fetch('1.14d/mcps2client.json').then(data => data.json())],
            ['server', 'sid', '1.14d', fetch('1.14d/sid2client.json').then(data => data.json())],
            ['client', 'd2gs', '1.13c', fetch('1.14d/client2gs.json').then(data => data.json())],
            ['client', 'mcp', '1.13c', fetch('1.14d/client2mcps.json').then(data => data.json())],
            ['client', 'sid', '1.13c', fetch('1.14d/client2sid.json').then(data => data.json())],
            ['server', 'd2gs', '1.13c', fetch('1.13c/gs2client.json').then(data => data.json())],
            ['server', 'mcp', '1.13c', fetch('1.14d/mcps2client.json').then(data => data.json())],
            ['server', 'sid', '1.13c', fetch('1.14d/sid2client.json').then(data => data.json())],
        ]) {
            while (data.then) {
                data = await data;
            }
    
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
});

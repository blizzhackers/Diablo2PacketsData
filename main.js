let app = new Vue({
    el: '#app',
    data: {
        active: false,
        columns: [],
        packets: [],
        filterText: '',
    },
    methods: {
        attrSafeName(...args) {
            return args.map(v => v.match(/[a-z0-9]+/gi).map(v => v.toLowerCase()).join('-')).join('-');
        },
    },
    computed: {
        filteredAndSortedPackets: function () {
            let packets = this.packets.slice(), maxrelevance = -1;

            if (this.filterText.length) {
                let terms = this.filterText.toLowerCase().split(/\s+/).filter(Boolean);

                if (terms.length) {
                    maxrelevance = 0;

                    packets.forEach(packet => {
                        packet.relevance = 0;

                        terms.forEach(term => {
                            [
                                packet.Name || '',
                                packet.Source || '',
                                packet.PacketId || '',
                                packet.Description || '',
                                packet.Structure.map(field => Object.values(field).join(' ')).join(' ') || '',
                            ].forEach(field => {
                                packet.relevance += field.toLowerCase().split(term).length - 1;
                                maxrelevance = Math.max(maxrelevance, packet.relevance);
                            });
                        });
                    });

                    packets.forEach(packet => {
                        packet.relevance /= maxrelevance;
                    });
                }
            }

            packets = packets.filter(packet => {
                if (this.filterText.length < 1) {
                    return true;
                }

                return maxrelevance < 0 || (maxrelevance > 0 && packet.relevance > 0);
            });

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
        for (let [source, data] of [
            ['client', fetch('client2gs.json').then(data => data.json())],
            ['client', fetch('client2mcps.json').then(data => data.json())],
            ['client', fetch('client2sid.json').then(data => data.json())],
            ['server', fetch('gs2client.json').then(data => data.json())],
            ['server', fetch('mcps2client.json').then(data => data.json())],
            ['server', fetch('sid2client.json').then(data => data.json())],
        ]) {
            while (data.then) {
                data = await data;
            }
    
            for (let key in data) {
                data[key] = Object.assign({Name: key, Source: source}, data[key]);
                this.packets.push(data[key]);
    
                for (let column in data[key]) {
                    if (!this.columns.includes(column)) {
                        this.columns.push(column);
                    }
                }
            }
        }
    
        this.active = true;
    },
});

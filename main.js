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
            return this.packets.slice().filter(packet => {
                if (this.filterText.length < 1) {
                    return true;
                }

                return [
                    packet.Name || '',
                    packet.Source || '',
                    packet.PacketId || '',
                    packet.Description || '',
                ].some(value => value.toString().toLowerCase().includes(this.filterText.toLowerCase()));
            }).sort((a, b) => {
                let aid = a.PacketId | 0;
                let bid = b.PacketId | 0;

                if (aid !== bid) { // Primary Sort
                    return aid - bid;
                }

                if (a.Name !== b.Name) { // Secondary Sort
                    return a.Name < b.Name ? -1 : 1;
                }

                if (a.Source !== b.Source) { // Tertiary Sort
                    return a.Source < b.Source ? -1 : 1;
                }

                return 0;
            });
        },
    },
    created: async function () {
        for (let [source, data] of [
            ['client', fetch('https://api.blizzhackers.dev/json/Diablo2PacketsData/client2gs.json').then(data => data.json())],
            ['client', fetch('https://api.blizzhackers.dev/json/Diablo2PacketsData/client2mcps.json').then(data => data.json())],
            ['client', fetch('https://api.blizzhackers.dev/json/Diablo2PacketsData/client2sid.json').then(data => data.json())],
            ['server', fetch('https://api.blizzhackers.dev/json/Diablo2PacketsData/gs2client.json').then(data => data.json())],
            ['server', fetch('https://api.blizzhackers.dev/json/Diablo2PacketsData/mcps2client.json').then(data => data.json())],
            ['server', fetch('https://api.blizzhackers.dev/json/Diablo2PacketsData/sid2client.json').then(data => data.json())],
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

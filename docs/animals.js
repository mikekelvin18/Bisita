// Animals you can search for. Each one lists only places it is legal and public
// to share: zoos, breeding and research centers, and whole nature reserves. A
// reserve is shown as the reserve, never where an animal in it was seen, because
// telling people where wild animals are helps poachers.
// cam: a public live camera page, or null when we don't know of one.
// kind: zoo | center | reserve
window.ANIMAL_KINDS = { zoo: "Zoo", center: "Breeding center", reserve: "Wild reserve" };
window.ANIMALS = [
  {
    id: "giant-panda", name: "Giant panda", plural: "giant pandas", sci: "Ailuropoda melanoleuca",
    photo: { src: "giant-panda.jpg", author: "J. Patrick Fischer", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0", page: "https://commons.wikimedia.org/wiki/File:Grosser_Panda.JPG" },
    words: ["panda", "pandas", "giant panda", "bear", "da xiong mao", "大熊猫", "熊猫"],
    status: "Vulnerable (IUCN Red List). About 1,900 live in the wild, all in the mountains of Sichuan, Shaanxi and Gansu in China.",
    rule: "Bisita shows zoos, breeding centers and whole reserves. It never shows where a wild panda is.",
    asOf: "Pandas move when a loan from China ends, so check before you go (list checked 2026).",
    camNote: "The cam opens on its own page. We couldn't test the link before publishing, so it may have moved.",
    sites: [
      // China: where most pandas live
      { name: "Chengdu Research Base of Giant Panda Breeding", short: "Chengdu Panda Base", kind: "center", city: "Chengdu, Sichuan", country: "China", lat: 30.733, lon: 104.146,
        note: "The best-known panda center in the world, with adults, cubs and a nursery. Many of the iPanda live cams film here.",
        cam: { name: "iPanda live cams", url: "https://www.ipanda.com/" } },
      { name: "Shenshuping Base, Wolong", short: "Shenshuping", kind: "center", city: "Wolong, Sichuan", country: "China", lat: 30.99, lon: 103.27,
        note: "A base of the China Conservation and Research Center for the Giant Panda, deep in the mountains where pandas are trained to return to the wild.",
        cam: { name: "iPanda live cams", url: "https://www.ipanda.com/" } },
      { name: "Bifengxia Base", short: "Bifengxia", kind: "center", city: "Ya'an, Sichuan", country: "China", lat: 30.07, lon: 103.03,
        note: "A large breeding base in a forested gorge. Many pandas that return from zoos abroad live here.",
        cam: { name: "iPanda live cams", url: "https://www.ipanda.com/" } },
      { name: "Dujiangyan Base", short: "Dujiangyan", kind: "center", city: "Dujiangyan, Sichuan", country: "China", lat: 31.03, lon: 103.58,
        note: "The panda hospital and disease-control base, also home to older pandas.",
        cam: { name: "iPanda live cams", url: "https://www.ipanda.com/" } },
      { name: "Wolong National Nature Reserve", short: "Wolong Reserve", kind: "reserve", city: "Sichuan", country: "China", lat: 30.95, lon: 103.15,
        note: "One of the oldest panda reserves, about 2,000 km² of forest and peaks. Wild pandas live across the whole reserve.", cam: null },
      { name: "Tangjiahe National Nature Reserve", short: "Tangjiahe Reserve", kind: "reserve", city: "Qingchuan, Sichuan", country: "China", lat: 32.6, lon: 104.8,
        note: "A remote reserve in northern Sichuan, known for its wild pandas, takins and golden monkeys.", cam: null },
      { name: "Foping National Nature Reserve", short: "Foping Reserve", kind: "reserve", city: "Qinling Mountains, Shaanxi", country: "China", lat: 33.7, lon: 107.8,
        note: "Home to Qinling pandas, a slightly smaller kind with brown and white fur in some animals.", cam: null },
      { name: "Qinling Giant Panda Research Center", short: "Qinling Center", kind: "center", city: "Zhouzhi, Shaanxi", country: "China", lat: 34.06, lon: 108.33,
        note: "Cares for Qinling pandas, including rescued wild ones.", cam: null },
      { name: "Beijing Zoo", kind: "zoo", city: "Beijing", country: "China", lat: 39.94, lon: 116.33, note: "Has kept pandas since 1955.", cam: null },
      { name: "Chongqing Zoo", kind: "zoo", city: "Chongqing", country: "China", lat: 29.50, lon: 106.51, note: "One of China's biggest panda groups outside Sichuan.", cam: null },
      { name: "Shanghai Wild Animal Park", short: "Shanghai Park", kind: "zoo", city: "Shanghai", country: "China", lat: 31.06, lon: 121.72, note: "A large safari-style park with a panda house.", cam: null },
      { name: "Ocean Park", kind: "zoo", city: "Hong Kong", country: "China", lat: 22.246, lon: 114.176, note: "Home to several pandas, including twins born here in 2024.", cam: null },
      { name: "Giant Panda Pavilion, Seac Pai Van Park", short: "Macau Panda Pavilion", kind: "zoo", city: "Macau", country: "China", lat: 22.12, lon: 113.56, note: "A pavilion built for pandas on Coloane island.", cam: null },
      // Asia and the Pacific
      { name: "Taipei Zoo", kind: "zoo", city: "Taipei", country: "Taiwan", lat: 24.998, lon: 121.581, note: "Home to Yuan Yuan and her cubs born at the zoo.", cam: null },
      { name: "Everland", kind: "zoo", city: "Yongin", country: "South Korea", lat: 37.29, lon: 127.20, note: "Panda World is home to a family, including twins born here in 2023.", cam: null },
      { name: "Zoo Negara", kind: "zoo", city: "Kuala Lumpur", country: "Malaysia", lat: 3.21, lon: 101.76, note: "Malaysia's national zoo, with a panda pair and their young.", cam: null },
      { name: "River Wonders", kind: "zoo", city: "Singapore", country: "Singapore", lat: 1.404, lon: 103.79, note: "Pandas live in a cooled forest house by the river.", cam: null },
      { name: "Taman Safari Bogor", kind: "zoo", city: "Bogor, West Java", country: "Indonesia", lat: -6.716, lon: 106.95, note: "Indonesia's panda pair lives in a mountain palace exhibit.", cam: null },
      { name: "Adelaide Zoo", kind: "zoo", city: "Adelaide", country: "Australia", lat: -34.912, lon: 138.606, note: "The only pandas in the Southern Hemisphere. A new pair arrived in 2024.", cam: null },
      { name: "Panda House, Al Khor Park", short: "Al Khor Park", kind: "zoo", city: "Al Khor", country: "Qatar", lat: 25.68, lon: 51.50, note: "The first pandas in the Middle East, since 2022.", cam: null },
      // Europe
      { name: "Moscow Zoo", kind: "zoo", city: "Moscow", country: "Russia", lat: 55.761, lon: 37.578, note: "A pair and their cub Katyusha, born here in 2023.", cam: null },
      { name: "Copenhagen Zoo", kind: "zoo", city: "Copenhagen", country: "Denmark", lat: 55.672, lon: 12.521, note: "Pandas live in a yin-yang shaped house.", cam: null },
      { name: "Zoo Berlin", kind: "zoo", city: "Berlin", country: "Germany", lat: 52.508, lon: 13.338, note: "Germany's only pandas, including twins born in 2024.", cam: null },
      { name: "Ouwehands Dierenpark", short: "Ouwehands", kind: "zoo", city: "Rhenen", country: "Netherlands", lat: 51.957, lon: 5.581, note: "Pandasia, a garden built for the zoo's panda family.", cam: null },
      { name: "Pairi Daiza", kind: "zoo", city: "Brugelette", country: "Belgium", lat: 50.585, lon: 3.888, note: "A large Chinese garden is home to the zoo's pandas.", cam: null },
      { name: "ZooParc de Beauval", short: "Beauval", kind: "zoo", city: "Saint-Aignan", country: "France", lat: 47.248, lon: 1.352, note: "France's pandas. Some of them were due to go back to China, so check before you go.", cam: null },
      { name: "Zoo Aquarium de Madrid", short: "Madrid Zoo", kind: "zoo", city: "Madrid", country: "Spain", lat: 40.408, lon: -3.763, note: "A new pair arrived in 2024.", cam: null },
      // The Americas
      { name: "Smithsonian's National Zoo", short: "National Zoo", kind: "zoo", city: "Washington, DC", country: "United States", lat: 38.929, lon: -77.049,
        note: "Bao Li and Qing Bao arrived in 2024. The zoo runs a free live panda cam.",
        cam: { name: "Smithsonian Giant Panda Cam", url: "https://nationalzoo.si.edu/webcams/panda-cam" } },
      { name: "San Diego Zoo", kind: "zoo", city: "San Diego, California", country: "United States", lat: 32.736, lon: -117.151, note: "Yun Chuan and Xin Bao arrived in 2024.", cam: null },
      { name: "Chapultepec Zoo", kind: "zoo", city: "Mexico City", country: "Mexico", lat: 19.423, lon: -99.191, note: "Xin Xin is one of the few pandas that belong to a zoo outside China.", cam: null },
    ],
  },
];

import {VisualQueries} from "./visualQueries.js";


async function main(){
    // let fp = 'data/aviz_ilda.json';
    // let fp = 'data/miserables.json';
    // let fp = "../../data/buenosAires_uni_1790_1810_bc.json";
    // let fp = "data/buenosAires_uni_1700_1800_bc.json";
    // let fp = "data/buenosAires_uni_1780_1820_bc.json";
    // let data = await request(fp);

    let visualQueries = new VisualQueries();
    visualQueries.loadDataFromNeo4j();
    // visualQueries.init(data);
    visualQueries.setupEvents();
}


main();


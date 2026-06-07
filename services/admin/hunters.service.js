import { getAllHuntersModel, getTotalHuntersModel } from "../../models/admin/hunters.model.js";

const getAllHuntersService = async (limit, page, username, filter) => {
    const offset = (page - 1) * limit;
    const hunters = await getAllHuntersModel(limit, offset, username, filter);

    return { hunters, message: "Hunters fetched successfully!" };
}

const getTotalHuntersService = async () => {
    const totalHunters = await getTotalHuntersModel();

    return { totalHunters, message: "Hunters fetched successfully!" };
}

export {
    getAllHuntersService,
    getTotalHuntersService
}
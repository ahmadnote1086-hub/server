import { getAllHuntersService, getTotalHuntersService} from "../../services/admin/hunters.service.js";

const getAllHuntersController = async (req, res) => {
    const filter = req.params?.filter;
    const { page, limit, username } = req.query;
    try {
        const result = await getAllHuntersService(limit, page, username, filter);

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
}
const getTotalHuntersController = async (req, res) => {
    try {
        const result = await getTotalHuntersService();

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
}

export {
    getAllHuntersController,
    getTotalHuntersController
}
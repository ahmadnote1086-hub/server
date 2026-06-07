import { fetchReviewsService, deleteReviewService, replyReviewService } from "../../services/admin/reviews.service.js";

const fetchReviewsController = async (req, res) => {
    try {
        const result = await fetchReviewsService();

        res.status(200).json({ message: result.message, reviews: result.reviews });
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
}

const deleteReviewController = async (req, res) => {
    const id = req.params.id;
    try {
        const result = await deleteReviewService(id);

        res.status(200).json({ message: result.message });
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
}

const replyReviewController = async (req, res) => {
    const { message, review } = req.body;
    try { 
        const result = await replyReviewService(message, review);

        res.status(200).json({ message: result.message });
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json(error);
    }
}

export {
    fetchReviewsController,
    deleteReviewController,
    replyReviewController
}
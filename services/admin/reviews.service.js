import { fetchReviewsModel, deleteReviewModel, addNotificationModel, updateRepliedStatusModel } from "../../models/admin/reviews.model.js";

const fetchReviewsService = async () => {
    const reviews = await fetchReviewsModel();

    return { reviews, message: "Quest fetched successfully!" };
}

const deleteReviewService = async (id) => {
    await deleteReviewModel(id);

    return { message: "Quest deleted successfully!" };
}

const replyReviewService = async (message, review) => {
    const title = 'Reply to your review';
    const result = await addNotificationModel(title, message, review.user_id, "reply", "review", review.review_id); // title, message, user_id, type, reference_type, reference_id
    await updateRepliedStatusModel(review.review_id);

    return { result, message: "Reply sent successfully!" };
}

export {
    fetchReviewsService,
    deleteReviewService,
    replyReviewService
}   